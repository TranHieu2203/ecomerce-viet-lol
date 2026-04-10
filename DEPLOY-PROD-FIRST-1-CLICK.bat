@echo off
REM Lan dau tren VPS: clone + docker + migrate + seed + cap nhat pk_ trong deploy/.env.production + build storefront.
REM Double-click — goi deploy-vps.bat init (SSH toi server trong deploy-vps.bat).

cd /d "%~dp0"
call "%~dp0deploy-vps.bat" init
if errorlevel 1 pause
exit /b %ERRORLEVEL%
