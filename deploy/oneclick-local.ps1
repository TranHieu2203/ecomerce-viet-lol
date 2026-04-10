$ErrorActionPreference = "Stop"

function Exec($cmd) {
  Write-Host ">> $cmd"
  iex $cmd
}

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $root

# Local one-click (Windows)
# - Starts Postgres + Redis (root docker-compose.yml)
# - Builds + runs Medusa backend + Next storefront (prod-like) using deploy/docker-compose.prod.yml
# - Runs migrate + seed so local DB matches repo seed (like fresh prod init)
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File deploy\oneclick-local.ps1
#

$envFile = Join-Path $root "deploy\.env.local"
if (!(Test-Path $envFile)) {
  @"
# Local env (DO NOT commit secrets)
POSTGRES_USER=medusa
POSTGRES_PASSWORD=medusa
POSTGRES_DB=medusa

STORE_CORS=http://localhost:8000
ADMIN_CORS=http://localhost:9000
AUTH_CORS=http://localhost:8000,http://localhost:9000

JWT_SECRET=local_jwt_secret_change_me
COOKIE_SECRET=local_cookie_secret_change_me

STOREFRONT_REVALIDATE_URL=http://storefront:8000
REVALIDATE_SECRET=local_revalidate_secret_change_me

# Storefront (SSR trong container → service Docker; browser → localhost đã map 127.0.0.1:9000)
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_CHANGE_ME_AFTER_SEED
MEDUSA_BACKEND_URL=http://medusa-backend-1:9000
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://127.0.0.1:9000
NEXT_PUBLIC_DEFAULT_REGION=vn
"@ | Out-File -Encoding utf8 $envFile

  Write-Host "[init] Created $envFile. You may edit NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY after first seed."
}

# Start DB/Redis for local developer machine.
Exec "docker compose -f docker-compose.yml up -d"

# Start app stack (build locally). We keep NPM disabled locally by scaling it to 0.
Exec "docker compose -f deploy/docker-compose.prod.yml --env-file `"$envFile`" up -d --build --scale nginx-proxy-manager=0"

Write-Host "[deploy] Running db:migrate..."
Exec "docker compose -f deploy/docker-compose.prod.yml --env-file `"$envFile`" run --rm --no-deps medusa-backend-1 npx medusa db:migrate"

Write-Host "[deploy] Seeding..."
Exec "docker compose -f deploy/docker-compose.prod.yml --env-file `"$envFile`" exec -T medusa-backend-1 sh -lc `"cd /app/apps/backend && npm run seed && npm run seed:ensure-shipping`""

Write-Host ""
Write-Host "[OK] Local is up."
Write-Host "- Storefront: http://localhost:8000"
Write-Host "- Backend/Admin: http://localhost:9000/app"

