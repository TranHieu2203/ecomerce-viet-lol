@echo off
setlocal EnableExtensions
REM Mot double-click: Postgres/Redis Docker + migrate + seed + ensure-shipping (gan giong dev).
REM Can: Docker Desktop, Node/npm, file apps\backend\.env (DATABASE_URL toi localhost:5433).
REM Khong xoa volume Docker — lan sau chi chay lai neu can reset DB (docker compose down -v).

cd /d "%~dp0"

where docker >nul 2>&1 || (echo Cai Docker Desktop. & pause & exit /b 1)

echo [1/4] Docker: postgres + redis...
docker compose up -d
if errorlevel 1 (echo loi docker compose & pause & exit /b 1)

echo [2/4] Doi Postgres san sang (15s)...
timeout /t 15 /nobreak >nul

if not exist "apps\backend\.env" (
  echo [loi] Thieu apps\backend\.env — copy apps\backend\.env.template thanh .env va dat DATABASE_URL.
  pause
  exit /b 1
)

pushd apps\backend
echo [3/4] db:migrate + seed + ensure-shipping...
call npx medusa db:migrate
if errorlevel 1 (echo loi migrate & popd & pause & exit /b 1)
call npm run seed
if errorlevel 1 (echo loi seed & popd & pause & exit /b 1)
call npm run seed:ensure-shipping
if errorlevel 1 (echo loi ensure-shipping & popd & pause & exit /b 1)

echo [4/4] Publishable key (copy vao apps\backend-storefront\.env.local neu can)...
call npx medusa exec ./src/scripts/print-publishable-key.ts 2>nul
popd

echo.
echo Xong. Chay song song:
echo   npm run dev:backend
echo   npm run dev:storefront
echo Du lieu DB nam trong volume Docker — sua code / restart khong mat DB.
pause
endlocal
