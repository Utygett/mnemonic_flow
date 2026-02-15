#!/usr/bin/env bash
set -euo pipefail

HOST="mnemonicflow"  # имя из ~/.ssh/config
REMOTE_DIST="/opt/mnemonicflow/mnemonic-flow-infra/deploy/frontend/dist"
REMOTE_UPDATE="/opt/mnemonicflow/update_prod.sh"

echo "==> Build frontend"
npm ci
VITE_API_URL=/api npm run build

echo "==> Upload dist/"
# Важно: dist/ со слешем — синхронизирует содержимое папки (и --delete чистит удалённые файлы). [web:1008][web:896]
rsync -avz --delete dist/ "${HOST}:${REMOTE_DIST}/"

echo "==> Update server + restart reverse-proxy nginx"
ssh "${HOST}" "bash -lc '
  ${REMOTE_UPDATE} &&
  cd /opt/mnemonicflow/mnemonic-flow-infra &&
  docker compose -f compose.prod.yml --env-file .env.prod restart nginx
'"
