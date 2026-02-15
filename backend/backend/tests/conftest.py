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

# MinIO/S3 config for tests (not actually used in tests, but needed for imports)
if "MINIO_ENDPOINT" not in os.environ:
    os.environ["MINIO_ENDPOINT"] = "http://minio:9000"
if "MINIO_ACCESS_KEY" not in os.environ:
    os.environ["MINIO_ACCESS_KEY"] = "minioadmin"
if "MINIO_SECRET_KEY" not in os.environ:
    os.environ["MINIO_SECRET_KEY"] = "minioadmin"
if "MINIO_BUCKET_NAME" not in os.environ:
    os.environ["MINIO_BUCKET_NAME"] = "card-images"
if "MINIO_USE_SSL" not in os.environ:
    os.environ["MINIO_USE_SSL"] = "false"

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
def mock_storage_service():
    """Mock StorageService to avoid S3/MinIO connections in tests."""
    from app.services import storage_service as storage_service_module
    from app.services.storage_service import FileType

    # Create a mock storage service that doesn't require boto3
    class MockStorageService:
        # Image settings
        IMAGE_ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
        IMAGE_MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

        # Audio settings
        AUDIO_ALLOWED_MIME_TYPES = {
            "audio/mpeg",  # mp3
            "audio/mp4",  # m4a
            "audio/wav",
            "audio/webm",
            "audio/ogg",  # opus
        }
        AUDIO_MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

        def validate_file(
            self,
            filename: str,
            content_type: str,
            file_size: int,
            file_type: FileType = FileType.IMAGE,
        ) -> None:
            """Validate file before upload."""
            if file_type == FileType.IMAGE:
                allowed_types = self.IMAGE_ALLOWED_MIME_TYPES
                max_size = self.IMAGE_MAX_FILE_SIZE
            else:  # AUDIO
                allowed_types = self.AUDIO_ALLOWED_MIME_TYPES
                max_size = self.AUDIO_MAX_FILE_SIZE

            if content_type not in allowed_types:
                raise ValueError(
                    f"Invalid file type: {content_type}. " f"Allowed: {', '.join(allowed_types)}"
                )
            if file_size > max_size:
                raise ValueError(
                    f"File too large: {file_size} bytes. "
                    f"Max size: {max_size} bytes ({max_size // (1024 * 1024)}MB)"
                )

        def generate_object_key(
            self,
            card_id: str,
            side: str,
            file_type: FileType,
            original_filename: str,
        ) -> str:
            """Generate unique object key for uploaded file."""
            ext = (
                original_filename.rsplit(".", 1)[-1].lower()
                if "." in original_filename
                else ("jpg" if file_type == FileType.IMAGE else "mp3")
            )
            unique_id = str(uuid.uuid4())
            type_prefix = "audio" if file_type == FileType.AUDIO else "cards"
            return f"{type_prefix}/{card_id[:8]}/{card_id}_{side}_{unique_id}.{ext}"

        def upload_file(
            self,
            file_data,
            filename,
            content_type,
            card_id,
            side,
            file_type: FileType = FileType.IMAGE,
        ):
            """Mock upload that returns a fake URL without touching S3."""
            self.validate_file(filename, content_type, len(file_data), file_type)
            ext = (
                filename.rsplit(".", 1)[-1].lower()
                if "." in filename
                else "jpg" if file_type == FileType.IMAGE else "mp3"
            )
            unique_id = str(uuid.uuid4())
            url_prefix = "/audio/" if file_type == FileType.AUDIO else "/images/"
            type_prefix = "audio" if file_type == FileType.AUDIO else "cards"
            return f"{url_prefix}{type_prefix}/{card_id[:8]}/{card_id}_{side}_{unique_id}.{ext}"

        def delete_file(self, object_url):
            """Mock delete that does nothing."""
            pass

    # Replace the singleton instance before any code tries to use it
    storage_service_module._storage_service_instance = MockStorageService()

    yield

    # Reset after test
    storage_service_module._storage_service_instance = None


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
        is_email_verified=True,  # Подтверждён email для тестов
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
