"""Tests for card level image upload/delete endpoints and MCQ option images."""

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


@pytest.fixture(scope="function")
def test_mcq_card(db, test_user, test_deck):
    """Create a test MCQ card with options."""
    card = Card(
        deck_id=test_deck.id,
        title="Test MCQ Card",
        type="multiple_choice",
        max_level=0,
    )
    db.add(card)
    db.flush()

    level = CardLevel(
        card_id=card.id,
        level_index=0,
        content={
            "question": "Test MCQ Question",
            "options": [
                {"id": "opt1", "text": "Option 1"},
                {"id": "opt2", "text": "Option 2"},
                {"id": "opt3", "text": "Option 3"},
            ],
            "correctOptionId": "opt1",
            "explanation": "Test explanation",
        },
    )
    db.add(level)
    db.commit()
    db.refresh(card)
    return card


class TestLevelImageUpload:
    """Tests for level-specific image upload endpoints."""

    def test_upload_level_question_image_success(self, client: TestClient, test_card, auth_headers):
        """Test successful question image upload for a specific level."""
        image_data = b"fake_image_data" * 1000

        response = client.post(
            f"/api/cards/{test_card.id}/levels/0/question-image",
            headers=auth_headers,
            files={"file": ("test.jpg", BytesIO(image_data), "image/jpeg")},
        )

        assert response.status_code == 200
        data = response.json()
        assert "question_image_urls" in data
        assert isinstance(data["question_image_urls"], list)
        assert len(data["question_image_urls"]) == 1
        assert data["question_image_urls"][0].startswith("/images/")

    def test_upload_level_answer_image_success(self, client: TestClient, test_card, auth_headers):
        """Test successful answer image upload for a specific level."""
        image_data = b"fake_image_data" * 1000

        response = client.post(
            f"/api/cards/{test_card.id}/levels/1/answer-image",
            headers=auth_headers,
            files={"file": ("test.jpg", BytesIO(image_data), "image/jpeg")},
        )

        assert response.status_code == 200
        data = response.json()
        assert "answer_image_urls" in data
        assert isinstance(data["answer_image_urls"], list)
        assert len(data["answer_image_urls"]) == 1
        assert data["answer_image_urls"][0].startswith("/images/")

    def test_upload_multiple_images_to_same_level(
        self, client: TestClient, test_card, auth_headers
    ):
        """Test that multiple images can be uploaded to the same level."""
        image_data = b"fake_image_data" * 1000

        # Upload first image
        response1 = client.post(
            f"/api/cards/{test_card.id}/levels/0/question-image",
            headers=auth_headers,
            files={"file": ("test1.jpg", BytesIO(image_data), "image/jpeg")},
        )
        assert response1.status_code == 200
        urls1 = response1.json()["question_image_urls"]
        assert len(urls1) == 1

        # Upload second image
        response2 = client.post(
            f"/api/cards/{test_card.id}/levels/0/question-image",
            headers=auth_headers,
            files={"file": ("test2.jpg", BytesIO(image_data), "image/jpeg")},
        )
        assert response2.status_code == 200
        urls2 = response2.json()["question_image_urls"]
        assert len(urls2) == 2
        # First image should still be there
        assert urls2[0] == urls1[0]

    def test_upload_different_levels_different_images(
        self, client: TestClient, test_card, auth_headers
    ):
        """Test that different levels can have different images."""
        image_data = b"fake_image_data" * 1000

        # Upload to level 0
        response1 = client.post(
            f"/api/cards/{test_card.id}/levels/0/question-image",
            headers=auth_headers,
            files={"file": ("test1.jpg", BytesIO(image_data), "image/jpeg")},
        )
        assert response1.status_code == 200
        url1 = response1.json()["question_image_urls"][0]

        # Upload to level 1
        response2 = client.post(
            f"/api/cards/{test_card.id}/levels/1/question-image",
            headers=auth_headers,
            files={"file": ("test2.jpg", BytesIO(image_data), "image/jpeg")},
        )
        assert response2.status_code == 200
        url2 = response2.json()["question_image_urls"][0]

        # URLs should be different
        assert url1 != url2

    def test_upload_level_image_max_limit(self, client: TestClient, test_card, auth_headers):
        """Test that max 10 images per side is enforced."""
        image_data = b"fake_image_data" * 1000

        # Upload 10 images (should succeed)
        for i in range(10):
            response = client.post(
                f"/api/cards/{test_card.id}/levels/0/question-image",
                headers=auth_headers,
                files={"file": (f"test{i}.jpg", BytesIO(image_data), "image/jpeg")},
            )
            assert response.status_code == 200

        # Try to upload 11th image (should fail)
        response = client.post(
            f"/api/cards/{test_card.id}/levels/0/question-image",
            headers=auth_headers,
            files={"file": ("test11.jpg", BytesIO(image_data), "image/jpeg")},
        )
        assert response.status_code == 422
        assert "Maximum" in response.json()["detail"]

    def test_upload_level_image_unauthorized(self, client: TestClient, test_card):
        """Test upload without auth fails."""
        response = client.post(
            f"/api/cards/{test_card.id}/levels/0/question-image",
            files={"file": ("test.jpg", BytesIO(b"data"), "image/jpeg")},
        )
        assert response.status_code == 401

    def test_upload_level_image_invalid_type(self, client: TestClient, test_card, auth_headers):
        """Test upload with invalid file type."""
        response = client.post(
            f"/api/cards/{test_card.id}/levels/0/question-image",
            headers=auth_headers,
            files={"file": ("test.pdf", BytesIO(b"data"), "application/pdf")},
        )
        assert response.status_code == 422
        assert "Invalid file type" in response.json()["detail"]

    def test_upload_level_image_too_large(self, client: TestClient, test_card, auth_headers):
        """Test upload with file > 5MB."""
        large_data = b"x" * (6 * 1024 * 1024)  # 6MB
        response = client.post(
            f"/api/cards/{test_card.id}/levels/0/question-image",
            headers=auth_headers,
            files={"file": ("large.jpg", BytesIO(large_data), "image/jpeg")},
        )
        assert response.status_code == 422
        assert (
            "File too large" in response.json()["detail"]
            or "File size must be less than 5MB" in response.json()["detail"]
        )

    def test_upload_level_image_not_found(self, client: TestClient, test_card, auth_headers):
        """Test upload to non-existent level."""
        response = client.post(
            f"/api/cards/{test_card.id}/levels/99/question-image",
            headers=auth_headers,
            files={"file": ("test.jpg", BytesIO(b"data"), "image/jpeg")},
        )
        assert response.status_code == 404


class TestLevelImageDelete:
    """Tests for level image deletion endpoints."""

    def test_delete_level_question_image_by_index(
        self, client: TestClient, test_card, auth_headers, db
    ):
        """Test successful question image deletion by index."""
        # Upload two images first
        client.post(
            f"/api/cards/{test_card.id}/levels/0/question-image",
            headers=auth_headers,
            files={"file": ("test1.jpg", BytesIO(b"data1"), "image/jpeg")},
        )
        client.post(
            f"/api/cards/{test_card.id}/levels/0/question-image",
            headers=auth_headers,
            files={"file": ("test2.jpg", BytesIO(b"data2"), "image/jpeg")},
        )

        # Delete the first image (index 0)
        response = client.delete(
            f"/api/cards/{test_card.id}/levels/0/question-image/0",
            headers=auth_headers,
        )
        assert response.status_code == 204

        # Verify from DB - should have 1 image left
        level = (
            db.query(CardLevel)
            .filter(CardLevel.card_id == test_card.id, CardLevel.level_index == 0)
            .first()
        )
        assert len(level.question_image_urls) == 1

    def test_delete_level_answer_image_by_index(
        self, client: TestClient, test_card, auth_headers, db
    ):
        """Test successful answer image deletion by index."""
        # Upload an image first
        client.post(
            f"/api/cards/{test_card.id}/levels/1/answer-image",
            headers=auth_headers,
            files={"file": ("test.jpg", BytesIO(b"data"), "image/jpeg")},
        )

        # Delete it
        response = client.delete(
            f"/api/cards/{test_card.id}/levels/1/answer-image/0",
            headers=auth_headers,
        )
        assert response.status_code == 204

        # Verify it's deleted from DB (array should be None or empty)
        level = (
            db.query(CardLevel)
            .filter(CardLevel.card_id == test_card.id, CardLevel.level_index == 1)
            .first()
        )
        assert level.answer_image_urls is None or len(level.answer_image_urls) == 0

    def test_delete_level_image_unauthorized(self, client: TestClient, test_card):
        """Test delete without auth fails."""
        response = client.delete(f"/api/cards/{test_card.id}/levels/0/question-image/0")
        assert response.status_code == 401

    def test_delete_level_image_invalid_index(self, client: TestClient, test_card, auth_headers):
        """Test delete with invalid index."""
        # Upload an image first
        client.post(
            f"/api/cards/{test_card.id}/levels/0/question-image",
            headers=auth_headers,
            files={"file": ("test.jpg", BytesIO(b"data"), "image/jpeg")},
        )

        # Try to delete index 5 (doesn't exist)
        response = client.delete(
            f"/api/cards/{test_card.id}/levels/0/question-image/5",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_delete_level_image_when_empty(self, client: TestClient, test_card, auth_headers):
        """Test delete when no images exist."""
        response = client.delete(
            f"/api/cards/{test_card.id}/levels/0/question-image/0",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_delete_level_image_not_found_level(self, client: TestClient, test_card, auth_headers):
        """Test delete from non-existent level."""
        response = client.delete(
            f"/api/cards/{test_card.id}/levels/99/question-image/0",
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestMCQOptionImageUpload:
    """Tests for MCQ option image upload."""

    def test_upload_option_image_success(self, client: TestClient, test_mcq_card, auth_headers):
        """Test successful option image upload."""
        image_data = b"fake_image_data" * 1000

        response = client.post(
            f"/api/cards/{test_mcq_card.id}/option-image",
            headers=auth_headers,
            data={"option_id": "opt1"},
            files={"file": ("test.jpg", BytesIO(image_data), "image/jpeg")},
        )

        assert response.status_code == 200
        data = response.json()
        assert "content" in data
        assert "options" in data["content"]
        options = data["content"]["options"]
        opt1 = next((o for o in options if o["id"] == "opt1"), None)
        assert opt1 is not None
        assert "image_url" in opt1
        assert opt1["image_url"].startswith("/images/")

    def test_upload_option_image_unauthorized(self, client: TestClient, test_mcq_card):
        """Test upload without auth fails."""
        response = client.post(
            f"/api/cards/{test_mcq_card.id}/option-image",
            data={"option_id": "opt1"},
            files={"file": ("test.jpg", BytesIO(b"data"), "image/jpeg")},
        )
        assert response.status_code == 401

    def test_upload_option_image_invalid_type(
        self, client: TestClient, test_mcq_card, auth_headers
    ):
        """Test upload with invalid file type."""
        response = client.post(
            f"/api/cards/{test_mcq_card.id}/option-image",
            headers=auth_headers,
            data={"option_id": "opt1"},
            files={"file": ("test.pdf", BytesIO(b"data"), "application/pdf")},
        )
        assert response.status_code == 422
        assert "Invalid file type" in response.json()["detail"]

    def test_upload_option_image_too_large(self, client: TestClient, test_mcq_card, auth_headers):
        """Test upload with file > 5MB."""
        large_data = b"x" * (6 * 1024 * 1024)  # 6MB
        response = client.post(
            f"/api/cards/{test_mcq_card.id}/option-image",
            headers=auth_headers,
            data={"option_id": "opt1"},
            files={"file": ("large.jpg", BytesIO(large_data), "image/jpeg")},
        )
        assert response.status_code == 422
        assert (
            "File too large" in response.json()["detail"]
            or "File size must be less than 5MB" in response.json()["detail"]
        )

    def test_upload_option_image_replaces_old(
        self, client: TestClient, test_mcq_card, auth_headers
    ):
        """Test that uploading a new image replaces the old one."""
        image_data = b"fake_image_data" * 1000

        # Upload first image
        response1 = client.post(
            f"/api/cards/{test_mcq_card.id}/option-image",
            headers=auth_headers,
            data={"option_id": "opt1"},
            files={"file": ("test1.jpg", BytesIO(image_data), "image/jpeg")},
        )
        assert response1.status_code == 200
        url1 = response1.json()["content"]["options"][0]["image_url"]

        # Upload second image
        response2 = client.post(
            f"/api/cards/{test_mcq_card.id}/option-image",
            headers=auth_headers,
            data={"option_id": "opt1"},
            files={"file": ("test2.jpg", BytesIO(image_data), "image/jpeg")},
        )
        assert response2.status_code == 200
        url2 = response2.json()["content"]["options"][0]["image_url"]

        # URLs should be different
        assert url1 != url2

    def test_upload_option_image_different_options(
        self, client: TestClient, test_mcq_card, auth_headers
    ):
        """Test that different options can have different images."""
        image_data = b"fake_image_data" * 1000

        # Upload to opt1
        response1 = client.post(
            f"/api/cards/{test_mcq_card.id}/option-image",
            headers=auth_headers,
            data={"option_id": "opt1"},
            files={"file": ("test1.jpg", BytesIO(image_data), "image/jpeg")},
        )
        assert response1.status_code == 200
        url1 = response1.json()["content"]["options"][0]["image_url"]

        # Upload to opt2
        response2 = client.post(
            f"/api/cards/{test_mcq_card.id}/option-image",
            headers=auth_headers,
            data={"option_id": "opt2"},
            files={"file": ("test2.jpg", BytesIO(image_data), "image/jpeg")},
        )
        assert response2.status_code == 200

        # Verify the responses contain different image URLs
        options2 = response2.json()["content"]["options"]
        opt2_with_image = next(o for o in options2 if o["id"] == "opt2")
        url2 = opt2_with_image["image_url"]

        assert url1 is not None
        assert url2 is not None
        assert url1 != url2


class TestLevelImagesInResponses:
    """Tests that level image URLs are included in API responses."""

    def test_cards_review_with_levels_includes_level_images(
        self, client: TestClient, test_card, auth_headers, db
    ):
        """Test that /api/cards/review_with_levels includes level image URLs."""
        level = (
            db.query(CardLevel)
            .filter(CardLevel.card_id == test_card.id, CardLevel.level_index == 0)
            .first()
        )
        level.question_image_urls = ["/images/test/question1.jpg", "/images/test/question2.jpg"]
        level.answer_image_urls = ["/images/test/answer.jpg"]
        db.commit()

        response = client.get("/api/cards/review_with_levels", headers=auth_headers)
        assert response.status_code == 200

        cards = response.json()
        if cards:
            card_data = cards[0]
            level_data = card_data["levels"][0]
            assert "question_image_urls" in level_data
            assert "answer_image_urls" in level_data
            assert level_data["question_image_urls"] == [
                "/images/test/question1.jpg",
                "/images/test/question2.jpg",
            ]
            assert level_data["answer_image_urls"] == ["/images/test/answer.jpg"]

    def test_study_cards_includes_level_image_urls(
        self, client: TestClient, test_card, test_deck, auth_headers, db
    ):
        """Test that /api/decks/{deck_id}/study-cards includes level image URLs."""
        level = (
            db.query(CardLevel)
            .filter(CardLevel.card_id == test_card.id, CardLevel.level_index == 0)
            .first()
        )
        level.question_image_urls = ["/images/test/question.jpg"]
        level.answer_image_urls = ["/images/test/answer.jpg"]
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
            assert "questionImageUrls" in level_data
            assert "answerImageUrls" in level_data
            assert level_data["questionImageUrls"] == ["/images/test/question.jpg"]
            assert level_data["answerImageUrls"] == ["/images/test/answer.jpg"]
