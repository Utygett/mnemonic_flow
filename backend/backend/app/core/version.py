"""Версия приложения, читается из переменной окружения или VERSION файла."""

import os
from pathlib import Path


def get_version() -> str:
    """Читает версию из переменной окружения или VERSION файла.

    Приоритет:
    1. APP_VERSION (устанавливается при сборке Docker через ARG)
    2. VERSION файл в корне проекта (локальная разработка)
    """
    # Docker: версия передаётся через ARG при сборке в APP_VERSION
    if app_version := os.getenv("APP_VERSION"):
        return app_version

    # Локальная разработка: VERSION файл в корне проекта
    local_version = Path(__file__).parent.parent.parent.parent / "VERSION"
    if local_version.exists():
        return local_version.read_text().strip()

    return "unknown"


__version__ = get_version()
