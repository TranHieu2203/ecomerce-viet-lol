#!/usr/bin/env bash
# Chạy trên VPS (Linux), thư mục hiện tại = gốc repo (có thư mục deploy/).
#   bash deploy/deploy-on-server.sh init
#   bash deploy/deploy-on-server.sh update
#
# init: docker compose up + db:migrate (lần đầu / DB trống).
# update: git pull + compose up + db:migrate (schema mới nếu có).

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

wait_then_migrate() {
  local msg="${1:-}"
  [[ -n "$msg" ]] && echo "$msg"
  sleep 20
  dc exec -T medusa-backend-1 npx medusa db:migrate
}

case "${1:-}" in
  init)
    require_env_file
    if [[ ! -d .git ]]; then
      echo "[lỗi] Thư mục không phải git repo: $ROOT"
      echo "      Lần đầu: dùng deploy-vps.bat init (sẽ clone) hoặc git clone rồi tạo .env.production."
      exit 1
    fi
    git pull --ff-only
    dc up -d --build
    wait_then_migrate "[init] Đợi backend khởi động rồi chạy db:migrate..."
    echo "[init] Xong. NPM UI: cổng 81. Admin Medusa: /app sau khi cấu hình domain."
    ;;
  update)
    require_env_file
    if [[ ! -d .git ]]; then
      echo "[lỗi] Không có .git — không pull được."
      exit 1
    fi
    git pull --ff-only
    dc up -d --build
    echo "[update] Chạy db:migrate (an toàn khi đã có schema)..."
    dc exec -T medusa-backend-1 npx medusa db:migrate || {
      echo "[cảnh báo] db:migrate lỗi — kiểm tra log: dc logs medusa-backend-1"
      exit 1
    }
    echo "[update] Xong."
    ;;
  *)
    echo "Cách dùng: $0 init | update"
    exit 1
    ;;
esac
