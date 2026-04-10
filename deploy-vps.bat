@echo off
setlocal EnableExtensions
REM Deploy qua SSH. IP: 103.124.94.227 (doi neu doi VPS). REMOTE_DIR / GIT_URL neu can.
REM   deploy-vps.bat init — lan dau: clone + docker + migrate + seed (nhu dev) + ensure-shipping
REM           + tu sinh JWT/COOKIE/REVALIDATE neu con CHANGE_ME_* + ghi pk_ vao .env + build lai storefront
REM   deploy-vps.bat update — git pull + docker + migrate (khong seed, khong sua env)
REM File deploy/.env.production tren VPS: domain + POSTGRES_PASSWORD nen dat tay; secret placeholder co the de init tu tao.

set "SSH_HOST=103.124.94.227"
set "SSH_USER=root"
set "SSH_PORT=22"
set "REMOTE_DIR=/root/ecomerce-viet-lol"
set "GIT_URL=https://github.com/TranHieu2203/ecomerce-viet-lol.git"

set "MODE=%~1"
if "%MODE%"=="" (
  echo Cach dung:
  echo   Double-click: DEPLOY-PROD-FIRST-1-CLICK.bat ^(lan dau^) hoac DEPLOY-PROD-UPDATE-CODE-1-CLICK.bat ^(sua code^)
  echo   Hoac: deploy-vps.bat init ^| update
  exit /b 1
)

if /i "%MODE%"=="init" (
  ssh -p %SSH_PORT% %SSH_USER%@%SSH_HOST% "set -e; if [ ! -d '%REMOTE_DIR%/.git' ]; then git clone '%GIT_URL%' '%REMOTE_DIR%'; fi; cd '%REMOTE_DIR%' && bash deploy/deploy-on-server.sh init"
  goto :done
)

if /i "%MODE%"=="update" (
  ssh -p %SSH_PORT% %SSH_USER%@%SSH_HOST% "set -e; cd '%REMOTE_DIR%' && bash deploy/deploy-on-server.sh update"
  goto :done
)

echo Khong ro lenh: %MODE% ^(dung init hoac update^)
exit /b 1

:done
endlocal
