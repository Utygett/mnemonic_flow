#!/usr/bin/env sh
set -e

# Применяем все миграции (создание таблиц + все изменения схемы)
cd /app && alembic upgrade head

# Запускаем uvicorn
cd /app/backend && exec uvicorn app.main:app --host 0.0.0.0 --port 8000
