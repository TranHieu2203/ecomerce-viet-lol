#!/usr/bin/env bash
# Chay tren VPS (Ubuntu/Linux), trong thu muc goc repo — KHONG dung bash ten file .bat
set -euo pipefail
cd "$(dirname "$0")"
exec bash deploy/deploy-on-server.sh update
