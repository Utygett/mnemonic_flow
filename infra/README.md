# MnemonicFlow Infrastructure

Инфраструктурная конфигурация для разворачивания MnemonicFlow — приложения для интервального повторения flashcards.

## 📁 Структура

```
infra/
├── deploy/
│   └── nginx/                 # Nginx конфигурация
│       └── conf.d/
│           └── default.conf   # Основной конфиг реверс-прокси
├── compose.dev.yml            # Docker Compose для разработки
├── compose.prod.yml           # Docker Compose для продакшна
├── compose.ci.yml             # Docker Compose для CI
├── compose.pre-commit.yml     # Docker Compose для pre-commit hooks
├── Dockerfile.pre-commit      # Dockerfile для pre-commit образа
├── .envExample.dev            # Шаблон переменных для разработки
├── .envExample.prod           # Шаблон переменных для продакшна
└── README.md                  # Этот файл
```

## 🚀 Быстрый старт

### Разработка

```bash
cd infra

# Копируем шаблон переменных окружения
cp .envExample.dev .env

# Запускаем все сервисы
docker compose -f compose.dev.yml up -d

# Приложение доступно по адресу http://localhost:80
```

### Продакшн

```bash
cd infra

# Копируем и редактируем шаблон переменных окружения
cp .envExample.prod .env
# Отредактируйте .env с реальными значениями

# Запускаем продакшн стек
docker compose -f compose.prod.yml up -d
```

## 📦 Сервисы

### Development (compose.dev.yml)

| Сервис | Порт | Описание |
|--------|------|----------|
| **db** | 5432 | PostgreSQL 16 |
| **backend** | 8000 | FastAPI backend (внутри сети) |
| **frontend** | - | React build (nginx) |
| **nginx** | 80 | Реверс-прокси |

### Production (compose.prod.yml)

| Сервис | Описание |
|--------|----------|
| **db** | PostgreSQL 16 с healthcheck |
| **backend** | FastAPI backend |
| **frontend** | Static файлы фронтенда |
| **nginx** | Реверс-прокси с SSL (Let's Encrypt) |
| **certbot** | Автоматическое обновление SSL сертификатов |

## 🛠️ Команды

### Управление контейнерами

```bash
# Просмотр логов
docker compose -f compose.dev.yml logs -f
docker compose -f compose.dev.yml logs backend --tail=50

# Пересборка после изменений кода
docker compose -f compose.dev.yml up -d --build frontend
docker compose -f compose.dev.yml up -d --build backend

# Остановка
docker compose -f compose.dev.yml down

# Остановка с удалением volumes (очистка БД)
docker compose -f compose.dev.yml down -v

# Перезапуск конкретного сервиса
docker compose -f compose.dev.yml restart backend
```

### Pre-commit через Docker

```bash
cd infra
docker compose -f compose.pre-commit.yml run --rm pre-commit
```

Использует закешированный образ из GitHub Container Registry:
`ghcr.io/<owner>/mnemonic_flow/pre-commit:latest`

## 🔐 Переменные окружения

### Обязательные (для всех окружений)

| Переменная | Описание | Пример |
|-----------|----------|--------|
| `POSTGRES_DB` | Имя БД | `flashcards` |
| `POSTGRES_USER` | Пользователь БД | `flashcards_user` |
| `POSTGRES_PASSWORD` | Пароль БД | `secure_password` |
| `SECRET_KEY` | JWT секретный ключ | `your-secret-key` |
| `ALGORITHM` | JWT алгоритм | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Время жизни токена | `360` |

### Для продакшна (compose.prod.yml)

Дополнительные переменные для SMTP (почтовые уведомления):
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`
- `FRONTEND_URL` — URL фронтенда для ссылок в письмах

### Важно: Docker Compose и переменные

**Docker Compose НЕ:** автоматически передаёт переменные из `.env` в контейнеры.
**Docker Compose НЕ:** раскрывает вложенные переменные (например, `${POSTGRES_PASSWORD}` внутри `DATABASE_URL`).

**Решение:** Все переменные, которые нужны контейнеру, должны быть явно указаны в `compose.yml` в секции `environment:`.

Пример из `compose.dev.yml`:
```yaml
backend:
  environment:
    DATABASE_URL: postgresql+psycopg2://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
    SECRET_KEY: ${SECRET_KEY}
    ALGORITHM: ${ALGORITHM}
    ACCESS_TOKEN_EXPIRE_MINUTES: ${ACCESS_TOKEN_EXPIRE_MINUTES}
```

## 🌐 Nginx

Конфигурация находится в `deploy/nginx/conf.d/default.conf`.

**Основные функции:**
- Реверс-прокси для backend (`/api/*` → `backend:8000`)
- Раздача статики фронтенда
- Healthcheck endpoint
- CORS headers
- GZIP сжатие

## 🔧 CI/CD

### CI Build (compose.ci.yml)

Используется в GitHub Actions для проверки сборки:
```bash
docker compose -f compose.ci.yml build
```

### Pre-commit (compose.pre-commit.yml)

Запускает все pre-commit hooks в изолированном контейнере.

### Публикация образов

Docker образы публикуются в GitHub Container Registry:
- `ghcr.io/<owner>/mnemonic_flow/backend:latest`
- `ghcr.io/<owner>/mnemonic_flow/frontend:latest`
- `ghcr.io/<owner>/mnemonic_flow/pre-commit:latest`

**Workflow:** `.github/workflows/push-images.yml`
- Триггер: push в `main`/`develop` или manual dispatch
- Использует Docker Buildx для multi-platform builds

## 🗄️ Работа с базой данных

### Подключение к PostgreSQL

```bash
# Из хоста
docker compose -f compose.dev.yml exec db psql -U flashcards_user -d flashcards

# Выполнить SQL команду
docker compose -f compose.dev.yml exec db psql -U flashcards_user -d flashcards -c "SELECT * FROM users;"
```

### Полезные команды

**Верификация email всех пользователей (обход подтверждения):**
```bash
docker compose -f compose.dev.yml exec db psql -U flashcards_user -d flashcards -c "UPDATE users SET is_email_verified = true;"
```

**Верификация конкретного пользователя по email:**
```bash
docker compose -f compose.dev.yml exec db psql -U flashcards_user -d flashcards -c "UPDATE users SET is_email_verified = true WHERE email = 'user@example.com';"
```

### Резервное копирование

```bash
# Дамп БД
docker compose -f compose.dev.yml exec db pg_dump -U flashcards_user flashcards > backup.sql

# Восстановление из дампа
docker compose -f compose.dev.yml exec -T db psql -U flashcards_user flashcards < backup.sql
```

## 🔄 SSL в продакшне

Продакшн конфигурация использует **Certbot** для автоматического получения и обновления SSL сертификатов Let's Encrypt.

**Требования:**
- Доменное имя должно указывать на сервер
- Порты 80 и 443 должны быть открыты

**Первичная настройка:**
```bash
# Запустить certbot для получения сертификата
docker compose -f compose.prod.yml run --rm certbot certonly --webroot

# Перезапустить nginx для применения сертификата
docker compose -f compose.prod.yml restart nginx
```

## 📝 Troubleshooting

### Frontend изменения не появляются

Фронтенд собирается в Docker образ. После изменений:
```bash
docker compose -f compose.dev.yml up -d --build frontend
```

### Backend не запускается

Проверьте логи:
```bash
docker compose -f compose.dev.yml logs backend
```

Частые причины:
- Отсутствуют обязательные переменные окружения
- База данных недоступна
- Неверный `DATABASE_URL`

### Nginx не может найти backend

Ошибка: `host not found in upstream 'backend'`

Причина: backend контейнер не запустился. Проверьте:
```bash
docker compose -f compose.dev.yml ps
docker compose -f compose.dev.yml logs backend
```

### Очистка всего

```bash
# Остановить и удалить все контейнеры, сети, volumes
docker compose -f compose.dev.yml down -v

# Удалить dangling образы
docker image prune
```
