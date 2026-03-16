# MnemonicFlow Backend

FastAPI backend для flashcard-приложения с интервальным повторением на основе алгоритма SM-2.

## 📁 Структура

```
backend/
├── backend/
│   ├── app/
│   │   ├── api/           # API эндпоинты (routes/)
│   │   │   ├── auth.py    # Аутентификация
│   │   │   ├── cards.py   # Карточки
│   │   │   ├── decks.py   # Колоды (включая импорт из Anki)
│   │   │   ├── groups.py  # Группы
│   │   │   └── stats.py   # Статистика
│   │   ├── auth/          # Логика аутентификации
│   │   ├── core/          # Конфигурация, безопасность, БД
│   │   ├── db/            # Инициализация БД
│   │   ├── domain/        # Domain сервисы
│   │   ├── models/        # SQLAlchemy модели
│   │   │   ├── user.py
│   │   │   ├── card.py
│   │   │   ├── deck.py
│   │   │   ├── group.py
│   │   │   └── ...
│   │   ├── schemas/       # Pydantic схемы
│   │   └── services/      # Бизнес-логика
│   │       ├── anki_parser.py   # Парсер .apkg файлов
│   │       ├── anki_mapper.py   # Маппер Anki → MnemonicFlow
│   │       ├── stats_service.py # Сервис агрегации статистики
│   │       └── storage_service.py  # MinIO/S3 хранилище
│   └── tests/             # Тесты
├── migrations/            # Alembic миграции
├── Dockerfile             # Docker образ для разработки/продакшна
├── Dockerfile.ci          # Docker образ для CI
├── entrypoint.sh          # Скрипт инициализации контейнера
├── pyproject.toml         # Конфигурация проекта и инструментов
└── requirements.txt       # Зависимости Python
```

## 🚀 Быстрый старт

### Локальная разработка

```bash
# 1. Установи зависимости
pip install -r requirements.txt

# 2. Настрой переменные окружения (см. infra/.envExample.dev)
export DATABASE_URL="postgresql+psycopg2://user:pass@localhost:5432/dbname"
export SECRET_KEY="your-secret-key"
export ALGORITHM="HS256"
export ACCESS_TOKEN_EXPIRE_MINUTES="360"

# 3. Запусти сервер
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
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

## 🎨 Code Style

### Инструменты

| Инструмент | Назначение | Конфиг |
|-----------|-----------|--------|
| **Black** | Форматирование кода | `pyproject.toml` (preview mode, 100 символов) |
| **isort** | Сортировка импортов | `pyproject.toml` (black-compatible) |
| **Flake8** | Проверка стиля | `pyproject.toml` (через Flake8-pyproject) |
| **mypy** | Проверка типов | `pyproject.toml` (manual stage) |

### Pre-commit hooks

Автоматическая проверка при коммите:

```bash
# Установка
pip install pre-commit
cd /path/to/repo
pre-commit install

# Запуск на всех файлах
pre-commit run --all-files

# Конкретный хук
pre-commit run black --all-files
pre-commit run mypy --all-files --hook-stage manual
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

> **Примечание:** Проект использует кастомную инициализацию БД через `init_db()` в `entrypoint.sh`. Таблицы создаются из SQLAlchemy моделей, затем применяется `alembic stamp head`. Это обходной путь для проблем с цепочкой миграций.

## 🔐 Переменные окружения

| Переменная | Обязательная | Описание | Пример |
|-----------|--------------|----------|--------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql+psycopg2://user:pass@localhost:5432/dbname` |
| `SECRET_KEY` | ✅ | JWT секретный ключ | `your-secret-key` |
| `ALGORITHM` | ✅ | JWT алгоритм | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ✅ | Время жизни токена (минуты) | `360` |
| `MINIO_ENDPOINT` | ✅ | MinIO endpoint (с протоколом) | `http://minio:9000` |
| `MINIO_ACCESS_KEY` | ✅ | MinIO access key | `minioadmin` |
| `MINIO_SECRET_KEY` | ✅ | MinIO secret key | `minioadmin` |
| `MINIO_BUCKET_NAME` | ✅ | Имя bucket для изображений | `card-images` |
| `MINIO_USE_SSL` | ✅ | Использовать HTTPS для MinIO | `false` |
| `SMTP_*` | ❌ | Конфигурация SMTP для писем | - |

## 🛠️ Технологический стек

- **FastAPI** — веб-фреймворк с автоматической генерацией OpenAPI
- **SQLAlchemy 2.0** — ORM с async support
- **PostgreSQL 16** — база данных
- **MinIO** — S3-совместимое объектное хранилище для изображений и аудио
- **boto3** — AWS SDK для работы с S3/MinIO
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
| `/version` | GET | Версия приложения | ❌ |
| `/api/auth/register` | POST | Регистрация пользователя | ❌ |
| `/api/auth/login` | POST | Вход, получение JWT токена | ❌ |
| `/api/auth/refresh` | POST | Обновление токена | ❌ |
| `/api/cards` | GET/POST | Список/создание карточек | ✅ |
| `/api/cards/{id}` | GET/PATCH/DELETE | Операции с карточкой | ✅ |
| `/api/cards/{id}/review` | POST | Отметить карточку как изученную | ✅ |
| `/api/cards/{card_id}/levels/{level_index}/question-image` | POST/DELETE | Загрузка/удаление изображения вопроса | ✅ |
| `/api/cards/{card_id}/levels/{level_index}/answer-image` | POST/DELETE | Загрузка/удаление изображения ответа | ✅ |
| `/api/cards/{card_id}/levels/{level_index}/question-audio` | POST/DELETE | Загрузка/удаление аудио вопроса | ✅ |
| `/api/cards/{card_id}/levels/{level_index}/answer-audio` | POST/DELETE | Загрузка/удаление аудио ответа | ✅ |
| `/api/cards/{card_id}/option-image` | POST | Загрузка изображения для MCQ опции | ✅ |
| `/api/decks` | GET/POST | Список/создание колод | ✅ |
| `/api/decks/import-anki` | POST | Импорт колоды из Anki (.apkg) | ✅ |
| `/api/decks/{id}` | GET/PATCH/DELETE | Операции с колодой | ✅ |
| `/api/decks/{deck_id}/study-cards` | GET | Карточки для изучения с изображениями | ✅ |
| `/api/groups` | GET/POST | Список/создание групп | ✅ |
| `/api/groups/{id}` | GET/PATCH/DELETE | Операции с группой | ✅ |
| `/api/stats/dashboard` | GET | Статистика для дашборда | ✅ |
| `/api/stats/general` | GET | Общая статистика (время, сессии, рейтинги) | ✅ |
| `/api/stats/activity-heatmap` | GET | Данные для тепловой карты активности | ✅ |
| `/api/stats/deck-progress` | GET | Прогресс по каждой колоде | ✅ |
| `/api/stats/activity-chart` | GET | Данные для графиков активности | ✅ |
| `/api/stats/difficulty-distribution` | GET | Распределение карточек по сложности | ✅ |
| `/api/cards/{card_id}/levels/{level_id}/comments` | GET | Получить комментарии к уровню карточки | ❌ |
| `/api/cards/{card_id}/levels/{level_id}/comments` | POST | Создать комментарий к уровню карточки | ✅ |
| `/api/stats/difficulty-distribution` | GET | Распределение карточек по сложности | ✅ |

### Статистика

#### Dashboard (`/api/stats/dashboard`)

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

> **Важно:** При работе с расчётами времени учитывайте, что `CardReviewHistory.interval_minutes` — это интервал SM-2 до следующего повторения, а НЕ время изучения. Для реального времени изучения используйте `reviewed_at - reveal_at`.

#### Распределение по сложности (`/api/stats/difficulty-distribution`)

Возвращает распределение карточек пользователя по категориям сложности:

```json
{
  "easy_count": 45,
  "medium_count": 30,
  "hard_count": 15,
  "total_count": 90
}
```

- **easy_count**: Количество карточек с difficulty 1-3 (зелёный)
- **medium_count**: Количество карточек с difficulty 4-6 (янтарный)
- **hard_count**: Количество карточек с difficulty 7-10 (красный)
- **total_count**: Общее количество карточек

Диапазоны сложности основаны на поле `difficulty` в модели `CardProgress`.

#### Общая статистика (`/api/stats/general`)

Возвращает расширенную статистику пользователя:

```json
{
  "total_study_time_minutes": 1500,
  "total_study_time_formatted": "25h 0m",
  "average_session_duration_minutes": 15.5,
  "total_reviews": 250,
  "learning_speed_cards_per_day": 8.3,
  "rating_distribution": {
    "again_count": 30,
    "hard_count": 45,
    "good_count": 120,
    "easy_count": 55,
    "again_percentage": 12.0,
    "hard_percentage": 18.0,
    "good_percentage": 48.0,
    "easy_percentage": 22.0
  },
  "average_rating": 2.8
}
```

- **total_study_time_minutes**: Общее время изучения в минутах
- **total_study_time_formatted**: Форматированная строка времени
- **average_session_duration_minutes**: Средняя длительность сессии
- **learning_speed_cards_per_day**: Скорость обучения (новых карточек/день)
- **rating_distribution**: Распределение оценок Again/Hard/Good/Easy
- **average_rating**: Средняя оценка (1-4 шкала)

#### Тепловая карта активности (`/api/stats/activity-heatmap`)

Возвращает данные для GitHub-style календаря активности:

```json
{
  "entries": [
    {
      "date": "2026-01-15",
      "reviews_count": 25,
      "study_time_minutes": 45
    }
  ]
}
```

- **date**: Дата в формате YYYY-MM-DD
- **reviews_count**: Количество повторений в этот день
- **study_time_minutes**: Время изучения в минутах

Параметры запроса:
- `days` (опционально): Количество дней для генерации (по умолчанию 365)

#### Прогресс по колодам (`/api/stats/deck-progress`)

Возвращает прогресс по всем колодам пользователя:

```json
{
  "decks": [
    {
      "deck_id": "uuid",
      "deck_title": "JavaScript Basics",
      "deck_color": "#FF5733",
      "total_cards": 100,
      "mastered_cards": 45,
      "learning_cards": 35,
      "new_cards": 20,
      "progress_percentage": 45.0,
      "total_reviews": 350,
      "total_study_time_minutes": 250
    }
  ]
}
```

- **mastered_cards**: Выученные карточки (stability >= 30 дней)
- **learning_cards**: Изучаемые карточки (0 < stability < 30 дней)
- **new_cards**: Новые карточки (ещё не повторялись)
- **progress_percentage**: Процент выученности

#### Графики активности (`/api/stats/activity-chart`)

Возвращает данные для графиков активности с группировкой по периоду:

```json
{
  "entries": [
    {
      "date": "2026-01-15",
      "reviews": 25,
      "new_cards": 5,
      "study_time_minutes": 45,
      "unique_cards": 20
    }
  ]
}
```

Параметры запроса:
- `period`: Период группировки (`day`, `week`, `month`)
- `days`: Количество дней для анализа (по умолчанию 30)

## 🏷️ Версионирование

Версия определяется автоматически при сборке Docker-образа из файла `VERSION` в корне проекта.

```python
from app.core.version import get_version
version = get_version()  # "0.0.99"
```

Через API:
```bash
curl http://localhost:8000/version
# {"version": "0.0.99"}
```

## 🏗️ Архитектура

### Модели данных

**User** — Пользователь
- username, email, password_hash
- is_email_verified, email_verification_token
- created_at, updated_at

**Deck** — Колоды для группировки карточек
- name, description, owner_id
- Связь с Card (one-to-many)

**Card** — Flashcards с несколькими уровнями
- deck_id, question_template, answer_template
- Связь с CardLevel (one-to-many)

**CardLevel** — Уровни сложности карточки
- card_id, level_index, question, answer
- question_image_urls, answer_image_urls (до 10 изображений на сторону)
- question_audio_urls, answer_audio_urls (до 10 аудиофайлов на сторону)
- level_index: динамический индекс уровня (от 0 до 10+)

**StudyGroup** — Учебные группы
- name, description, code (для присоединения)
- Связь с User через UserStudyGroup (many-to-many)

**CardReviewHistory** — История повторений (SM-2)
- card_id, user_id, rating (1-5)
- interval_days, ease_factor
- revealed_at, reviewed_at

**CardProgress** — Прогресс пользователя по карточке
- card_id, user_id
- next_review_at, box_number

### API структура

```
app/api/
├── __init__.py
├── auth.py       # /api/auth/* (register, login, refresh)
├── cards.py      # /api/cards/* (CRUD + review + image upload)
├── decks.py      # /api/decks/* (CRUD + study-cards)
├── groups.py     # /api/groups/* (CRUD + join/leave)
└── stats.py      # /api/stats/dashboard
```

### Сервисы

```
app/services/
├── storage_service.py  # MinIO/S3 хранилище изображений
├── anki_parser.py      # Парсер Anki .apkg файлов
├── anki_mapper.py      # Конвертер Anki → MnemonicFlow модели
└── stats_service.py    # Агрегация статистики и аналитики
```

**StorageService** — управление файлами в MinIO/S3:
- **Изображения**: Валидация: image/jpeg, image/png, image/webp (макс 5MB на файл, до 10 файлов на сторону)
- **Аудио**: Валидация: audio/mpeg, audio/mp4, audio/wav, audio/webm, audio/ogg (макс 10MB на файл, до 10 файлов на сторону)
- Загрузка файлов с генерацией уникальных ключей
- Удаление файлов по индексу
- Проксирование через Nginx по путям `/images/` и `/audio/`

**AnkiParser** — парсер Anki .apkg файлов:
- Извлечение SQLite базы данных из ZIP-архива
- Парсинг таблиц notes, cards, models
- Извлечение медиа-файлов из .apkg
- Поддержка .anki2 и .anki21 форматов

**AnkiMapper** — конвертер Anki данных в MnemonicFlow модели:
- Создание Deck из Anki колоды
- Создание Card из Anki notes
- Конвертация HTML в текст (очистка тегов)
- Извлечение полей Front/Back из моделей Anki

**StatsService** — агрегация статистики и аналитики:
- Форматирование времени в человекочитаемый формат
- Расчёт распределения оценок (Again/Hard/Good/Easy)
- Вычисление средней оценки (1-4 шкала)
- Агрегация общего времени изучения
- Расчёт средней длительности сессии
- Вычисление скорости обучения (новых карточек/день)
- Генерация данных для тепловой карты активности (GitHub-style)
- Расчёт прогресса по колодам с порогом выученности (30+ дней)
- Генерация данных для графиков активности с группировкой по периоду

Функции сервиса:
- `format_duration(total_minutes)` — форматирование минут в "Xh Ym" или "X days Yh"
- `calculate_rating_distribution(db, user_id)` — распределение оценок
- `calculate_average_rating(db, user_id)` — средняя оценка (1-4)
- `calculate_total_study_time(db, user_id)` — общее время в минутах
- `calculate_average_session_duration(db, user_id)` — средняя сессия
- `calculate_learning_speed(db, user_id)` — новых карточек/день
- `get_activity_heatmap(db, user_id, days)` — данные для heatmap
- `get_deck_progress(db, user_id)` — прогресс по колодам
- `get_activity_chart(db, user_id, period, days)` — данные для графиков

### Безопасность

- **JWT** с access/refresh токенами
- **Ротация refresh токенов** при каждом использовании
- **bcrypt** для хеширования паролей
- **Email verification** для регистрации

## 📚 Дополнительная документация

- [Главный README](../README.md) — Общая документация проекта
- [CLAUDE.md](../CLAUDE.md) — Документация для разработчиков
- [Infra README](../infra/README.md) — Инфраструктура и Docker
