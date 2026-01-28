"""Tests for card level audio upload/delete endpoints."""

from io import BytesIO

import pytest
from fastapi.testclient import TestClient

from app.models.card import Card
from app.models.card_level import CardLevel


@pytest.fixture(scope="function")
def test_card(db, test_user, test_deck):
    """Create a test card with multiple levels."""
    card = Card(
        deck_id=test_deck.id,
        title="Test Card",
        type="flashcard",
        max_level=2,
    )
    db.add(card)
    db.flush()

    # Create multiple levels
    for i in range(3):
        level = CardLevel(
            card_id=card.id,
            level_index=i,
            content={"question": f"Test Question {i}", "answer": f"Test Answer {i}"},
        )
        db.add(level)
    db.commit()
    db.refresh(card)
    return card


class TestLevelAudioUpload:
    """Tests for level-specific audio upload endpoints."""

    def test_upload_level_question_audio_success(self, client: TestClient, test_card, auth_headers):
        """Test successful question audio upload for a specific level."""
        # Create a small fake audio file (mp3 header + minimal data)
        audio_data = b"ID3" + b"\x00" * 100 + b"fake_audio_data" * 500

        response = client.post(
            f"/api/cards/{test_card.id}/levels/0/question-audio",
            headers=auth_headers,
            files={"file": ("test.mp3", BytesIO(audio_data), "audio/mpeg")},
        )

        assert response.status_code == 200
        data = response.json()
        assert "question_audio_url" in data
        assert data["question_audio_url"].startswith("/audio/")

    def test_upload_level_answer_audio_success(self, client: TestClient, test_card, auth_headers):
        """Test successful answer audio upload for a specific level."""
        audio_data = b"ID3" + b"\x00" * 100 + b"fake_audio_data" * 500

        response = client.post(
            f"/api/cards/{test_card.id}/levels/1/answer-audio",
            headers=auth_headers,
            files={"file": ("test.mp3", BytesIO(audio_data), "audio/mpeg")},
        )

        assert response.status_code == 200
        data = response.json()
        assert "answer_audio_url" in data
        assert data["answer_audio_url"].startswith("/audio/")

    def test_upload_different_levels_different_audio(
        self, client: TestClient, test_card, auth_headers
    ):
        """Test that different levels can have different audio files."""
        audio_data = b"ID3" + b"\x00" * 100 + b"fake_audio_data" * 500

        # Upload to level 0
        response1 = client.post(
            f"/api/cards/{test_card.id}/levels/0/question-audio",
            headers=auth_headers,
            files={"file": ("test1.mp3", BytesIO(audio_data), "audio/mpeg")},
        )
        assert response1.status_code == 200
        url1 = response1.json()["question_audio_url"]

        # Upload to level 1
        response2 = client.post(
            f"/api/cards/{test_card.id}/levels/1/question-audio",
            headers=auth_headers,
            files={"file": ("test2.mp3", BytesIO(audio_data), "audio/mpeg")},
        )
        assert response2.status_code == 200
        url2 = response2.json()["question_audio_url"]

        # URLs should be different
        assert url1 != url2

    def test_upload_level_audio_unauthorized(self, client: TestClient, test_card):
        """Test upload without auth fails."""
        response = client.post(
            f"/api/cards/{test_card.id}/levels/0/question-audio",
            files={"file": ("test.mp3", BytesIO(b"data"), "audio/mpeg")},
        )
        assert response.status_code == 401

    def test_upload_level_audio_invalid_type(self, client: TestClient, test_card, auth_headers):
        """Test upload with invalid file type."""
        response = client.post(
            f"/api/cards/{test_card.id}/levels/0/question-audio",
            headers=auth_headers,
            files={"file": ("test.pdf", BytesIO(b"data"), "application/pdf")},
        )
        assert response.status_code == 422
        assert "Invalid file type" in response.json()["detail"]

    def test_upload_level_audio_too_large(self, client: TestClient, test_card, auth_headers):
        """Test upload with file > 10MB."""
        large_data = b"x" * (11 * 1024 * 1024)  # 11MB
        response = client.post(
            f"/api/cards/{test_card.id}/levels/0/question-audio",
            headers=auth_headers,
            files={"file": ("large.mp3", BytesIO(large_data), "audio/mpeg")},
        )
        assert response.status_code == 422
        assert "File too large" in response.json()["detail"]

    def test_upload_level_audio_replaces_old(self, client: TestClient, test_card, auth_headers):
        """Test that uploading a new audio file replaces the old one."""
        audio_data = b"ID3" + b"\x00" * 100 + b"fake_audio_data" * 500

        # Upload first audio
        response1 = client.post(
            f"/api/cards/{test_card.id}/levels/0/question-audio",
            headers=auth_headers,
            files={"file": ("test1.mp3", BytesIO(audio_data), "audio/mpeg")},
        )
        assert response1.status_code == 200
        first_url = response1.json()["question_audio_url"]

        # Upload second audio
        response2 = client.post(
            f"/api/cards/{test_card.id}/levels/0/question-audio",
            headers=auth_headers,
            files={"file": ("test2.mp3", BytesIO(audio_data), "audio/mpeg")},
        )
        assert response2.status_code == 200
        second_url = response2.json()["question_audio_url"]

        # URLs should be different
        assert first_url != second_url

    def test_upload_level_audio_not_found(self, client: TestClient, test_card, auth_headers):
        """Test upload to non-existent level."""
        response = client.post(
            f"/api/cards/{test_card.id}/levels/99/question-audio",
            headers=auth_headers,
            files={"file": ("test.mp3", BytesIO(b"data"), "audio/mpeg")},
        )
        assert response.status_code == 404

    def test_upload_audio_supported_formats(self, client: TestClient, test_card, auth_headers):
        """Test upload with different supported audio formats."""
        audio_data = b"ID3" + b"\x00" * 100 + b"fake_audio_data" * 500

        supported_formats = [
            ("audio.mp3", "audio/mpeg"),
            ("audio.m4a", "audio/mp4"),
            ("audio.wav", "audio/wav"),
            ("audio.webm", "audio/webm"),
            ("audio.ogg", "audio/ogg"),
        ]

        for filename, content_type in supported_formats:
            response = client.post(
                f"/api/cards/{test_card.id}/levels/0/question-audio",
                headers=auth_headers,
                files={"file": (filename, BytesIO(audio_data), content_type)},
            )
            assert response.status_code == 200, f"Failed for {content_type}"
            assert "question_audio_url" in response.json()


class TestLevelAudioDelete:
    """Tests for level audio deletion endpoints."""

    def test_delete_level_question_audio_success(
        self, client: TestClient, test_card, auth_headers, db
    ):
        """Test successful question audio deletion for a level."""
        audio_data = b"ID3" + b"\x00" * 100 + b"fake_audio_data" * 500

        # First upload an audio
        client.post(
            f"/api/cards/{test_card.id}/levels/0/question-audio",
            headers=auth_headers,
            files={"file": ("test.mp3", BytesIO(audio_data), "audio/mpeg")},
        )

        # Then delete it
        response = client.delete(
            f"/api/cards/{test_card.id}/levels/0/question-audio",
            headers=auth_headers,
        )
        assert response.status_code == 204

        # Verify it's deleted from DB
        level = (
            db.query(CardLevel)
            .filter(CardLevel.card_id == test_card.id, CardLevel.level_index == 0)
            .first()
        )
        assert level.question_audio_url is None

    def test_delete_level_answer_audio_success(
        self, client: TestClient, test_card, auth_headers, db
    ):
        """Test successful answer audio deletion for a level."""
        audio_data = b"ID3" + b"\x00" * 100 + b"fake_audio_data" * 500

        # First upload an audio
        client.post(
            f"/api/cards/{test_card.id}/levels/1/answer-audio",
            headers=auth_headers,
            files={"file": ("test.mp3", BytesIO(audio_data), "audio/mpeg")},
        )

        # Then delete it
        response = client.delete(
            f"/api/cards/{test_card.id}/levels/1/answer-audio",
            headers=auth_headers,
        )
        assert response.status_code == 204

        # Verify it's deleted from DB
        level = (
            db.query(CardLevel)
            .filter(CardLevel.card_id == test_card.id, CardLevel.level_index == 1)
            .first()
        )
        assert level.answer_audio_url is None

    def test_delete_level_audio_unauthorized(self, client: TestClient, test_card):
        """Test delete without auth fails."""
        response = client.delete(f"/api/cards/{test_card.id}/levels/0/question-audio")
        assert response.status_code == 401

    def test_delete_level_audio_when_none(self, client: TestClient, test_card, auth_headers):
        """Test delete when no audio exists returns 404 (level exists but no audio)."""
        # Note: The endpoint returns 404 if audio_url is None (no audio to delete)
        # This is different from the image endpoint behavior
        response = client.delete(
            f"/api/cards/{test_card.id}/levels/0/question-audio",
            headers=auth_headers,
        )
        # Currently returns 404 when audio_url is None
        assert response.status_code == 404

    def test_delete_level_audio_not_found(self, client: TestClient, test_card, auth_headers):
        """Test delete from non-existent level."""
        response = client.delete(
            f"/api/cards/{test_card.id}/levels/99/question-audio",
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestLevelAudioInResponses:
    """Tests that level audio URLs are included in API responses."""

    def test_cards_review_with_levels_includes_level_audio(
        self, client: TestClient, test_card, auth_headers, db
    ):
        """Test that /api/cards/review_with_levels includes level audio URLs."""
        level = (
            db.query(CardLevel)
            .filter(CardLevel.card_id == test_card.id, CardLevel.level_index == 0)
            .first()
        )
        level.question_audio_url = "/audio/test/question.mp3"
        level.answer_audio_url = "/audio/test/answer.mp3"
        db.commit()

        response = client.get("/api/cards/review_with_levels", headers=auth_headers)
        assert response.status_code == 200

        cards = response.json()
        if cards:
            card_data = cards[0]
            level_data = card_data["levels"][0]
            assert "question_audio_url" in level_data
            assert "answer_audio_url" in level_data
            assert level_data["question_audio_url"] == "/audio/test/question.mp3"
            assert level_data["answer_audio_url"] == "/audio/test/answer.mp3"

    def test_study_cards_includes_level_audio_urls(
        self, client: TestClient, test_card, test_deck, auth_headers, db
    ):
        """Test that /api/decks/{deck_id}/study-cards includes level audio URLs."""
        level = (
            db.query(CardLevel)
            .filter(CardLevel.card_id == test_card.id, CardLevel.level_index == 0)
            .first()
        )
        level.question_audio_url = "/audio/test/question.mp3"
        level.answer_audio_url = "/audio/test/answer.mp3"
        db.commit()

        response = client.get(
            f"/api/decks/{test_deck.id}/study-cards?mode=ordered",
            headers=auth_headers,
        )
        assert response.status_code == 200

        data = response.json()
        assert "cards" in data
        if data["cards"]:
            card_data = data["cards"][0]
            level_data = card_data["levels"][0]
            assert "questionAudioUrl" in level_data
            assert "answerAudioUrl" in level_data
            assert level_data["questionAudioUrl"] == "/audio/test/question.mp3"
            assert level_data["answerAudioUrl"] == "/audio/test/answer.mp3"

    def test_deck_session_includes_level_audio_urls(
        self, client: TestClient, test_card, test_deck, auth_headers, db
    ):
        """Test that /api/decks/{deck_id}/session includes level audio URLs."""
        level = (
            db.query(CardLevel)
            .filter(CardLevel.card_id == test_card.id, CardLevel.level_index == 0)
            .first()
        )
        level.question_audio_url = "/audio/test/question.mp3"
        level.answer_audio_url = "/audio/test/answer.mp3"
        db.commit()

        response = client.get(
            f"/api/decks/{test_deck.id}/session",
            headers=auth_headers,
        )
        assert response.status_code == 200

        cards = response.json()
        if cards:
            card_data = cards[0]
            level_data = card_data["levels"][0]
            assert "question_audio_url" in level_data
            assert "answer_audio_url" in level_data
            assert level_data["question_audio_url"] == "/audio/test/question.mp3"
            assert level_data["answer_audio_url"] == "/audio/test/answer.mp3"
