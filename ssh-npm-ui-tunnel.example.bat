@echo off
REM Sao chep thanh ssh-npm-ui-tunnel.bat, dat SSH_HOST = IP VPS, roi double-click.
REM File .bat thuc te nen nam trong .gitignore (khong commit IP).

setlocal EnableExtensions
set "SSH_HOST=THAY-BANG-IP-VPS"
set "SSH_USER=root"
set "SSH_PORT=22"
set "LOCAL_PORT=8881"
set "REMOTE_PORT=81"

echo.
echo Tunnel: http://localhost:%LOCAL_PORT%  --^>  VPS 127.0.0.1:%REMOTE_PORT% (NPM UI)
echo.

start "SSH NPM UI tunnel" cmd /k "ssh -N -L %LOCAL_PORT%:127.0.0.1:%REMOTE_PORT% -p %SSH_PORT% %SSH_USER%@%SSH_HOST%"

timeout /t 4 /nobreak >nul
start "" "http://localhost:%LOCAL_PORT%/"

endlocal
