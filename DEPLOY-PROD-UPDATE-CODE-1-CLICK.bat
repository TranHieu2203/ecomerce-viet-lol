@echo off
REM Sau khi da chay lan dau: chi pull code + build image + migrate.
REM KHONG seed lai, KHONG xoa volume — DB + upload + du lieu NPM giu nguyen.

cd /d "%~dp0"
call "%~dp0deploy-vps.bat" update
if errorlevel 1 pause
exit /b %ERRORLEVEL%
