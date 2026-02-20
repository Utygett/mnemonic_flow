#!/usr/bin/env sh
set -e

# Создаём таблицы из моделей (если не существуют)
# PYTHONPATH=/app/backend позволяет импортировать app.*
python -c "from app.db.init_db import init_db; init_db()"

# Помечаем alembic как актуальный (чтобы не пытаться применить миграции)
# alembic.ini находится в /app, запускаем оттуда
cd /app && alembic stamp head

# Запускаем uvicorn из директории /app/backend (где находится пакет app)
cd /app/backend && exec uvicorn app.main:app --host 0.0.0.0 --port 8000
