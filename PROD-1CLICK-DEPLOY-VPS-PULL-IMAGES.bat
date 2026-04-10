@echo off
setlocal EnableExtensions
REM 1-click từ Windows/local: SSH vào VPS và chạy init/update (VPS chỉ pull image từ DockerHub).
REM Dùng:
REM   PROD-1CLICK-DEPLOY-VPS-PULL-IMAGES.bat init
REM   PROD-1CLICK-DEPLOY-VPS-PULL-IMAGES.bat update
REM
REM Trước khi chạy update: sửa deploy/.env.production trên VPS với BACKEND_IMAGE + STOREFRONT_IMAGE tag mới.

set "SSH_HOST=103.124.94.227"
set "SSH_USER=root"
set "SSH_PORT=22"
set "REMOTE_DIR=/root/ecomerce-viet-lol"
set "GIT_URL=https://github.com/TranHieu2203/ecomerce-viet-lol.git"

set "MODE=%~1"
if "%MODE%"=="" (
  echo Cach dung:
  echo   %~nx0 init
  echo   %~nx0 update
  exit /b 1
)

if /i "%MODE%"=="init" (
  ssh -p %SSH_PORT% %SSH_USER%@%SSH_HOST% "set -e; if [ ! -d '%REMOTE_DIR%/.git' ]; then git clone '%GIT_URL%' '%REMOTE_DIR%'; fi; cd '%REMOTE_DIR%' && bash deploy/deploy-on-server.sh init"
  exit /b %ERRORLEVEL%
)

if /i "%MODE%"=="update" (
  ssh -p %SSH_PORT% %SSH_USER%@%SSH_HOST% "set -e; cd '%REMOTE_DIR%' && bash deploy/deploy-on-server.sh update"
  exit /b %ERRORLEVEL%
)

echo Khong ro lenh: %MODE% ^(dung init hoac update^)
exit /b 1

