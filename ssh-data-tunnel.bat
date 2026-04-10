@echo off
REM Tunnel Postgres + Redis tu VPS ve may local. IP: 103.124.94.227
REM Can stack prod da map 127.0.0.1:5432 va :6379 tren VPS (docker-compose.prod.yml).
REM   PostgreSQL: localhost:15432  |  Redis: localhost:16379

setlocal EnableExtensions
set "SSH_HOST=103.124.94.227"
set "SSH_USER=root"
set "SSH_PORT=22"
set "LOCAL_PG=15432"
set "LOCAL_REDIS=16379"

echo.
echo Tunnel data ve may local:
echo   PostgreSQL  localhost:%LOCAL_PG%  --^>  VPS 127.0.0.1:5432
echo   Redis       localhost:%LOCAL_REDIS%  --^>  VPS 127.0.0.1:6379
echo Giu cua so SSH mo. Dong hoac Ctrl+C de ngat.
echo.

start "SSH data tunnel (PG+Redis)" cmd /k "ssh -N -L %LOCAL_PG%:127.0.0.1:5432 -L %LOCAL_REDIS%:127.0.0.1:6379 -p %SSH_PORT% %SSH_USER%@%SSH_HOST%"

endlocal
