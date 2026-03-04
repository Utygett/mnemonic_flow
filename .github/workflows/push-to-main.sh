#!/bin/bash

# Находим все релизные ветки и выбираем последнюю по номеру версии
# Шаблон: release_v{major}.{minor}.x
git fetch origin

# Получаем список всех релизных веток и находим последнюю (с наибольшим номером версии)
LATEST_RELEASE_BRANCH=$(git branch -r | grep -oE 'origin/release_v[0-9]{1,2}\.[0-9]{1,2}\.x' | sed 's|origin/||' | sort -V | tail -n 1)

if [ -z "$LATEST_RELEASE_BRANCH" ]; then
    echo "Error: No release branches found matching pattern 'release_v{major}.{minor}.x'"
    exit 1
fi

echo "Latest release branch: $LATEST_RELEASE_BRANCH"

# Переходим на релизную ветку
git checkout $LATEST_RELEASE_BRANCH
git pull origin $LATEST_RELEASE_BRANCH

# Извлекаем версию из файла VERSION (уже находясь на релизной ветке)
export VER=$(cat VERSION | tr -d '[:space:]')
echo "Releasing version: $VER"

# Обновляем main из origin
git checkout main
git pull origin main

# Создаём временную ветку от main
git checkout -b "new_release"

# Удаляем все файлы из рабочей директории (но не из git!)
git rm -rf .

# Копируем все файлы из релизной ветки
git checkout origin/$LATEST_RELEASE_BRANCH -- .

# Коммитим изменения
git add .
git commit -m "release: update to v$VER"

# Мержим временную ветку в main (fast-forward, без merge commit)
git checkout main
git merge --ff-only new_release

# Удаляем временную ветку
git branch -D "new_release"

# Пушим изменения в origin
git push origin main
