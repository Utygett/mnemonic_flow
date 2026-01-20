"""Pytest fixtures для тестирования с базой данных."""

import logging
import os
import uuid
import uuid as uuid_lib
import warnings

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import inspect, text

if "DATABASE_URL" not in os.environ:
    os.environ["DATABASE_URL"] = (
        "postgresql+psycopg2://flashcards_user:SPORTISLIFE@localhost:5432/flashcards"
    )
if "SECRET_KEY" not in os.environ:
    os.environ["SECRET_KEY"] = "CHANGE_ME_TO_LONG_RANDOM"
if "ALGORITHM" not in os.environ:
    os.environ["ALGORITHM"] = "HS256"
if "ACCESS_TOKEN_EXPIRE_MINUTES" not in os.environ:
    os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "360"

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal
from app.models.deck import Deck

# Импортируем модели для создания таблиц и использования в фикстурах
from app.models.study_group import StudyGroup  # noqa: F401 - needed for UserStudyGroup foreign key
from app.models.user import User
from app.models.user_study_group import UserStudyGroup
from app.models.user_study_group_deck import UserStudyGroupDeck

# Отключаем SQLAlchemy логирование
for logger_name in (
    "sqlalchemy",
    "sqlalchemy.engine",
    "sqlalchemy.pool",
    "sqlalchemy.orm",
    "sqlalchemy.dialects",
):
    logging.getLogger(logger_name).setLevel(logging.ERROR)

warnings.filterwarnings("ignore", category=DeprecationWarning)


@pytest.fixture(scope="function", autouse=True)
def init_database(db):
    """
    Создаёт таблицы в БД перед тестами.
    Запускается автоматически для всех тестов.
    """
    # Создаём все таблицы
    Base.metadata.create_all(bind=db.get_bind())
    yield
    # Очистка не нужна — cleanup_db разберётся


@pytest.fixture(scope="function")
def client() -> TestClient:
    # Импортируем app только внутри fixture, чтобы избежать вызова init_db() при импорте conftest
    from app.main import app

    return TestClient(app)


@pytest.fixture(scope="function")
def db():
    """Сессия базы данных для тестов."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def cleanup_db(db):
    """
    Гарантированно чистит БД после каждого теста (в т.ч. данные,
    созданные через API, и любые "побочные" сущности).

    Используй явно в тестах с БД через параметр:
    def test_something(db, cleanup_db):
        ...
    """
    yield

    inspector = inspect(db.get_bind())
    existing_tables = set(inspector.get_table_names())

    # Порядок тут не важен, потому что TRUNCATE ... CASCADE
    tables_wanted = [
        "users",
    ]

    tables = [t for t in tables_wanted if t in existing_tables]
    if not tables:
        return

    sql = "TRUNCATE TABLE " + ", ".join(tables) + " RESTART IDENTITY CASCADE"
    db.execute(text(sql))
    db.commit()


@pytest.fixture(scope="function")
def test_user(db):
    """Создаём юзера для тестов."""
    user = User(
        username="testuser",
        email=f"test_{uuid_lib.uuid4()}@example.com",
        password_hash=hash_password("password123"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture(scope="function")
def auth_token(client: TestClient, test_user: User):
    resp = client.post(
        "/api/auth/login",
        json={"email": test_user.email, "password": "password123"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest.fixture(scope="function")
def user_group(db, test_user: User) -> UserStudyGroup:
    group = UserStudyGroup(user_id=test_user.id, title_override="Test Group")
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@pytest.fixture(scope="function")
def test_deck(db, test_user: User, user_group: UserStudyGroup) -> Deck:
    deck = Deck(
        owner_id=test_user.id,
        title="Test Deck",
        color="#FF5733",
        is_public=True,
    )
    db.add(deck)
    db.flush()

    link = UserStudyGroupDeck(
        user_group_id=user_group.id,
        deck_id=deck.id,
        order_index=0,
    )
    db.add(link)

    db.commit()
    db.refresh(deck)
    return deck


@pytest.fixture(scope="function")
def auth_headers(auth_token: str) -> dict:
    return {"Authorization": f"Bearer {auth_token}"}


def _unique_email():
    return f"u{uuid.uuid4().hex[:10]}@example.com"


def register_and_login(client: TestClient, password: str = "secret123"):
    email = _unique_email()

    # register
    r = client.post("/api/auth/register", json={"email": email, "password": password})
    assert r.status_code in (200, 201), r.text  # у тебя может быть 200
    data = r.json()

    # token key может отличаться; делаем устойчиво
    access_token = data.get("access_token") or data.get("accesstoken")
    assert access_token, data
    return email, access_token


def create_deck(client: TestClient, token: str, title: str = "Deck"):
    r = client.post(
        "/api/decks/",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": title, "description": None, "color": None},
    )
    assert r.status_code in (200, 201), r.text
    d = r.json()

    deck_id = d.get("deck_id") or d.get("deckid")
    assert deck_id, d
    return deck_id
