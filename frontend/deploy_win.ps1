Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$HostName     = "mnemonicflow"  # Host из ~/.ssh/config
$RemoteDist   = "/opt/mnemonicflow/mnemonic-flow-infra/deploy/frontend/dist"
$RemoteUpdate = "/opt/mnemonicflow/update_prod.sh"

Write-Host "==> Build frontend"
npm ci

# Временно выставляем VITE_API_URL только на время build и потом возвращаем назад
$oldVite = $env:VITE_API_URL
try {
  $env:VITE_API_URL = "/api"
  npm run build
}
finally {
  $env:VITE_API_URL = $oldVite
}

Write-Host "==> Pack dist/"
if (Test-Path ".\dist.tgz") { Remove-Item ".\dist.tgz" -Force }
tar -czf dist.tgz -C dist .

Write-Host "==> Upload dist.tgz"
scp .\dist.tgz "$HostName`:/tmp/mnemonicflow-dist.tgz"

Write-Host "==> Deploy on server"

$remoteLines = @(
  'set -eu'
  '(set -o pipefail) 2>/dev/null || true'
  "mkdir -p '$RemoteDist'"
  "rm -rf '$RemoteDist'/*"
  "tar -xzf /tmp/mnemonicflow-dist.tgz -C '$RemoteDist'"
  "rm -f /tmp/mnemonicflow-dist.tgz"
  "$RemoteUpdate"
  "cd /opt/mnemonicflow/mnemonic-flow-infra"
  "docker compose -f compose.prod.yml --env-file .env.prod restart nginx"
)

# Важно: join через `n даёт LF, без CRLF
$remoteScript = ($remoteLines -join "`n") + "`n"

$remoteScript | ssh $HostName "bash -se"
if ($LASTEXITCODE -ne 0) { throw "remote deploy failed with code $LASTEXITCODE" }
