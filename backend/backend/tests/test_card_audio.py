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
        assert "question_audio_urls" in data
        assert isinstance(data["question_audio_urls"], list)
        assert len(data["question_audio_urls"]) == 1
        assert data["question_audio_urls"][0].startswith("/audio/")

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
        assert "answer_audio_urls" in data
        assert isinstance(data["answer_audio_urls"], list)
        assert len(data["answer_audio_urls"]) == 1
        assert data["answer_audio_urls"][0].startswith("/audio/")

    def test_upload_multiple_audio_to_same_level(self, client: TestClient, test_card, auth_headers):
        """Test that multiple audio files can be uploaded to the same level."""
        audio_data = b"ID3" + b"\x00" * 100 + b"fake_audio_data" * 500

        # Upload first audio
        response1 = client.post(
            f"/api/cards/{test_card.id}/levels/0/question-audio",
            headers=auth_headers,
            files={"file": ("test1.mp3", BytesIO(audio_data), "audio/mpeg")},
        )
        assert response1.status_code == 200
        urls1 = response1.json()["question_audio_urls"]
        assert len(urls1) == 1

        # Upload second audio
        response2 = client.post(
            f"/api/cards/{test_card.id}/levels/0/question-audio",
            headers=auth_headers,
            files={"file": ("test2.mp3", BytesIO(audio_data), "audio/mpeg")},
        )
        assert response2.status_code == 200
        urls2 = response2.json()["question_audio_urls"]
        assert len(urls2) == 2
        # First audio should still be there
        assert urls2[0] == urls1[0]

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
        url1 = response1.json()["question_audio_urls"][0]

        # Upload to level 1
        response2 = client.post(
            f"/api/cards/{test_card.id}/levels/1/question-audio",
            headers=auth_headers,
            files={"file": ("test2.mp3", BytesIO(audio_data), "audio/mpeg")},
        )
        assert response2.status_code == 200
        url2 = response2.json()["question_audio_urls"][0]

        # URLs should be different
        assert url1 != url2

    def test_upload_level_audio_max_limit(self, client: TestClient, test_card, auth_headers):
        """Test that max 10 audio files per side is enforced."""
        audio_data = b"ID3" + b"\x00" * 100 + b"fake_audio_data" * 500

        # Upload 10 audio files (should succeed)
        for i in range(10):
            response = client.post(
                f"/api/cards/{test_card.id}/levels/0/question-audio",
                headers=auth_headers,
                files={"file": (f"test{i}.mp3", BytesIO(audio_data), "audio/mpeg")},
            )
            assert response.status_code == 200

        # Try to upload 11th audio file (should fail)
        response = client.post(
            f"/api/cards/{test_card.id}/levels/0/question-audio",
            headers=auth_headers,
            files={"file": ("test11.mp3", BytesIO(audio_data), "audio/mpeg")},
        )
        assert response.status_code == 422
        assert "Maximum" in response.json()["detail"]

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
        assert (
            "File too large" in response.json()["detail"]
            or "File size must be less than 10MB" in response.json()["detail"]
        )

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
            assert "question_audio_urls" in response.json()
            assert len(response.json()["question_audio_urls"]) > 0


class TestLevelAudioDelete:
    """Tests for level audio deletion endpoints."""

    def test_delete_level_question_audio_by_index(
        self, client: TestClient, test_card, auth_headers, db
    ):
        """Test successful question audio deletion by index."""
        audio_data = b"ID3" + b"\x00" * 100 + b"fake_audio_data" * 500

        # Upload two audio files first
        client.post(
            f"/api/cards/{test_card.id}/levels/0/question-audio",
            headers=auth_headers,
            files={"file": ("test1.mp3", BytesIO(audio_data), "audio/mpeg")},
        )
        client.post(
            f"/api/cards/{test_card.id}/levels/0/question-audio",
            headers=auth_headers,
            files={"file": ("test2.mp3", BytesIO(audio_data), "audio/mpeg")},
        )

        # Delete the first audio (index 0)
        response = client.delete(
            f"/api/cards/{test_card.id}/levels/0/question-audio/0",
            headers=auth_headers,
        )
        assert response.status_code == 204

        # Verify from DB - should have 1 audio left
        level = (
            db.query(CardLevel)
            .filter(CardLevel.card_id == test_card.id, CardLevel.level_index == 0)
            .first()
        )
        assert len(level.question_audio_urls) == 1

    def test_delete_level_answer_audio_by_index(
        self, client: TestClient, test_card, auth_headers, db
    ):
        """Test successful answer audio deletion by index."""
        audio_data = b"ID3" + b"\x00" * 100 + b"fake_audio_data" * 500

        # Upload an audio first
        client.post(
            f"/api/cards/{test_card.id}/levels/1/answer-audio",
            headers=auth_headers,
            files={"file": ("test.mp3", BytesIO(audio_data), "audio/mpeg")},
        )

        # Delete it
        response = client.delete(
            f"/api/cards/{test_card.id}/levels/1/answer-audio/0",
            headers=auth_headers,
        )
        assert response.status_code == 204

        # Verify it's deleted from DB (array should be None or empty)
        level = (
            db.query(CardLevel)
            .filter(CardLevel.card_id == test_card.id, CardLevel.level_index == 1)
            .first()
        )
        assert level.answer_audio_urls is None or len(level.answer_audio_urls) == 0

    def test_delete_level_audio_unauthorized(self, client: TestClient, test_card):
        """Test delete without auth fails."""
        response = client.delete(f"/api/cards/{test_card.id}/levels/0/question-audio/0")
        assert response.status_code == 401

    def test_delete_level_audio_invalid_index(self, client: TestClient, test_card, auth_headers):
        """Test delete with invalid index."""
        audio_data = b"ID3" + b"\x00" * 100 + b"fake_audio_data" * 500

        # Upload an audio first
        client.post(
            f"/api/cards/{test_card.id}/levels/0/question-audio",
            headers=auth_headers,
            files={"file": ("test.mp3", BytesIO(audio_data), "audio/mpeg")},
        )

        # Try to delete index 5 (doesn't exist)
        response = client.delete(
            f"/api/cards/{test_card.id}/levels/0/question-audio/5",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_delete_level_audio_when_empty(self, client: TestClient, test_card, auth_headers):
        """Test delete when no audio files exist."""
        response = client.delete(
            f"/api/cards/{test_card.id}/levels/0/question-audio/0",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_delete_level_audio_not_found_level(self, client: TestClient, test_card, auth_headers):
        """Test delete from non-existent level."""
        response = client.delete(
            f"/api/cards/{test_card.id}/levels/99/question-audio/0",
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
        level.question_audio_urls = ["/audio/test/question1.mp3", "/audio/test/question2.mp3"]
        level.answer_audio_urls = ["/audio/test/answer.mp3"]
        db.commit()

        response = client.get("/api/cards/review_with_levels", headers=auth_headers)
        assert response.status_code == 200

        cards = response.json()
        if cards:
            card_data = cards[0]
            level_data = card_data["levels"][0]
            assert "question_audio_urls" in level_data
            assert "answer_audio_urls" in level_data
            assert level_data["question_audio_urls"] == [
                "/audio/test/question1.mp3",
                "/audio/test/question2.mp3",
            ]
            assert level_data["answer_audio_urls"] == ["/audio/test/answer.mp3"]

    def test_study_cards_includes_level_audio_urls(
        self, client: TestClient, test_card, test_deck, auth_headers, db
    ):
        """Test that /api/decks/{deck_id}/study-cards includes level audio URLs."""
        level = (
            db.query(CardLevel)
            .filter(CardLevel.card_id == test_card.id, CardLevel.level_index == 0)
            .first()
        )
        level.question_audio_urls = ["/audio/test/question.mp3"]
        level.answer_audio_urls = ["/audio/test/answer.mp3"]
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
            assert "questionAudioUrls" in level_data
            assert "answerAudioUrls" in level_data
            assert level_data["questionAudioUrls"] == ["/audio/test/question.mp3"]
            assert level_data["answerAudioUrls"] == ["/audio/test/answer.mp3"]

    def test_deck_session_includes_level_audio_urls(
        self, client: TestClient, test_card, test_deck, auth_headers, db
    ):
        """Test that /api/decks/{deck_id}/session includes level audio URLs."""
        level = (
            db.query(CardLevel)
            .filter(CardLevel.card_id == test_card.id, CardLevel.level_index == 0)
            .first()
        )
        level.question_audio_urls = ["/audio/test/question.mp3"]
        level.answer_audio_urls = ["/audio/test/answer.mp3"]
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
            assert "question_audio_urls" in level_data
            assert "answer_audio_urls" in level_data
            assert level_data["question_audio_urls"] == ["/audio/test/question.mp3"]
            assert level_data["answer_audio_urls"] == ["/audio/test/answer.mp3"]
