#!/usr/bin/env bash
# Chay tren Ubuntu (VPS): cai Git + Docker Engine + plugin docker compose.
#   curl -fsSL ... | bash   HOAC   sudo bash deploy/bootstrap-ubuntu-git-docker.sh
set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Chay lai voi sudo: sudo bash $0"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y git ca-certificates curl

# Docker official (Engine + compose plugin)
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  sh /tmp/get-docker.sh
  rm -f /tmp/get-docker.sh
else
  echo "[ok] docker da co san"
fi

# Nguoi dang SSH (khong phai root) vao nhom docker — tranh phai sudo moi lan compose
if [[ -n "${SUDO_USER:-}" && "${SUDO_USER}" != "root" ]]; then
  usermod -aG docker "${SUDO_USER}"
  echo "[xong] Da them '${SUDO_USER}' vao nhom docker. Dang xuat / SSH lai roi thu: docker ps"
fi

docker --version
docker compose version
git --version
