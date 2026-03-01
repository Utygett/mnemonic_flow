#!/usr/bin/env sh
set -e

# Применяем все миграции с нуля
cd /app && alembic upgrade head

# Запускаем приложение
cd /app/backend && exec uvicorn app.main:app --host 0.0.0.0 --port 8000
