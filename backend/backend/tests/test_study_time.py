"""Tests for study time calculation."""

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.models.card import Card
from app.models.card_level import CardLevel
from app.models.card_review_history import CardReviewHistory


@pytest.fixture(scope="function")
def test_card(db, test_user, test_deck):
    """Create a test card with levels."""
    card = Card(
        deck_id=test_deck.id,
        title="Test Card",
        type="flashcard",
        max_level=1,
    )
    db.add(card)
    db.flush()

    # Create levels
    level = CardLevel(
        card_id=card.id,
        level_index=0,
        content={"question": "Question", "answer": "Answer"},
    )
    db.add(level)
    db.commit()
    db.refresh(card)
    return card


class TestStudyTimeCalculation:
    """Tests for study time calculation in statistics."""

    def test_study_time_counts_from_show_to_rating(
        self, client: TestClient, test_card, auth_headers, db
    ):
        """Test that study time is calculated from show_at to rated_at, not reveal_at."""
        now = datetime.now(timezone.utc)

        # Simulate a study session:
        # 1. Card shown at 10:00:00
        # 2. Card revealed (flipped) at 10:00:30 (30 seconds reading question)
        # 3. Card rated at 10:01:00 (30 seconds viewing answer)
        # Total study time should be 60 seconds (1 minute)
        show_at = now
        revealed_at = now + timedelta(seconds=30)
        rated_at = now + timedelta(seconds=60)

        # Make review request with timing
        response = client.post(
            f"/api/cards/{test_card.id}/review",
            headers=auth_headers,
            json={
                "rating": "good",
                "shownAt": show_at.isoformat(),
                "revealedAt": revealed_at.isoformat(),
                "ratedAt": rated_at.isoformat(),
            },
        )

        assert response.status_code == 200

        # Verify the history record was created correctly
        history = db.query(CardReviewHistory).filter_by(card_id=test_card.id).first()

        assert history is not None
        assert history.show_at == show_at
        assert history.reveal_at == revealed_at
        assert history.reviewed_at == rated_at

        # Verify the time calculation:
        # study_time = rated_at - show_at = 60 seconds = 1 minute
        expected_time_seconds = 60
        actual_time_seconds = int((history.reviewed_at - history.show_at).total_seconds())

        assert actual_time_seconds == expected_time_seconds

    def test_study_time_without_reveal(self, client: TestClient, test_card, auth_headers, db):
        """Test study time when user rates without revealing the card."""
        now = datetime.now(timezone.utc)

        # User rates immediately without flipping:
        # 1. Card shown at 10:00:00
        # 2. Card rated at 10:00:45 (no reveal)
        # Total study time should be 45 seconds
        show_at = now
        rated_at = now + timedelta(seconds=45)

        response = client.post(
            f"/api/cards/{test_card.id}/review",
            headers=auth_headers,
            json={
                "rating": "again",
                "shownAt": show_at.isoformat(),
                "revealedAt": None,  # No reveal
                "ratedAt": rated_at.isoformat(),
            },
        )

        assert response.status_code == 200

        history = db.query(CardReviewHistory).filter_by(card_id=test_card.id).first()
        assert history is not None

        # study_time = rated_at - show_at = 45 seconds
        actual_time_seconds = int((history.reviewed_at - history.show_at).total_seconds())
        assert actual_time_seconds == 45

    def test_dashboard_stats_aggregates_study_time(
        self, client: TestClient, test_card, auth_headers
    ):
        """Test that dashboard stats correctly sum up study time across multiple reviews."""
        now = datetime.now(timezone.utc)

        # Simulate 3 study sessions with different times:
        # Session 1: 60 seconds
        # Session 2: 90 seconds
        # Session 3: 30 seconds
        # Total: 180 seconds = 3 minutes

        sessions = [
            (60, "good"),
            (90, "hard"),
            (30, "easy"),
        ]

        for duration_seconds, rating in sessions:
            show_at = now
            rated_at = now + timedelta(seconds=duration_seconds)

            client.post(
                f"/api/cards/{test_card.id}/review",
                headers=auth_headers,
                json={
                    "rating": rating,
                    "shownAt": show_at.isoformat(),
                    "ratedAt": rated_at.isoformat(),
                },
            )
            now = rated_at + timedelta(seconds=10)  # Small gap between sessions

        # Get dashboard stats
        response = client.get("/api/stats/dashboard", headers=auth_headers)
        assert response.status_code == 200

        stats = response.json()
        assert "time_spent_today" in stats

        # Total time: (60 + 90 + 30) / 60 = 3 minutes
        expected_minutes = 3
        actual_minutes = stats["time_spent_today"]

        assert actual_minutes == expected_minutes

    def test_multiple_cards_study_time_sum(
        self, client: TestClient, db, test_user, test_deck, auth_headers
    ):
        """Test that study time is summed across all cards reviewed today."""
        now = datetime.now(timezone.utc)

        # Create 2 cards
        for i in range(2):
            card = Card(
                deck_id=test_deck.id,
                title=f"Card {i}",
                type="flashcard",
                max_level=0,
            )
            db.add(card)
            db.flush()

            level = CardLevel(
                card_id=card.id,
                level_index=0,
                content={"question": f"Q{i}", "answer": f"A{i}"},
            )
            db.add(level)
        db.commit()

        cards = db.query(Card).filter(Card.deck_id == test_deck.id).all()

        # Review each card for different durations
        durations = [45, 75]  # seconds

        for card, duration in zip(cards, durations):
            show_at = now
            rated_at = now + timedelta(seconds=duration)

            client.post(
                f"/api/cards/{card.id}/review",
                headers=auth_headers,
                json={
                    "rating": "good",
                    "shownAt": show_at.isoformat(),
                    "ratedAt": rated_at.isoformat(),
                },
            )
            now = rated_at + timedelta(seconds=5)

        # Check stats
        response = client.get("/api/stats/dashboard", headers=auth_headers)
        assert response.status_code == 200

        stats = response.json()
        # Total: (45 + 75) / 60 = 2 minutes
        assert stats["time_spent_today"] == 2
