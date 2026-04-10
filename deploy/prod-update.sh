#!/usr/bin/env bash
# Production UPDATE (maintain) — chạy trên VPS
#
# Mục tiêu: deploy trong quá trình maintain:
# - pull image mới nhất
# - up -d (giữ nguyên volumes)
# - db:migrate (one-off)
#
# Usage:
#   bash deploy/prod-update.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="deploy/.env.production.local"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "[lỗi] Thiếu $ENV_FILE"
  echo "      Lần đầu chạy init: bash deploy/prod-init.sh (script sẽ tự tạo env.local)"
  exit 1
fi

COMPOSE=(docker compose -f deploy/docker-compose.prod.yml --env-file "$ENV_FILE")

dc() { "${COMPOSE[@]}" "$@"; }

db_preflight() {
  echo "[preflight] DATABASE_URL (from compose env):"
  dc run --rm --no-deps medusa-backend-1 sh -lc 'echo "  $DATABASE_URL"'
  dc run --rm --no-deps medusa-backend-1 sh -lc 'echo "  PGSSLMODE=$PGSSLMODE"'

  echo "[preflight] postgres DNS:"
  dc run --rm --no-deps medusa-backend-1 sh -lc 'getent hosts postgres || true'

  echo "[preflight] postgres readiness:"
  dc exec -T postgres pg_isready -U "${POSTGRES_USER:-medusa}" -d "${POSTGRES_DB:-medusa}"

  echo "[preflight] test connect via node(pg):"
  dc run --rm --no-deps medusa-backend-1 node -e "const { Client } = require('pg'); const cs = process.env.DATABASE_URL; const c = new Client({ connectionString: cs, ssl: false, connectionTimeoutMillis: 5000 }); c.connect().then(()=>c.end().then(()=>{console.log('  OK');process.exit(0)})).catch(e=>{console.error('  FAIL:', e.message);process.exit(1)})"
}

guard_database_url() {
  local dbu
  dbu="$(dc run --rm --no-deps medusa-backend-1 sh -lc 'printf %s \"$DATABASE_URL\"')"
  if [[ "$dbu" == *"ssl=false"* ]]; then
    echo "[lỗi] DATABASE_URL đang chứa 'ssl=false' — giá trị này có thể bị hiểu sai và bật SSL."
    echo "      Hãy bỏ query đó và dùng '?sslmode=disable' hoặc để compose tự set DATABASE_URL."
    exit 1
  fi
}

if [[ -d .git ]]; then
  git pull --ff-only
fi

echo "[update] docker compose pull + up -d..."
dc pull
dc up -d

db_preflight
guard_database_url

echo "[update] db:migrate (one-off)..."
dc run --rm --no-deps medusa-backend-1 npx medusa db:migrate

echo "[update] DONE."

