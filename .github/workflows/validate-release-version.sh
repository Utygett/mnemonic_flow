#!/bin/bash

# Скрипт для валидации VERSION при пуше из develop в release ветку
# Использование: ./validate-version.sh <release_branch_name>
# Пример: ./validate-version.sh release_v0.0.x

set -e

RELEASE_BRANCH_NAME=${1}

if [ -z "$RELEASE_BRANCH_NAME" ]; then
    echo "Error: Release branch name is required"
    echo "Usage: $0 <release_branch_name>"
    echo "Example: $0 release_v0.0.x"
    exit 1
fi

# Извлекаем major.minor из имени ветки (release_v0.0.x -> 0.0)
MAJOR_MINOR=$(echo "$RELEASE_BRANCH_NAME" | grep -oP 'release_v\K[0-9]+\.[0-9]+')

if [ -z "$MAJOR_MINOR" ]; then
    echo "::error::Invalid release branch name: ${RELEASE_BRANCH_NAME}"
    echo "Expected format: release_v{major}.{minor}.x"
    exit 1
fi

echo "Release branch: ${RELEASE_BRANCH_NAME}"
echo "Major.Minor: ${MAJOR_MINOR}"

# Читаем VERSION из текущей (release) ветки
RELEASE_VERSION=$(cat VERSION | tr -d '[:space:]')
echo "Release branch VERSION: ${RELEASE_VERSION}"

# Проверяем формат VERSION (major.minor.patch)
if ! echo "${RELEASE_VERSION}" | grep -qP '^\d+\.\d+\.\d+$'; then
    echo "::error::Release VERSION '${RELEASE_VERSION}' does not match format major.minor.patch"
    exit 1
fi

# Фетчим и читаем VERSION из develop
echo "Fetching develop branch..."
git fetch origin develop >/dev/null 2>&1

DEVELOP_VERSION=$(git show origin/develop:VERSION | tr -d '[:space:]')
echo "Develop branch VERSION: ${DEVELOP_VERSION}"

# Проверяем формат VERSION в develop (допускаем -dev)
if ! echo "${DEVELOP_VERSION}" | grep -qP '^\d+\.\d+\.\d+(-dev)?$'; then
    echo "::error::Develop VERSION '${DEVELOP_VERSION}' does not match format major.minor.patch[-dev]"
    exit 1
fi

# Проверяем что develop VERSION совпадает с major.minor ветки (убираем -dev для сравнения)
DEVELOP_MAJOR_MINOR=$(echo "${DEVELOP_VERSION}" | sed 's/-dev$//' | cut -d. -f1,2)
if [ "${DEVELOP_MAJOR_MINOR}" != "${MAJOR_MINOR}" ]; then
    echo "::error::Develop VERSION ${DEVELOP_VERSION} does not match release branch ${MAJOR_MINOR}.x"
    exit 1
fi

# Проверяем что develop VERSION > release VERSION (убираем -dev для сравнения)
DEVELOP_VERSION_CLEAN=$(echo "${DEVELOP_VERSION}" | sed 's/-dev$//')
if [ "$(echo -e "${RELEASE_VERSION}\n${DEVELOP_VERSION_CLEAN}" | sort -V | tail -n 1)" != "${DEVELOP_VERSION_CLEAN}" ]; then
    echo "::error::Develop VERSION (${DEVELOP_VERSION_CLEAN}) must be greater than release VERSION (${RELEASE_VERSION})"
    exit 1
fi

echo "✓ All validations passed!"
echo "  Develop VERSION ${DEVELOP_VERSION} > Release VERSION ${RELEASE_VERSION}"
echo "  Develop VERSION matches release branch ${MAJOR_MINOR}.x"

# Выводим версию для использования в других скриптах
echo "version=${DEVELOP_VERSION}" >> $GITHUB_OUTPUT 2>/dev/null || true
