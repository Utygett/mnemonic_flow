FROM python:3.13-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Аргумент для версии
ARG VERSION=0.0.0
ENV APP_VERSION=${VERSION}

# Устанавливаем зависимости (context = backend/)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь код бэкенда
COPY . .

# Нормализуем entrypoint.sh (Windows -> Unix) и делаем исполняемым
RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# PYTHONPATH должен указывать на директорию backend, где находится пакет app
ENV PYTHONPATH=/app/backend

CMD ["/app/entrypoint.sh"]
