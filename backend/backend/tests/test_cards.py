"""Тесты для API карточек."""

import uuid

from fastapi.testclient import TestClient


def test_create_card_success(client: TestClient, test_deck, auth_headers):
    """Успешное создание карточки."""
    payload = {
        "deck_id": str(test_deck.id),
        "title": "Test Card",
        "type": "flashcard",
        "levels": [
            {
                "question": "What is 2+2?",
                "answer": "4",
            }
        ],
    }

    response = client.post("/api/cards/", json=payload, headers=auth_headers)

    assert response.status_code == 201
    data = response.json()
    assert "card_id" in data
    assert data["deck_id"] == str(test_deck.id)


def test_create_card_duplicate_title_fails(client: TestClient, test_deck, auth_headers):
    """Создание карточки с дублирующимся названием в той же колоде должно завершиться ошибкой."""
    card_payload = {
        "deck_id": str(test_deck.id),
        "title": "Duplicate Card",
        "type": "flashcard",
        "levels": [
            {
                "question": "Question 1",
                "answer": "Answer 1",
            }
        ],
    }

    # Создаём первую карточку
    response1 = client.post("/api/cards/", json=card_payload, headers=auth_headers)
    assert response1.status_code == 201

    # Пытаемся создать вторую карточку с тем же названием
    response2 = client.post("/api/cards/", json=card_payload, headers=auth_headers)
    assert response2.status_code == 409
    assert "already exists" in response2.json()["detail"].lower()


def test_create_card_same_title_different_deck(
    client: TestClient, test_user, test_deck, auth_headers, db
):
    """Создание карточек с одинаковым названием в разных колодах должно быть разрешено."""
    from app.models.deck import Deck
    from app.models.user_study_group import UserStudyGroup
    from app.models.user_study_group_deck import UserStudyGroupDeck

    # Создаём вторую колоду
    group2 = UserStudyGroup(user_id=test_user.id, title_override="Test Group 2")
    db.add(group2)
    db.flush()

    deck2 = Deck(
        owner_id=test_user.id,
        title="Test Deck 2",
        color="#00FF00",
        is_public=True,
    )
    db.add(deck2)
    db.flush()

    link = UserStudyGroupDeck(
        user_group_id=group2.id,
        deck_id=deck2.id,
        order_index=0,
    )
    db.add(link)
    db.commit()

    card_payload = {
        "deck_id": str(test_deck.id),
        "title": "Same Title Card",
        "type": "flashcard",
        "levels": [
            {
                "question": "Question",
                "answer": "Answer",
            }
        ],
    }

    # Создаём карточку в первой колоде
    response1 = client.post(
        "/api/cards/", json={**card_payload, "deck_id": str(test_deck.id)}, headers=auth_headers
    )
    assert response1.status_code == 201

    # Создаём карточку с тем же названием во второй колоде
    response2 = client.post(
        "/api/cards/", json={**card_payload, "deck_id": str(deck2.id)}, headers=auth_headers
    )
    assert response2.status_code == 201


def test_create_card_title_trim(client: TestClient, test_deck, auth_headers):
    """Проверка обрезки пробелов в названии."""
    payload = {
        "deck_id": str(test_deck.id),
        "title": "  Spaces Card  ",
        "type": "flashcard",
        "levels": [
            {
                "question": "Q",
                "answer": "A",
            }
        ],
    }

    response1 = client.post("/api/cards/", json=payload, headers=auth_headers)
    assert response1.status_code == 201

    # Пытаемся создать с тем же названием, но без пробелов по краям
    payload2 = {**payload, "title": "Spaces Card"}
    response2 = client.post("/api/cards/", json=payload2, headers=auth_headers)
    assert response2.status_code == 409


def test_create_card_empty_title_auto_generates(client: TestClient, test_deck, auth_headers):
    """Пустое название карточки должно автоматически генерироваться на основе названия колоды."""
    payload = {
        "deck_id": str(test_deck.id),
        "title": "   ",
        "type": "flashcard",
        "levels": [
            {
                "question": "Q",
                "answer": "A",
            }
        ],
    }

    response = client.post("/api/cards/", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    # Title should be auto-generated, not empty
    assert data["title"] is not None
    assert len(data["title"].strip()) > 0


def test_create_card_deck_not_found(client: TestClient, auth_headers):
    """Создание карточки в несуществующей колоде."""
    fake_deck_id = uuid.uuid4()
    payload = {
        "deck_id": str(fake_deck_id),
        "title": "Test Card",
        "type": "flashcard",
        "levels": [
            {
                "question": "Q",
                "answer": "A",
            }
        ],
    }

    response = client.post("/api/cards/", json=payload, headers=auth_headers)
    assert response.status_code == 404


def test_create_card_unauthorized_deck(client: TestClient, test_deck, db, auth_headers):
    """Попытка создать карточку в чужой колоде."""
    import uuid

    from app.core.security import hash_password
    from app.models.user import User

    # Создаём другого пользователя с уникальным email и подтверждённым email
    unique_email = f"other_{uuid.uuid4().hex[:8]}@example.com"
    other_user = User(
        username="otheruser",
        email=unique_email,
        password_hash=hash_password("password123"),
        is_email_verified=True,
    )
    db.add(other_user)
    db.commit()

    # Логинимся за другого пользователя
    login_response = client.post(
        "/api/auth/login",
        json={"email": unique_email, "password": "password123"},
    )
    other_token = login_response.json()["access_token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}

    payload = {
        "deck_id": str(test_deck.id),
        "title": "Test Card",
        "type": "flashcard",
        "levels": [
            {
                "question": "Q",
                "answer": "A",
            }
        ],
    }

    response = client.post("/api/cards/", json=payload, headers=other_headers)
    assert response.status_code == 403
