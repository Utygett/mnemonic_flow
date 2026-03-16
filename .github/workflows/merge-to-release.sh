#!/bin/bash

# Скрипт для создания release ветки из develop
# Использование: ./merge-to-release.sh (запускается из ветки develop)

set -e

echo "🔍 Checking current branch..."
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" != "develop" ]; then
    echo "❌ Error: This script must be run from develop branch"
    echo "Current branch: $CURRENT_BRANCH"
    exit 1
fi

echo "✓ Current branch: $CURRENT_BRANCH"

echo "📋 Reading VERSION file..."
VERSION=$(cat VERSION)

if [ -z "$VERSION" ]; then
    echo "❌ Error: VERSION file is empty or does not exist"
    exit 1
fi

echo "✓ VERSION (from develop): $VERSION"

# Убираем -dev суффикс если есть
RELEASE_VERSION="${VERSION%-dev}"

if [ "$VERSION" != "$RELEASE_VERSION" ]; then
    echo "✓ Stripped -dev suffix: $RELEASE_VERSION"
else
    echo "⚠️  VERSION does not have -dev suffix: $VERSION"
fi

# Создаём временную ветку release_va.b.c
TMP_BRANCH="release_v${RELEASE_VERSION}"
echo "🎯 Creating temporary branch: $TMP_BRANCH"

# Проверяем, не существует ли ветка уже локально
if git rev-parse --verify "$TMP_BRANCH" >/dev/null 2>&1; then
    echo "❌ Error: Branch $TMP_BRANCH already exists locally"
    echo "If you want to recreate it, delete it first: git branch -D $TMP_BRANCH"
    exit 1
fi

echo "⬇️  Creating and checking out $TMP_BRANCH..."
git checkout -b "$TMP_BRANCH"

echo "📝 Updating VERSION file..."
echo "$RELEASE_VERSION" > VERSION

echo "💾 Committing release version..."
git add VERSION
git commit -m "release: update to v${RELEASE_VERSION}"

# Парсим major.minor из версии (0.0.6 → 0.0)
MAJOR_MINOR=$(echo "${RELEASE_VERSION}" | cut -d. -f1,2)
RELEASE_BRANCH="release_v${MAJOR_MINOR}.x"

echo "🎯 Target release branch: $RELEASE_BRANCH"

# Проверяем существует ли ветка на origin
if ! git rev-parse --verify "origin/$RELEASE_BRANCH" >/dev/null 2>&1; then
    echo "❌ Error: Release branch $RELEASE_BRANCH does not exist on origin"
    echo "Please create it first"
    exit 1
fi

echo "⬇️  Checking out $RELEASE_BRANCH..."
git checkout "$RELEASE_BRANCH"
git pull origin "$RELEASE_BRANCH"

echo "🔄 Merging $TMP_BRANCH into $RELEASE_BRANCH with -X theirs..."
if git merge "$TMP_BRANCH" -s recursive -X theirs -m "Merge $TMP_BRANCH into $RELEASE_BRANCH"; then
    echo "✅ Merge successful!"
else
    echo "❌ Merge failed!"
    exit 1
fi

echo "⬆️  Pushing $RELEASE_BRANCH..."
git push origin "$RELEASE_BRANCH"

echo "🧹 Cleaning up - deleting temporary branch $TMP_BRANCH..."
git branch -D "$TMP_BRANCH"

echo "✨ Done! Check the release branch: https://github.com/$(git config --get remote.origin.url | sed 's/.*://; s/\.git$//')/tree/$RELEASE_BRANCH"
