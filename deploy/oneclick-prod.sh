#!/usr/bin/env bash
#
# One-click deploy PRODUCTION (Ubuntu)
# - Build trực tiếp trên server (không DockerHub)
# - Hỗ trợ 2 mode:
#   - init  : WIPE toàn bộ docker (images/volumes) + build + up + migrate + seed
#   - update: build + up + migrate (KHÔNG seed, KHÔNG wipe volumes)
#
# Usage:
#   bash deploy/oneclick-prod.sh init
#   bash deploy/oneclick-prod.sh update
#
set -euo pipefail

MODE="${1:-}"
if [[ "$MODE" != "init" && "$MODE" != "update" ]]; then
  echo "Usage: bash deploy/oneclick-prod.sh [init|update]"
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_TEMPLATE="deploy/.env.production"
ENV_LOCAL="deploy/.env.production.local"

if [[ ! -f "$ENV_TEMPLATE" ]]; then
  echo "[error] Missing $ENV_TEMPLATE"
  exit 1
fi

ensure_env_local() {
  if [[ -f "$ENV_LOCAL" ]]; then
    return 0
  fi

  cp "$ENV_TEMPLATE" "$ENV_LOCAL"

  gen_or_keep() {
    local key="$1"
    local cur
    cur="$(grep -E "^${key}=" "$ENV_LOCAL" | head -1 | cut -d= -f2- || true)"
    if [[ -z "$cur" || "$cur" == *CHANGE_ME* ]]; then
      local next
      next="$(openssl rand -hex 32)"
      if grep -qE "^${key}=" "$ENV_LOCAL"; then
        sed -i "s|^${key}=.*|${key}=${next}|" "$ENV_LOCAL"
      else
        echo "${key}=${next}" >> "$ENV_LOCAL"
      fi
    fi
  }

  # Postgres password: chỉ hex để tránh URL-encode rắc rối (DATABASE_URL fallback trong compose).
  local pgpass
  pgpass="$(grep -E "^POSTGRES_PASSWORD=" "$ENV_LOCAL" | head -1 | cut -d= -f2- || true)"
  if [[ -z "$pgpass" || "$pgpass" == *CHANGE_ME* ]]; then
    pgpass="$(openssl rand -hex 16)"
    if grep -qE "^POSTGRES_PASSWORD=" "$ENV_LOCAL"; then
      sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${pgpass}|" "$ENV_LOCAL"
    else
      echo "POSTGRES_PASSWORD=${pgpass}" >> "$ENV_LOCAL"
    fi
  fi

  gen_or_keep JWT_SECRET
  gen_or_keep COOKIE_SECRET
  gen_or_keep REVALIDATE_SECRET

  echo "[init] Created $ENV_LOCAL (generated secrets)."
  echo "[init] IMPORTANT: edit $ENV_LOCAL and set:"
  echo "       - NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY"
  echo "       - MEDUSA_BACKEND_URL"
  echo "       - STORE_CORS / ADMIN_CORS / AUTH_CORS"
}

ensure_env_local

COMPOSE=(docker compose -f deploy/docker-compose.prod.yml --env-file "$ENV_LOCAL")
dc() { "${COMPOSE[@]}" "$@"; }

git_pull_if_possible() {
  if [[ -d .git ]]; then
    git pull --ff-only || true
  fi
}

wipe_docker_everything() {
  echo "[wipe] Stopping all running containers (if any)..."
  docker ps -q | xargs -r docker stop || true

  echo "[wipe] Removing all containers..."
  docker ps -aq | xargs -r docker rm -f || true

  echo "[wipe] Removing all volumes..."
  docker volume ls -q | xargs -r docker volume rm -f || true

  echo "[wipe] Removing all networks (except defaults)..."
  docker network ls --format '{{.Name}}' \
    | grep -Ev '^(bridge|host|none)$' \
    | xargs -r docker network rm || true

  echo "[wipe] Removing all images..."
  docker images -aq | xargs -r docker rmi -f || true

  echo "[wipe] DONE."
}

healthcheck_db() {
  echo "[check] postgres readiness..."
  dc exec -T postgres pg_isready -U "${POSTGRES_USER:-medusa}" -d "${POSTGRES_DB:-medusa}"
}

guard_database_url() {
  local dbu
  dbu="$(dc run --rm --no-deps medusa-backend-1 sh -lc 'printf %s "$DATABASE_URL"')"
  if [[ "$dbu" == *"ssl=false"* ]]; then
    echo "[error] DATABASE_URL contains 'ssl=false' — some parsers treat it as truthy and enable SSL."
    echo "        Use '?sslmode=disable' (already default in compose) or remove that query."
    exit 1
  fi
}

if [[ "$MODE" == "init" ]]; then
  echo "[mode:init] WARNING: this will WIPE ALL docker images/volumes on this server."
  read -r -p "Type 'WIPE' to continue: " confirm
  if [[ "$confirm" != "WIPE" ]]; then
    echo "[mode:init] Aborted."
    exit 1
  fi
fi

git_pull_if_possible

if [[ "$MODE" == "init" ]]; then
  wipe_docker_everything
fi

echo "[deploy] Building + starting containers..."
dc up -d --build

healthcheck_db
guard_database_url

echo "[deploy] Running db:migrate..."
dc run --rm --no-deps medusa-backend-1 npx medusa db:migrate

if [[ "$MODE" == "init" ]]; then
  echo "[deploy] Seeding (prod data = repo seed)..."
  dc exec -T medusa-backend-1 sh -lc "cd /app/apps/backend && npm run seed"
  dc exec -T medusa-backend-1 sh -lc "cd /app/apps/backend && npm run seed:ensure-shipping"
fi

echo "[deploy] DONE."

