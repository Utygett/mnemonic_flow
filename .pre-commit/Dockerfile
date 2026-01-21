# Dockerfile для pre-commit hooks
# Включает Python и Node.js для всех проверок

FROM node:20-alpine

# Устанавливаем Python и pip
RUN apk add --no-cache python3 py3-pip git bash

WORKDIR /repo

# Устанавливаем pre-commit (с --break-system-packages для Alpine)
RUN pip install --no-cache-dir --break-system-packages pre-commit

# По умолчанию запускаем все проверки
CMD ["pre-commit", "run", "--all-files"]
