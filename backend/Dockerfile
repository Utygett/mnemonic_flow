FROM python:3.13-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Аргумент для версии (по умолчанию из VERSION файла при локальной сборке)
ARG VERSION=0.0.0
ENV APP_VERSION=${VERSION}

# Копируем requirements.txt из корня проекта
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код бэкенда
COPY backend/ ./backend/

# Alembic файлы
COPY backend/alembic.ini ./alembic.ini
COPY backend/migrations/ ./migrations/

# EntryPoint
COPY backend/entrypoint.sh ./entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENV PYTHONPATH=/app/backend

CMD ["/app/entrypoint.sh"]
