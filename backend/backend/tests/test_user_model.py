"""Тесты для модели User с базой данных."""

import uuid

import pytest

from app.core.security import hash_password
from app.models.user import User


class TestUserModel:
    """Тесты работы с моделью User в базе данных."""

    def test_create_user(self, db, cleanup_db):
        """Создание пользователя в БД."""
        user = User(
            username="testuser",
            email=f"test_{uuid.uuid4()}@example.com",
            password_hash=hash_password("password123"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        assert user.id is not None
        assert isinstance(user.id, uuid.UUID)
        assert user.username == "testuser"
        assert user.email is not None
        assert user.password_hash is not None
        assert user.is_email_verified is False

    def test_create_verified_user(self, db, cleanup_db):
        """Создание пользователя с подтверждённым email."""
        user = User(
            username="verifieduser",
            email=f"verified_{uuid.uuid4()}@example.com",
            password_hash=hash_password("password123"),
            is_email_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        assert user.is_email_verified is True

    def test_find_user_by_email(self, db, cleanup_db):
        """Поиск пользователя по email."""
        email = f"search_{uuid.uuid4()}@example.com"
        user = User(
            username="searchuser",
            email=email,
            password_hash=hash_password("password123"),
        )
        db.add(user)
        db.commit()

        found = db.query(User).filter(User.email == email).first()

        assert found is not None
        assert found.username == "searchuser"
        assert found.email == email

    def test_email_must_be_unique(self, db, cleanup_db):
        """Email должен быть уникальным."""
        email = f"duplicate_{uuid.uuid4()}@example.com"

        user1 = User(
            username="user1",
            email=email,
            password_hash=hash_password("password123"),
        )
        db.add(user1)
        db.commit()

        user2 = User(
            username="user2",
            email=email,  # тот же email
            password_hash=hash_password("password456"),
        )
        db.add(user2)

        # Должна быть ошибка при коммите
        with pytest.raises(Exception):  # IntegrityError
            db.commit()
        # Очищаем состояние сессии после ошибки
        db.rollback()

    def test_update_user_email(self, db, cleanup_db):
        """Обновление email пользователя."""
        user = User(
            username="updateme",
            email=f"old_{uuid.uuid4()}@example.com",
            password_hash=hash_password("password123"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        new_email = f"new_{uuid.uuid4()}@example.com"
        user.email = new_email
        db.commit()
        db.refresh(user)

        assert user.email == new_email

    def test_delete_user(self, db, cleanup_db):
        """Удаление пользователя."""
        user = User(
            username="deleteme",
            email=f"delete_{uuid.uuid4()}@example.com",
            password_hash=hash_password("password123"),
        )
        db.add(user)
        db.commit()
        user_id = user.id

        db.delete(user)
        db.commit()

        deleted = db.query(User).filter(User.id == user_id).first()
        assert deleted is None
