#!/usr/bin/env bash
# Production INIT (wipe all data) — chạy trên VPS
#
# Mục tiêu: deploy lần đầu / làm lại từ đầu:
# - pull image mới nhất
# - DOWN + xoá toàn bộ named volumes của stack production (DB/Redis/uploads/NPM data)
# - up lại services
# - db:migrate + seed
#
# Usage:
#   bash deploy/prod-init.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="deploy/.env.production"
if [[ -f deploy/.env.production.local ]]; then
  ENV_FILE="deploy/.env.production.local"
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

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[lỗi] Thiếu $ENV_FILE"
  echo "      cp deploy/.env.production.example $ENV_FILE rồi sửa CHANGE_ME_*"
  exit 1
fi

if [[ -d .git ]]; then
  git pull --ff-only
fi

echo "[init] CẢNH BÁO: sẽ xoá TOÀN BỘ dữ liệu (DB, redis, uploads, NPM data/certs) của stack production."
echo "[init] docker compose pull..."
dc pull

echo "[init] docker compose down -v (wipe volumes)..."
dc down -v --remove-orphans

echo "[init] docker compose up -d..."
dc up -d

db_preflight
guard_database_url

echo "[init] db:migrate (one-off)..."
dc run --rm --no-deps medusa-backend-1 npx medusa db:migrate

echo "[init] seed..."
dc exec -T medusa-backend-1 sh -lc "cd /app/apps/backend && npm run seed"
dc exec -T medusa-backend-1 sh -lc "cd /app/apps/backend && npm run seed:ensure-shipping"

echo "[init] DONE."

