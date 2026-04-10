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

ENV_LOCAL="deploy/.env.production.local"
ENV_LOCAL_EXAMPLE="deploy/.env.production.local.example"
ENV_TEMPLATE="deploy/.env.production"

ensure_env_local() {
  if [[ -f "$ENV_LOCAL" ]]; then
    return 0
  fi

  if [[ ! -f "$ENV_LOCAL_EXAMPLE" ]]; then
    echo "[lỗi] Thiếu $ENV_LOCAL_EXAMPLE"
    exit 1
  fi

  cp "$ENV_LOCAL_EXAMPLE" "$ENV_LOCAL"

  # copy non-secret defaults from template if available (domain/cors/images)
  if [[ -f "$ENV_TEMPLATE" ]]; then
    while IFS= read -r line; do
      [[ -z "$line" ]] && continue
      [[ "$line" == \#* ]] && continue
      if [[ "$line" =~ ^([A-Z0-9_]+)=(.*)$ ]]; then
        k="${BASH_REMATCH[1]}"
        v="${BASH_REMATCH[2]}"
        case "$k" in
          DOCKERHUB_NAMESPACE|BACKEND_IMAGE|STOREFRONT_IMAGE|STORE_CORS|ADMIN_CORS|AUTH_CORS|MEDUSA_BACKEND_URL|NEXT_PUBLIC_DEFAULT_REGION|NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY|STOREFRONT_REVALIDATE_URL)
            if grep -qE "^${k}=" "$ENV_LOCAL"; then
              sed -i "s|^${k}=.*|${k}=${v}|" "$ENV_LOCAL"
            else
              echo "${k}=${v}" >> "$ENV_LOCAL"
            fi
            ;;
        esac
      fi
    done < "$ENV_TEMPLATE"
  fi

  # generate secrets/password if placeholders
  gen_or_keep() {
    local key="$1"
    local cur
    cur="$(grep -E "^${key}=" "$ENV_LOCAL" | head -1 | cut -d= -f2- || true)"
    if [[ -z "$cur" || "$cur" == *CHANGE_ME* ]]; then
      local next
      next="$(openssl rand -hex 32)"
      sed -i "s|^${key}=.*|${key}=${next}|" "$ENV_LOCAL" 2>/dev/null || true
      if ! grep -qE "^${key}=" "$ENV_LOCAL"; then
        echo "${key}=${next}" >> "$ENV_LOCAL"
      fi
    fi
  }

  # Strong but simple: hex (no special chars)
  local pgpass
  pgpass="$(grep -E "^POSTGRES_PASSWORD=" "$ENV_LOCAL" | head -1 | cut -d= -f2- || true)"
  if [[ -z "$pgpass" || "$pgpass" == *CHANGE_ME* ]]; then
    pgpass="$(openssl rand -hex 16)"
    sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${pgpass}|" "$ENV_LOCAL" 2>/dev/null || true
    if ! grep -qE "^POSTGRES_PASSWORD=" "$ENV_LOCAL"; then
      echo "POSTGRES_PASSWORD=${pgpass}" >> "$ENV_LOCAL"
    fi
  fi

  gen_or_keep JWT_SECRET
  gen_or_keep COOKIE_SECRET
  gen_or_keep REVALIDATE_SECRET

  echo "[init] Đã tạo $ENV_LOCAL (secrets đã được generate)."
}

ENV_FILE="$ENV_LOCAL"

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

ensure_env_local

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

