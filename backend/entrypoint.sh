#!/usr/bin/env sh
set -e

# Создаём таблицы из моделей (если не существуют)
python -c "from app.db.init_db import init_db; init_db()"

# Помечаем alembic как актуальный (чтобы не пытаться применить миграции)
alembic stamp head

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
