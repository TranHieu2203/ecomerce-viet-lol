@echo off
setlocal EnableExtensions
REM Build images ở máy local và push lên DockerHub.
REM Yêu cầu: Docker Desktop + đã `docker login` + Git (để lấy tag nếu không truyền).

cd /d "%~dp0"

where docker >nul 2>&1
if errorlevel 1 (
  echo [loi] Thieu docker.
  exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
  echo [loi] Docker chua chay.
  exit /b 1
)

set "ENV_FILE=deploy\.env.production"
if not exist "%ENV_FILE%" (
  echo [loi] Thieu %ENV_FILE% - tao tu deploy\.env.production.example
  exit /b 1
)

set "TAG=%~1"
if "%TAG%"=="" (
  where git >nul 2>&1
  if errorlevel 1 (
    echo [loi] Thieu git. Truyen TAG thu cong: %~nx0 ^<tag^>
    exit /b 1
  )
  for /f %%i in ('git rev-parse --short HEAD') do set "TAG=%%i"
)

set "DOCKERHUB_NAMESPACE="
for /f "usebackq eol=# tokens=1,* delims==" %%a in ("%ENV_FILE%") do (
  if /i "%%a"=="DOCKERHUB_NAMESPACE" set "DOCKERHUB_NAMESPACE=%%b"
)
if "%DOCKERHUB_NAMESPACE%"=="" set "DOCKERHUB_NAMESPACE=hieutech2203"
REM NOTE: Docker image name requires lowercase; nếu sai Docker sẽ báo lỗi ngay ở bước build.

set "BACKEND_IMAGE=%DOCKERHUB_NAMESPACE%/ecomerce-viet-lol-backend:%TAG%"
set "STOREFRONT_IMAGE=%DOCKERHUB_NAMESPACE%/ecomerce-viet-lol-storefront:%TAG%"
set "BACKEND_IMAGE_PROD=%DOCKERHUB_NAMESPACE%/ecomerce-viet-lol-backend:prod"
set "STOREFRONT_IMAGE_PROD=%DOCKERHUB_NAMESPACE%/ecomerce-viet-lol-storefront:prod"

echo.
echo [1/3] Build + push backend: %BACKEND_IMAGE%
docker build --progress=plain -f deploy\Dockerfile.backend -t "%BACKEND_IMAGE%" .
if errorlevel 1 exit /b 1
docker tag "%BACKEND_IMAGE%" "%BACKEND_IMAGE_PROD%"
if errorlevel 1 exit /b 1
docker push "%BACKEND_IMAGE%"
if errorlevel 1 exit /b 1
docker push "%BACKEND_IMAGE_PROD%"
if errorlevel 1 exit /b 1

echo.
echo [2/3] Doc env storefront build args tu %ENV_FILE%
set "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY="
set "MEDUSA_BACKEND_URL="
set "REVALIDATE_SECRET="
set "NEXT_PUBLIC_DEFAULT_REGION=vn"
for /f "usebackq eol=# tokens=1,* delims==" %%a in ("%ENV_FILE%") do (
  if /i "%%a"=="NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY" set "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=%%b"
  if /i "%%a"=="MEDUSA_BACKEND_URL" set "MEDUSA_BACKEND_URL=%%b"
  if /i "%%a"=="REVALIDATE_SECRET" set "REVALIDATE_SECRET=%%b"
  if /i "%%a"=="NEXT_PUBLIC_DEFAULT_REGION" set "NEXT_PUBLIC_DEFAULT_REGION=%%b"
)

if "%NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY%"=="" (
  echo [loi] Thieu NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY trong %ENV_FILE%
  exit /b 1
)
if "%MEDUSA_BACKEND_URL%"=="" (
  echo [loi] Thieu MEDUSA_BACKEND_URL trong %ENV_FILE%
  exit /b 1
)
if "%REVALIDATE_SECRET%"=="" (
  echo [loi] Thieu REVALIDATE_SECRET trong %ENV_FILE%
  exit /b 1
)

echo.
echo [3/3] Build + push storefront: %STOREFRONT_IMAGE%
docker build --progress=plain -f deploy\Dockerfile.storefront ^
  --build-arg NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY="%NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY%" ^
  --build-arg MEDUSA_BACKEND_URL="%MEDUSA_BACKEND_URL%" ^
  --build-arg REVALIDATE_SECRET="%REVALIDATE_SECRET%" ^
  --build-arg NEXT_PUBLIC_DEFAULT_REGION="%NEXT_PUBLIC_DEFAULT_REGION%" ^
  -t "%STOREFRONT_IMAGE%" .
if errorlevel 1 exit /b 1
docker tag "%STOREFRONT_IMAGE%" "%STOREFRONT_IMAGE_PROD%"
if errorlevel 1 exit /b 1
docker push "%STOREFRONT_IMAGE%"
if errorlevel 1 exit /b 1
docker push "%STOREFRONT_IMAGE_PROD%"
if errorlevel 1 exit /b 1

echo.
echo Xong. Cap nhat tren VPS:
echo   BACKEND_IMAGE=%BACKEND_IMAGE%
echo   STOREFRONT_IMAGE=%STOREFRONT_IMAGE%
echo   (hoac dung tag prod:)
echo   BACKEND_IMAGE=%BACKEND_IMAGE_PROD%
echo   STOREFRONT_IMAGE=%STOREFRONT_IMAGE_PROD%
echo (set 2 bien tren vao deploy/.env.production tren VPS, roi chay deploy/deploy-on-server.sh update)

endlocal
