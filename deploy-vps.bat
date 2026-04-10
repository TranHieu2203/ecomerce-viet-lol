@echo off
setlocal EnableExtensions
REM Deploy qua SSH. IP: 103.124.94.227 (doi neu doi VPS). REMOTE_DIR / GIT_URL neu can.
REM   deploy-vps.bat init    — lan dau: clone (neu chua co) + docker + db:migrate
REM   deploy-vps.bat update — git pull + docker + db:migrate
REM Tren VPS can deploy/.env.production (co trong repo, doi CHANGE_ME_* truoc go live).

set "SSH_HOST=103.124.94.227"
set "SSH_USER=root"
set "SSH_PORT=22"
set "REMOTE_DIR=/root/ecomerce-viet-lol"
set "GIT_URL=https://github.com/TranHieu2203/ecomerce-viet-lol.git"

set "MODE=%~1"
if "%MODE%"=="" (
  echo Cach dung:
  echo   deploy-vps.bat init    — lan dau: clone ^(neu can^) + docker + migrate DB
  echo   deploy-vps.bat update — git pull + docker + migrate
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
