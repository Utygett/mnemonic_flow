FROM node:20-alpine AS build
WORKDIR /app

# Аргумент для версии (по умолчанию из VERSION файла при локальной сборке)
ARG VERSION=0.0.0
ENV APP_VERSION=${VERSION}

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
