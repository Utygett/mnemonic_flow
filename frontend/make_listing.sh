#!/usr/bin/env bash

SRC_DIR="src"
OUTPUT="listing.txt"

# Маски исключений (добавляй свои)
EXCLUDES=(
  "*/.venv/*"
  "*/__pycache__/*"
  "*/node_modules/*"
  "*.pyc"
  "*.log"
  "*.md*"
  "*.css*"
)

# Очищаем файл вывода
: > "$OUTPUT"

# Формируем параметры исключений для find
EXCLUDE_ARGS=()
for pattern in "${EXCLUDES[@]}"; do
  EXCLUDE_ARGS+=( ! -path "$pattern" )
done

find "$SRC_DIR" -type f "${EXCLUDE_ARGS[@]}" | while read -r file; do
  echo "==============================" >> "$OUTPUT"
  echo "FILE: $file" >> "$OUTPUT"
  echo "==============================" >> "$OUTPUT"
  echo >> "$OUTPUT"
  cat "$file" >> "$OUTPUT"
  echo -e "\n\n" >> "$OUTPUT"
done
