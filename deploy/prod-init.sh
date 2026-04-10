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

COMPOSE=(docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production)

dc() { "${COMPOSE[@]}" "$@"; }

if [[ ! -f deploy/.env.production ]]; then
  echo "[lỗi] Thiếu deploy/.env.production"
  echo "      cp deploy/.env.production.example deploy/.env.production rồi sửa CHANGE_ME_*"
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

echo "[init] db:migrate (one-off)..."
dc run --rm --no-deps medusa-backend-1 npx medusa db:migrate

echo "[init] seed..."
dc exec -T medusa-backend-1 sh -lc "cd /app/apps/backend && npm run seed"
dc exec -T medusa-backend-1 sh -lc "cd /app/apps/backend && npm run seed:ensure-shipping"

echo "[init] DONE."

