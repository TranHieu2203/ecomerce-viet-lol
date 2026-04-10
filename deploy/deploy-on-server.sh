#!/usr/bin/env bash
# Chạy trên VPS (Linux), cwd = gốc repo.
#   bash deploy/deploy-on-server.sh init
#   bash deploy/deploy-on-server.sh update
#
# init (gần giống dev lần đầu):
#   - (tuỳ chọn) sinh JWT_SECRET / COOKIE_SECRET / REVALIDATE_SECRET nếu vẫn là CHANGE_ME_*
#   - docker compose up --build, db:migrate
#   - npm run seed + seed:ensure-shipping (dữ liệu region, channel, publishable key trong DB)
#   - đọc pk_ (sau seed), ghi NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY vào deploy/.env.production, build lại storefront
#   - Admin user: lần đầu mở https://admin.../app (Medusa onboarding) hoặc tạo trong Admin.
#
# update: git pull + compose up --build + migrate (KHÔNG seed, KHÔNG down -v).
#    Volume postgres_data / redis_data / medusa_uploads / npm_* giữ nguyên — update chỉ pull image mới + restart container.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production)

dc() {
  "${COMPOSE[@]}" "$@"
}

require_env_file() {
  if [[ ! -f deploy/.env.production ]]; then
    echo "[lỗi] Thiếu deploy/.env.production"
    echo "      cp deploy/.env.production.example deploy/.env.production hoặc lấy từ repo; chỉnh CHANGE_ME_*"
    exit 1
  fi
}

# Đọc một key từ deploy/.env.production (một dòng KEY=val)
env_prod_get() {
  local key="$1"
  grep -E "^${key}=" deploy/.env.production 2>/dev/null | head -1 | cut -d= -f2- || true
}

# Thay một dòng KEY=... trong deploy/.env.production (val không chứa xuống dòng)
env_prod_set() {
  local key="$1"
  local val="$2"
  if grep -qE "^${key}=" deploy/.env.production; then
    sed -i.bak "s|^${key}=.*|${key}=${val}|" deploy/.env.production
    rm -f deploy/.env.production.bak
  else
    echo "${key}=${val}" >> deploy/.env.production
  fi
}

# Sinh secret hex nếu giá trị hiện tại chứa CHANGE_ME (không đụng POSTGRES_PASSWORD — tránh lệch volume DB cũ)
ensure_generated_secrets() {
  local jwt cookie rev
  jwt=$(env_prod_get JWT_SECRET)
  cookie=$(env_prod_get COOKIE_SECRET)
  rev=$(env_prod_get REVALIDATE_SECRET)
  if [[ "$jwt" == *CHANGE_ME* ]]; then
    jwt=$(openssl rand -hex 32)
    env_prod_set JWT_SECRET "$jwt"
    echo "[init] Đã ghi JWT_SECRET mới vào deploy/.env.production"
  fi
  if [[ "$cookie" == *CHANGE_ME* ]]; then
    cookie=$(openssl rand -hex 32)
    env_prod_set COOKIE_SECRET "$cookie"
    echo "[init] Đã ghi COOKIE_SECRET mới vào deploy/.env.production"
  fi
  if [[ "$rev" == *CHANGE_ME* ]]; then
    rev=$(openssl rand -hex 32)
    env_prod_set REVALIDATE_SECRET "$rev"
    echo "[init] Đã ghi REVALIDATE_SECRET mới (backend + storefront dùng chung file này)"
  fi
}

wait_then_migrate() {
  local msg="${1:-}"
  [[ -n "$msg" ]] && echo "$msg"
  sleep 25
  # dùng "run --rm" để migrate chạy được ngay cả khi backend đang crash-loop
  dc run --rm --no-deps medusa-backend-1 npx medusa db:migrate
}

run_seed_stack() {
  echo "[init] Chạy npm run seed (region VN, sales channel, publishable key trong DB)..."
  dc exec -T medusa-backend-1 sh -lc "cd /app/apps/backend && npm run seed"
  echo "[init] Chạy seed:ensure-shipping..."
  dc exec -T medusa-backend-1 sh -lc "cd /app/apps/backend && npm run seed:ensure-shipping"
}

sync_publishable_key_to_env() {
  local pk
  pk=$(dc exec -T medusa-backend-1 sh -lc \
    "cd /app/apps/backend && npx medusa exec ./src/scripts/print-publishable-key.ts" 2>/dev/null \
    | tr -d '\r' | grep -E '^pk_' | head -1 || true)
  if [[ -z "$pk" ]]; then
    pk=$(dc exec -T postgres psql -U medusa -d medusa -t -A -c \
      "SELECT token FROM api_key WHERE type = 'publishable' ORDER BY created_at DESC NULLS LAST LIMIT 1;" 2>/dev/null \
      | tr -d '[:space:]' || true)
  fi
  if [[ -z "$pk" || "${pk:0:3}" != "pk_" ]]; then
    echo "[cảnh báo] Không đọc được publishable key — Admin Medusa → Publishable API keys, copy pk_ vào deploy/.env.production rồi: docker compose ... build storefront && up -d storefront"
    return 0
  fi
  env_prod_set NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY "$pk"
  echo "[init] Đã ghi NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY vào deploy/.env.production"
  echo "[init] Lưu ý: storefront image được build/push từ local. Hãy build lại storefront image với pk_ mới rồi chạy lại: bash deploy/deploy-on-server.sh update"
}

case "${1:-}" in
  init)
    require_env_file
    if [[ ! -d .git ]]; then
      echo "[lỗi] Thư mục không phải git repo: $ROOT"
      exit 1
    fi
    if [[ -d .git ]]; then
      git pull --ff-only
    fi
    ensure_generated_secrets
    echo "[init] docker compose pull + up..."
    dc pull
    dc up -d
    wait_then_migrate "[init] db:migrate..."
    run_seed_stack
    sync_publishable_key_to_env
    echo "[init] Xong. NPM :81 | Admin: https://admin.../app | Kiểm tra deploy/.env.production (POSTGRES_PASSWORD vẫn nên đổi tay nếu go live)."
    ;;
  update)
    require_env_file
    if [[ -d .git ]]; then
      git pull --ff-only
    fi
    echo "[update] docker compose pull + up..."
    dc pull
    dc up -d
    echo "[update] db:migrate..."
    dc run --rm --no-deps medusa-backend-1 npx medusa db:migrate || {
      echo "[cảnh báo] db:migrate lỗi — xem log medusa-backend-1"
      exit 1
    }
    echo "[update] Xong. DB & upload volume không bị xóa — chỉ image/container được pull + restart."
    ;;
  *)
    echo "Cách dùng: $0 init | update"
    exit 1
    ;;
esac
