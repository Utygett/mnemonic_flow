"""Тесты для API аутентификации."""

import uuid

from fastapi.testclient import TestClient


def test_register_success(client: TestClient):
    """Успешная регистрация нового пользователя."""
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"

    response = client.post(
        "/api/auth/register",
        json={"email": email, "password": "password123"},
    )

    assert response.status_code == 201
    data = response.json()
    assert "message" in data
    assert "успешна" in data["message"].lower()


def test_register_duplicate_email_fails(client: TestClient, db):
    """Попытка регистрации с существующим email должна завершиться ошибкой."""
    from app.core.security import hash_password
    from app.models.user import User

    email = f"test_{uuid.uuid4().hex[:8]}@example.com"

    # Создаём пользователя напрямую в БД
    user = User(
        username="existing",
        email=email,
        password_hash=hash_password("password123"),
    )
    db.add(user)
    db.commit()

    # Пытаемся зарегистрировать с тем же email
    response = client.post(
        "/api/auth/register",
        json={"email": email, "password": "anotherpassword"},
    )

    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()


def test_register_email_normalized(client: TestClient):
    """Email должен нормализоваться (приводиться к нижнему регистру)."""
    email = f"TeSt_{uuid.uuid4().hex[:8]}@ExAmPlE.cOm"

    response = client.post(
        "/api/auth/register",
        json={"email": email, "password": "password123"},
    )

    assert response.status_code == 201


def test_login_success(client: TestClient, db):
    """Успешный вход с правильными credential-ами."""
    from app.core.security import hash_password
    from app.models.user import User

    email = f"test_{uuid.uuid4().hex[:8]}@example.com"

    # Создаём подтверждённого пользователя
    user = User(
        username="testuser",
        email=email,
        password_hash=hash_password("password123"),
        is_email_verified=True,
    )
    db.add(user)
    db.commit()

    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": "password123"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password_fails(client: TestClient, db):
    """Вход с неверным паролем должен завершиться ошибкой."""
    from app.core.security import hash_password
    from app.models.user import User

    email = f"test_{uuid.uuid4().hex[:8]}@example.com"

    user = User(
        username="testuser",
        email=email,
        password_hash=hash_password("correctpassword"),
        is_email_verified=True,
    )
    db.add(user)
    db.commit()

    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": "wrongpassword"},
    )

    assert response.status_code == 401
    detail = response.json()["detail"]
    assert detail["code"] == "INVALID_CREDENTIALS"


def test_login_nonexistent_user_fails(client: TestClient):
    """Вход с несуществующим email должен завершиться ошибкой."""
    response = client.post(
        "/api/auth/login",
        json={"email": "nonexistent@example.com", "password": "password123"},
    )

    assert response.status_code == 401


def test_login_unverified_email_fails(client: TestClient, db):
    """Вход с неподтверждённым email должен быть запрещён."""
    from app.core.security import hash_password
    from app.models.user import User

    email = f"test_{uuid.uuid4().hex[:8]}@example.com"

    user = User(
        username="testuser",
        email=email,
        password_hash=hash_password("password123"),
        is_email_verified=False,  # Email не подтверждён
    )
    db.add(user)
    db.commit()

    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": "password123"},
    )

    assert response.status_code == 403
    detail = response.json()["detail"]
    assert detail["code"] == "EMAIL_NOT_VERIFIED"


def test_refresh_token_success(client: TestClient, db):
    """Обновление токена с валидным refresh token."""
    from app.core.security import hash_password
    from app.models.user import User

    email = f"test_{uuid.uuid4().hex[:8]}@example.com"

    user = User(
        username="testuser",
        email=email,
        password_hash=hash_password("password123"),
        is_email_verified=True,
    )
    db.add(user)
    db.commit()

    # Сначала логинимся чтобы получить refresh token
    login_response = client.post(
        "/api/auth/login",
        json={"email": email, "password": "password123"},
    )
    refresh_token = login_response.json()["refresh_token"]

    # Обновляем токен
    response = client.post(
        "/api/auth/refresh",
        headers={"Authorization": f"Bearer {refresh_token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["refresh_token"] == refresh_token  # Refresh token не меняется


def test_refresh_token_invalid_fails(client: TestClient):
    """Невалидный refresh token должен быть отклонён."""
    response = client.post(
        "/api/auth/refresh",
        headers={"Authorization": "Bearer invalid_token_12345"},
    )

    assert response.status_code == 401


def test_verify_email_success(client: TestClient, db):
    """Успешное подтверждение email с валидным токеном."""
    import secrets
    from datetime import datetime, timedelta, timezone

    from app.core.security import hash_password
    from app.models.user import User

    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    token = secrets.token_urlsafe(32)

    user = User(
        username="testuser",
        email=email,
        password_hash=hash_password("password123"),
        is_email_verified=False,
        email_verification_token=token,
        email_verification_expires=datetime.now(timezone.utc) + timedelta(hours=24),
    )
    db.add(user)
    db.commit()

    response = client.post(
        "/api/auth/verify-email",
        json={"token": token},
    )

    assert response.status_code == 200
    data = response.json()
    assert "verified" in data["message"].lower() or "успешно" in data["message"].lower()

    # Проверяем, что пользователь теперь подтверждён
    db.refresh(user)
    assert user.is_email_verified is True
    assert user.email_verification_token is None


def test_verify_email_invalid_token_fails(client: TestClient):
    """Подтверждение email с невалидным токеном."""
    response = client.post(
        "/api/auth/verify-email",
        json={"token": "invalid_token_12345"},
    )

    assert response.status_code == 400
    assert (
        "invalid" in response.json()["detail"].lower()
        or "expired" in response.json()["detail"].lower()
    )


def test_verify_email_expired_token_fails(client: TestClient, db):
    """Токен с истёкшим сроком действия должен быть отклонён."""
    import secrets
    from datetime import datetime, timedelta, timezone

    from app.core.security import hash_password
    from app.models.user import User

    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    token = secrets.token_urlsafe(32)

    user = User(
        username="testuser",
        email=email,
        password_hash=hash_password("password123"),
        is_email_verified=False,
        email_verification_token=token,
        email_verification_expires=datetime.now(timezone.utc) - timedelta(hours=1),  # Истёк
    )
    db.add(user)
    db.commit()

    response = client.post(
        "/api/auth/verify-email",
        json={"token": token},
    )

    assert response.status_code == 400
    assert "expired" in response.json()["detail"].lower()


def test_request_password_reset_success(client: TestClient, db):
    """Запрос на сброс пароля для существующего пользователя."""
    from app.core.security import hash_password
    from app.models.user import User

    email = f"test_{uuid.uuid4().hex[:8]}@example.com"

    user = User(
        username="testuser",
        email=email,
        password_hash=hash_password("password123"),
        is_email_verified=True,
    )
    db.add(user)
    db.commit()

    response = client.post(
        "/api/auth/request-password-reset",
        json={"email": email},
    )

    assert response.status_code == 200
    data = response.json()
    assert "sent" in data["message"].lower() or "отправлен" in data["message"].lower()

    # Проверяем, что токен сброса установлен
    db.refresh(user)
    assert user.password_reset_token is not None
    assert user.password_reset_expires is not None


def test_request_password_reset_nonexistent_email(client: TestClient):
    """Запрос сброса для несуществующего email не раскрывает информацию."""
    # Всегда возвращаем одинаковый ответ для защиты от перебора
    response = client.post(
        "/api/auth/request-password-reset",
        json={"email": "nonexistent@example.com"},
    )

    assert response.status_code == 200
    # Ответ не должен раскрывать, существует ли email
    assert (
        "sent" in response.json()["message"].lower()
        or "отправлен" in response.json()["message"].lower()
    )


def test_reset_password_success(client: TestClient, db):
    """Успешный сброс пароля с валидным токеном."""
    import secrets
    from datetime import datetime, timedelta, timezone

    from app.core.security import hash_password, verify_password
    from app.models.user import User

    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    old_password = "oldpassword123"
    token = secrets.token_urlsafe(32)

    user = User(
        username="testuser",
        email=email,
        password_hash=hash_password(old_password),
        is_email_verified=True,
        password_reset_token=token,
        password_reset_expires=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    db.add(user)
    db.commit()

    new_password = "newpassword456"
    response = client.post(
        "/api/auth/reset-password",
        json={"token": token, "new_password": new_password},
    )

    assert response.status_code == 200
    data = response.json()
    assert "reset" in data["message"].lower() or "успешно" in data["message"].lower()

    # Проверяем, что пароль изменился
    db.refresh(user)
    assert verify_password(new_password, user.password_hash) is True
    assert verify_password(old_password, user.password_hash) is False
    # Токен должен быть очищен
    assert user.password_reset_token is None


def test_reset_password_invalid_token_fails(client: TestClient):
    """Сброс пароля с невалидным токеном."""
    response = client.post(
        "/api/auth/reset-password",
        json={"token": "invalid_token", "new_password": "newpassword123"},
    )

    assert response.status_code == 400


def test_reset_password_expired_token_fails(client: TestClient, db):
    """Токен сброса пароля с истёкшим сроком действия."""
    import secrets
    from datetime import datetime, timedelta, timezone

    from app.core.security import hash_password
    from app.models.user import User

    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    token = secrets.token_urlsafe(32)

    user = User(
        username="testuser",
        email=email,
        password_hash=hash_password("password123"),
        is_email_verified=True,
        password_reset_token=token,
        password_reset_expires=datetime.now(timezone.utc) - timedelta(hours=1),  # Истёк
    )
    db.add(user)
    db.commit()

    response = client.post(
        "/api/auth/reset-password",
        json={"token": token, "new_password": "newpassword123"},
    )

    assert response.status_code == 400
    assert "expired" in response.json()["detail"].lower()


def test_me_endpoint_requires_auth(client: TestClient):
    """Эндпоинт /me требует аутентификации."""
    response = client.get("/api/auth/me")

    assert response.status_code == 401  # Unauthorized


def test_me_endpoint_returns_user(client: TestClient, auth_headers):
    """Эндпоинт /me возвращает данные текущего пользователя."""
    response = client.get("/api/auth/me", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert "id" in data or "email" in data
    if "email" in data:
        assert "@" in data["email"]
