# Chạy Medusa backend (port 9000) và Next storefront (port 8000) trong hai cửa sổ riêng.
# Yêu cầu: Docker (Postgres/Redis) đã up nếu dùng DB local — chạy: docker compose up -d
# Cách dùng: .\dev-all.ps1   (từ thư mục gốc repo)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

if (-not $root) {
    $root = Get-Location
}

Set-Location $root

Write-Host "Mở cửa sổ: backend (dev) …" -ForegroundColor Cyan
Start-Process powershell -WorkingDirectory $root -ArgumentList @(
    "-NoExit",
    "-NoProfile",
    "-Command",
    "Set-Location `"$root`"; npm run dev:backend"
)

Start-Sleep -Milliseconds 500

Write-Host "Mở cửa sổ: storefront (dev) …" -ForegroundColor Cyan
Start-Process powershell -WorkingDirectory $root -ArgumentList @(
    "-NoExit",
    "-NoProfile",
    "-Command",
    "Set-Location `"$root`"; npm run dev:storefront"
)

Write-Host "Xong. Đóng cửa sổ tương ứng để dừng từng service." -ForegroundColor Green
