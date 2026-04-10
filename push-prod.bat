@echo off
setlocal EnableExtensions
REM Day lenh nhanh prod + LFS. Chay trong thu muc goc repo.
REM Can: Git for Windows + Git LFS, da dang nhap GitHub (PAT hoac Credential Manager).

cd /d "%~dp0"

where git >nul 2>&1 || (echo Cai Git for Windows. & exit /b 1)
where git-lfs >nul 2>&1 || (echo Cai Git LFS: https://git-lfs.github.com & exit /b 1)

git lfs install
git config lfs.https://github.com/TranHieu2203/ecomerce-viet-lol.git/info/lfs.locksverify false
git checkout prod
git pull origin prod 2>nul

echo.
echo [1/2] Upload LFS (video mp4/mov) ...
git lfs push origin prod --all
if errorlevel 1 (
  echo LFS push loi — kiem tra mang, dung luong LFS GitHub, hoac dang nhap.
  exit /b 1
)

echo.
echo [2/2] Push nhanh prod ...
git push -u origin prod
if errorlevel 1 (
  echo Git push loi — xem thong bao phia tren (auth, mang, hook).
  exit /b 1
)

echo.
echo Xong: origin/prod da cap nhat.
endlocal
