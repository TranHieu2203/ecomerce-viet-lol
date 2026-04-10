@echo off
REM Tunnel giao dien Nginx Proxy Manager (cong 81 VPS) ve may local. IP: 103.124.94.227

setlocal EnableExtensions
set "SSH_HOST=103.124.94.227"
set "SSH_USER=root"
set "SSH_PORT=22"
set "LOCAL_PORT=8881"
set "REMOTE_PORT=81"

echo.
echo Tunnel: http://localhost:%LOCAL_PORT%  --^>  VPS 127.0.0.1:%REMOTE_PORT% (NPM UI)
echo Cua so SSH giu tunnel. Dong cua so hoac Ctrl+C de ngat.
echo.

start "SSH NPM UI tunnel" cmd /k "ssh -N -L %LOCAL_PORT%:127.0.0.1:%REMOTE_PORT% -p %SSH_PORT% %SSH_USER%@%SSH_HOST%"

timeout /t 4 /nobreak >nul
start "" "http://localhost:%LOCAL_PORT%/"

endlocal
