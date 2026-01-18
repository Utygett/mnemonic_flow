# MnemonicFlow

Приложение для интервального повторения flashcards с адаптивной системой запоминания.

## 📁 Структура проекта

```
MnemonicFlow/
├── frontend/              # React + TypeScript фронтенд
│   ├── src/
│   │   ├── app/           # Глобальные настройки (провайдеры, роутинг)
│   │   ├── pages/         # Страницы (Auth, Home, Study, Stats, Profile)
│   │   ├── widgets/       # Крупные UI блоки (навигация, оболочка)
│   │   ├── features/      # Фичи (создание карточек, изучение)
│   │   ├── entities/      # Сущности (Card, Deck, User, Group)
│   │   └── shared/        # Переиспользуемый код (UI, API, утилиты)
│   ├── Dockerfile
│   └── package.json
│
├── backend/               # FastAPI + Python бэкенд
│   ├── app/
│   │   ├── api/           # API эндпоинты
│   │   ├── core/          # Конфигурация, безопасность, БД
│   │   ├── models/        # SQLAlchemy модели
│   │   ├── schemas/       # Pydantic схемы
│   │   └── services/      # Бизнес-логика
│   ├── Dockerfile
│   ├── entrypoint.sh      # Скрипт инициализации
│   └── requirements.txt
│
├── infra/                 # Инфраструктура
│   ├── deploy/
│   │   └── nginx/         # Nginx конфигурация
│   ├── compose.dev.yml    # Docker Compose для разработки
│   └── .envExample.dev    # Шаблон переменных окружения
│
└── .github/
    └── workflows/
        └── ci.yml         # GitHub Actions CI
```

## 🏗️ Архитектура фронтенда (FSD)

Фронтенд построен по методологии **Feature-Sliced Design** — слои изолированы и импортируются только сверху вниз:

```
┌─────────────────────────────────────────┐
│  app/      — глобальная инфраструктура  │
├─────────────────────────────────────────┤
│  pages/    — страницы приложения       │
├─────────────────────────────────────────┤
│  widgets/  — крупные reusable блоки    │
├─────────────────────────────────────────┤
│  features/ — пользовательские действия  │
├─────────────────────────────────────────┤
│  entities/ — доменные сущности         │
├─────────────────────────────────────────┤
│  shared/   — общие инструменты         │
└─────────────────────────────────────────┘
```

**Правило импортов:** слой может импортировать только из слоёв **строго ниже**.

Примеры:
- ✅ `pages/` → `features/` → `entities/` → `shared/`
- ❌ `features/` → `features/` (запрещено)
- ❌ `entities/` → `pages/` (запрещено)

## 🚀 Быстрый старт

### Требования
- Docker и Docker Compose
- Node.js 20+ (для локальной разработки)
- Python 3.11+ (для локальной разработки)

### Запуск через Docker (рекомендуется)

```bash
# 1. Копируем переменные окружения
cd infra
cp .envExample.dev .env

# 2. Запускаем все сервисы
docker compose -f compose.dev.yml up -d

# 3. Приложение доступно по адресу
http://localhost:80
```

### Локальная разработка

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev    # http://localhost:3000
```

## 🛠️ Технологический стек

| Слой | Технологии |
|------|-----------|
| **Frontend** | React 18, TypeScript, Vite, FSD v2, Radix UI, Tailwind |
| **Backend** | FastAPI, Python 3.11, PostgreSQL 16, SQLAlchemy 2.0 |
| **Infrastructure** | Docker, Docker Compose, Nginx |
| **CI/CD** | GitHub Actions |

## 📖 Документация

- **[CLAUDE.md](./CLAUDE.md)** — подробная документация для разработчиков
- **API Docs** — `http://localhost/docs` (при запущенном бэкенде)
- **FSD Contract** — `frontend/docs/fsd-contract.md` (на русском)

## 🧪 Тесты

