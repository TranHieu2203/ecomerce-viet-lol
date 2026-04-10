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

echo "[update] docker compose pull + up -d..."
dc pull
dc up -d

echo "[update] db:migrate (one-off)..."
dc run --rm --no-deps medusa-backend-1 npx medusa db:migrate

echo "[update] DONE."

