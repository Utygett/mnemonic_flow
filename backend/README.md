# MnemonicFlow Backend

FastAPI backend для flashcard-приложения с интервальным повторением.

## 📁 Структура

```
backend/
├── backend/
│   ├── app/
│   │   ├── api/           # API эндпоинты (v1/)
│   │   ├── core/          # Конфигурация, безопасность, БД
│   │   ├── models/        # SQLAlchemy модели (User, Deck, Card...)
│   │   ├── schemas/       # Pydantic схемы (request/response)
│   │   └── services/      # Бизнес-логика
│   ├── tests/             # Тесты
│   ├── migrations/        # Alembic миграции БД
│   └── main.py            # Точка входа
├── Dockerfile
├── entrypoint.sh          # Скрипт инициализации контейнера
├── requirements.txt       # Зависимости Python
└── pyproject.toml         # Конфигурация проекта (pytest)
```

## 🚀 Быстрый старт

### Локальная разработка

```bash
# 1. Установ зависимости
pip install -r requirements.txt

# 2. Настрой переменные окружения (см. infra/.envExample.dev)
export DATABASE_URL="postgresql+psycopg2://user:pass@localhost:5432/dbname"
export SECRET_KEY="your-secret-key"
export ALGORITHM="HS256"
export ACCESS_TOKEN_EXPIRE_MINUTES="360"

# 3. Запусти сервер
uvicorn backend.app.main:app --reload --port 8000
```

API доступен по адресу `http://localhost:8000`

Документация: `http://localhost:8000/docs` (Swagger UI)

### Docker

```bash
# Из корня проекта
cd infra
docker compose -f compose.dev.yml up -d backend
```

## 🧪 Тесты

Тесты написаны с использованием **pytest** и расположены в `backend/tests/`.

### Запуск тестов

```bash
# Из корня backend-директории
pytest

# Конкретный тест-файл
pytest backend/tests/test_user_model.py

# С выводом print()
pytest -s

# С остановкой на первом падении
pytest -x

# С покрытием (нужен pytest-cov)
pytest --cov=backend/app --cov-report=html
```

### Структура тестов

```
backend/tests/
├── conftest.py            # Pytest fixtures (db, client, auth)
├── test_security.py       # Unit тесты (без БД)
├── test_user_model.py     # Integration тесты (с БД)
└── ...
```

### Fixtures

Основные фикстуры в `conftest.py`:

| Fixture | Описание | Scope |
|---------|----------|-------|
| `init_database` | Автоматически создаёт таблицы перед тестом | function, autouse |
| `db` | SQLAlchemy сессия БД | function |
| `cleanup_db` | Очищает БД после теста (TRUNCATE) | function, explicit |
| `client` | FastAPI TestClient для HTTP запросов | function |
| `test_user` | Создаёт тестового пользователя в БД | function |
| `auth_token` | JWT токен для test_user | function |
| `auth_headers` | Headers с Authorization: Bearer ... | function |

### Примеры тестов

**Unit тест (без БД):**
```python
# backend/tests/test_security.py
from app.core.security import hash_password, verify_password

def test_hash_and_verify():
    password = "mypassword123"
    hashed = hash_password(password)
    assert verify_password(password, hashed) is True
```

**Integration тест (с БД):**
```python
# backend/tests/test_user_model.py
from app.models.user import User
from app.core.security import hash_password

class TestUserModel:
    def test_create_user(self, db, cleanup_db):
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash=hash_password("password123"),
        )
        db.add(user)
        db.commit()

        assert user.id is not None
        assert user.username == "testuser"
```

**API тест:**
```python
def test_login_success(client, test_user):
    resp = client.post("/api/auth/login", json={
        "email": test_user.email,
        "password": "password123"
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()
```

### Конфигурация pytest

Настройки в `pyproject.toml`:

```toml
[tool.pytest.ini_options]
pythonpath = "backend"      # Для корректных импортов
testpaths = "backend/tests"
addopts = "--tb=short"
filterwarnings = [
    "ignore::DeprecationWarning:sqlalchemy.*"
]
```

## 🎨 Code Style

### Инструменты

| Инструмент | Назначение | Конфиг |
|-----------|-----------|--------|
| **Black** | Форматирование кода | `pyproject.toml` |
| **isort** | Сортировка импортов | `pyproject.toml` |
| **Flake8** | Проверка стиля | `.flake8` |
| **mypy** | Проверка типов | `pyproject.toml` |
| **autopep8** | Автофикс форматирования |手动 |
| **autoflake** | Удаление неиспользуемых импортов |手动 |

### Pre-commit hooks

Автоматическая проверка при коммите:

```bash
# Установка
pip install pre-commit
pre-commit install

# Запуск на всех файлах
pre-commit run --all-files

# Конкретный хук
pre-commit run black --all-files
```

### Ручное исправление

Если pre-commit не справился:

```bash
# Установка инструментов
pip install autopep8 autoflake

# Удалить неиспользуемые импорты
autoflake --in-place --remove-all-unused-imports -r backend/

# Исправить форматирование
autopep8 --in-place --aggressive --max-line-length=100 -r backend/

# Финальное форматирование black
black . --preview
```

### SQLAlchemy Forward References

Модели используют `# noqa` для forward references — это **нормально**:

```python
from __future__ import annotations
from app.models.card_tag import CardTag  # noqa: F401 - нужно для relationship

class Card(Base):
    # Строка в relationship() = forward reference
    tags = relationship("CardTag", secondary=CardCardTag)  # noqa: F821
```

**Почему:**
- `from __future__ import annotations` делает все type hints строками
- SQLAlchemy `relationship()` использует имена классов как строки
- `# noqa: F401` — импорт нужен для инициализации маппера
- `# noqa: F821` — ссылка на ещё не определённый класс

## 📦 Миграции БД

```bash
# Применить все миграции
alembic upgrade head

# Создать новую миграцию
alembic revision --autogenerate -m "description"

# Откатить последнюю миграцию
alembic downgrade -1
```

## 🔐 Переменные окружения

| Переменная | Обязательная | Описание |
|-----------|--------------|----------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `SECRET_KEY` | ✅ | JWT секретный ключ |
| `ALGORITHM` | ✅ | JWT алгоритм (обычно `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ✅ | Время жизни токена (минуты) |

## 🛠️ Технологический стек

- **FastAPI** — веб-фреймворк с автоматической генерацией OpenAPI
- **SQLAlchemy 2.0** — ORM с async support
- **PostgreSQL 16** — база данных
- **Alembic** — миграции БД
- **Pydantic** — валидация данных
- **python-jose** — JWT токены
- **bcrypt** — хеширование паролей
- **pytest** — тестирование

## 📖 API Документация

При запущенном бэкенде:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **OpenAPI JSON:** `http://localhost:8000/openapi.json`

### Основные эндпоинты

| Путь | Метод | Описание | Auth |
|------|-------|----------|------|
| `/api/auth/register` | POST | Регистрация пользователя | ❌ |
| `/api/auth/login` | POST | Вход, получение JWT токена | ❌ |
| `/api/cards` | GET/POST | Список/создание карточек | ✅ |
| `/api/decks` | GET/POST | Список/создание колод | ✅ |
| `/api/groups` | GET/POST | Список/создание групп | ✅ |
| `/api/stats/dashboard` | GET | Статистика для дашборда | ✅ |

### Статистика (`/api/stats/dashboard`)

Возвращает статистику пользователя для дашборда:

```json
{
  "cards_studied_today": 15,
  "time_spent_today": 25,
  "current_streak": 7,
  "total_cards": 120
}
```

- **cards_studied_today**: Количество карточек, повторённых сегодня
- **time_spent_today**: Время изучения сегодня (в минутах)
- **current_streak**: Текущая серия подряд идущих дней с активностью
- **total_cards**: Общее количество карточек пользователя

## 🏷️ Версионирование

Версия определяется автоматически при сборке Docker-образа:

```python
from app.core.version import get_version
version = get_version()  # "0.0.99"
```

Через API:
```bash
curl http://localhost:8000/version
# {"version": "0.0.99"}
```
