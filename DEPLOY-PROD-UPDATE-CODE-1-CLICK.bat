@echo off
REM WINDOWS: double-click.  LINUX/VPS:  bash DEPLOY-PROD-UPDATE-CODE-1-CLICK.sh
REM Pull + build + migrate; khong seed, khong xoa volume.

cd /d "%~dp0"
call "%~dp0deploy-vps.bat" update
if errorlevel 1 pause
exit /b %ERRORLEVEL%
