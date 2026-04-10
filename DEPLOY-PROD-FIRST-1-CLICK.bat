@echo off
REM WINDOWS: double-click file nay.  LINUX/VPS: chay  bash DEPLOY-PROD-FIRST-1-CLICK.sh  (khong chay file .bat bang bash)
REM Lan dau: clone + docker + migrate + seed + cap nhat pk_ + build storefront. Tren may Windows: SSH qua deploy-vps.bat init.

cd /d "%~dp0"
call "%~dp0deploy-vps.bat" init
if errorlevel 1 pause
exit /b %ERRORLEVEL%
