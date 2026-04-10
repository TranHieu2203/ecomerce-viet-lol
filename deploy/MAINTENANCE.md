# Hướng dẫn Maintain Production

> Server: `103.124.94.227` | Branch deploy: `prod`  
> Domains: `quatangtaya.com` (storefront) · `admin.quatangtaya.com` (backend + admin UI)

---

## Kiến trúc tổng quan

```
Internet
  │
  ▼
Nginx Proxy Manager (:80/:443)
  ├── quatangtaya.com         → storefront:8000   (Next.js 15 SSR)
  └── admin.quatangtaya.com   → medusa-backend-1:9000  (Medusa v2 API + Admin UI)

Docker network (app)
  ├── postgres:5432           (persistent volume: postgres_data)
  ├── redis:6379              (persistent volume: redis_data)
  ├── medusa-backend-1:9000   (persistent volume: medusa_uploads → /app/apps/backend/static)
  │                           (bind mount: /root/ecomerce-viet-lol/docs → /app/docs  [read-only])
  ├── storefront:8000
  └── nginx-proxy-manager:80/443/81
```

File env: `deploy/.env.production.local` (KHÔNG commit, chỉ tồn tại trên server).

---

## Lần đầu deploy (Init)

```bash
# 1. Clone repo lên server
ssh root@103.124.94.227
git clone -b prod https://github.com/TranHieu2203/ecomerce-viet-lol.git /root/ecomerce-viet-lol
cd /root/ecomerce-viet-lol

# 2. Tạo file env (copy từ template rồi điền secrets)
cp deploy/.env.production deploy/.env.production.local
# Sửa các giá trị: JWT_SECRET, COOKIE_SECRET, REVALIDATE_SECRET, MEDUSA_BACKEND_PUBLIC_URL, domain CORS, v.v.
nano deploy/.env.production.local

# 3. Chạy init (wipe + build + migrate + seed cơ bản)
SKIP_WIPE_CONFIRM=1 bash deploy/oneclick-prod.sh init

# 4. Upload ảnh sản phẩm từ máy local (chạy trên máy local, không phải server)
node deploy/sftp-upload-docs.cjs

# 5. Restart medusa để mount docs/ volume
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production.local \
  up -d --force-recreate medusa-backend-1

# 6. Seed catalog sản phẩm từ Sales Kit
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production.local \
  exec -T -e SEED_SALES_KIT_ALLOW=1 medusa-backend-1 \
  sh -lc 'cd /app/apps/backend && SEED_SALES_KIT_ALLOW=1 npm run seed:sales-kit:confirm'

# 7. Cấu hình Nginx Proxy Manager (lần đầu: đăng nhập http://SERVER_IP:81)
#    - Đổi email/pass admin
#    - Tạo 2 proxy hosts + SSL cert (xem phần NPM bên dưới)
```

> **Lưu ý RAM**: Server 4GB cần swap khi build. Script `oneclick-prod.sh` tự tạo swap nếu chưa có.

---

## Cập nhật code (Update)

```bash
# Trên máy local: push code lên branch prod
git push origin prod

# Trên server (hoặc qua ssh-deploy.cjs):
node deploy/ssh-deploy.cjs exec "cd /root/ecomerce-viet-lol && git pull && bash deploy/oneclick-prod.sh update"
```

Mode `update` chỉ: build lại images → restart containers → chạy db:migrate.  
**Không** wipe data, **không** chạy seed.

---

## Seed commands

| Script | Khi nào chạy | Ghi chú |
|--------|-------------|---------|
| `npm run seed` | Lần đầu init | Tạo region VND/USD, shipping zones, publishable key, admin user |
| `npm run seed:ensure-shipping` | Sau `seed` | Đảm bảo liên kết kho ↔ fulfillment provider |
| `npm run seed:sales-kit:confirm` | Lần đầu hoặc khi muốn reset catalog | **Xóa toàn bộ** products/collections rồi seed lại từ `docs/` |

### Cách chạy seed thủ công

```bash
DC='docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production.local'

# Seed cơ bản
$DC exec -T \
  -e MEDUSA_BACKEND_PUBLIC_URL=https://admin.quatangtaya.com \
  medusa-backend-1 sh -lc 'cd /app/apps/backend && npm run seed'

# Seed Sales Kit (reset catalog)
$DC exec -T \
  -e SEED_SALES_KIT_ALLOW=1 \
  -e MEDUSA_BACKEND_PUBLIC_URL=https://admin.quatangtaya.com \
  medusa-backend-1 sh -lc 'cd /app/apps/backend && SEED_SALES_KIT_ALLOW=1 npm run seed:sales-kit:confirm'
```

> ⚠️ **Quan trọng**: Luôn truyền `-e MEDUSA_BACKEND_PUBLIC_URL=https://admin.quatangtaya.com` khi chạy seed.  
> Nếu thiếu, ảnh sẽ lưu URL `localhost:9000` thay vì domain thật → không load được trên browser.

---

## Nginx Proxy Manager (NPM)

**Admin UI**: `http://103.124.94.227:81`  
**Account**: `mphobao@gmail.com` / (pass đã đổi sau lần đầu)

### Proxy hosts đã cấu hình

| Domain | Forward đến | SSL |
|--------|------------|-----|
| `quatangtaya.com`, `www.quatangtaya.com` | `storefront:8000` | Let's Encrypt ✅ |
| `admin.quatangtaya.com` | `medusa-backend-1:9000` | Let's Encrypt ✅ |

### Gia hạn SSL

SSL Let's Encrypt tự động renew qua NPM (certbot cronjob trong container).  
Kiểm tra: NPM Admin UI → SSL Certificates → xem ngày hết hạn.

### Nếu mất cert hoặc cần tạo lại

```bash
# Lấy token NPM
TOKEN=$(curl -s -X POST http://localhost:81/api/tokens \
  -H 'Content-Type: application/json' \
  -d '{"identity":"mphobao@gmail.com","secret":"PASSWORD"}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin).get("token",""))')

# Tạo cert mới cho admin.quatangtaya.com
curl -s -X POST http://localhost:81/api/nginx/certificates \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"provider":"letsencrypt","domain_names":["admin.quatangtaya.com"],"meta":{}}'
```

> ⚠️ **Rate limit Let's Encrypt**: Tối đa 5 cert/tuần cho cùng 1 domain. Nếu hit rate limit, chờ 7 ngày hoặc dùng subdomain khác.

---

## Quản lý Docker

```bash
DC='docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production.local'

# Xem status containers
$DC ps

# Xem logs (real-time)
$DC logs -f medusa-backend-1
$DC logs -f storefront
$DC logs -f nginx-proxy-manager

# Xem log cuối
$DC logs --tail 50 medusa-backend-1

# Restart 1 service
$DC restart storefront

# Rebuild + restart 1 service (không rebuild image khác)
$DC build storefront && $DC up -d storefront

# Xóa Next.js cache (khi trang không cập nhật sau deploy)
$DC exec storefront sh -c 'rm -rf /app/apps/backend-storefront/.next/cache'
$DC restart storefront

# Dọn Docker build cache (sau khi build xong)
docker builder prune -f
```

---

## Fix URL ảnh bị localhost:9000

Nếu ảnh sản phẩm hiển thị URL `localhost:9000` (do seed thiếu env):

```bash
docker exec ecomerce-viet-lol-prod-postgres-1 psql -U medusa -d medusa -c "
UPDATE image
  SET url = REPLACE(url, 'http://localhost:9000', 'https://admin.quatangtaya.com')
  WHERE url LIKE '%localhost:9000%';
UPDATE product
  SET thumbnail = REPLACE(thumbnail, 'http://localhost:9000', 'https://admin.quatangtaya.com')
  WHERE thumbnail LIKE '%localhost:9000%';
UPDATE store_banner_slide
  SET image_urls = REPLACE(image_urls::text, 'http://localhost:9000', 'https://admin.quatangtaya.com')::jsonb
  WHERE image_urls::text LIKE '%localhost:9000%';
"

# Xóa cache storefront để áp dụng ngay
DC='docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production.local'
$DC exec storefront sh -c 'rm -rf /app/apps/backend-storefront/.next/cache'
$DC restart storefront
```

---

## Backup dữ liệu

```bash
# Backup database
docker exec ecomerce-viet-lol-prod-postgres-1 \
  pg_dump -U medusa medusa | gzip > /root/backup-$(date +%Y%m%d).sql.gz

# Backup uploads (ảnh do user upload qua admin)
docker run --rm \
  -v ecomerce-viet-lol-prod_medusa_uploads:/data \
  -v /root/backups:/backup \
  alpine tar czf /backup/uploads-$(date +%Y%m%d).tar.gz -C /data .

# Copy backup về máy local
node deploy/ssh-deploy.cjs exec "ls -lh /root/backup*.gz /root/backups/ 2>/dev/null"
```

---

## Restore database

```bash
# Restore từ file backup
gunzip -c /root/backup-20260410.sql.gz | \
  docker exec -i ecomerce-viet-lol-prod-postgres-1 psql -U medusa medusa
```

---

## Troubleshooting thường gặp

### Medusa không start

```bash
DC='docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production.local'
$DC logs medusa-backend-1 --tail 30
# Kiểm tra: kết nối DB, Redis, secrets có đủ không
$DC exec postgres psql -U medusa -c '\l'
```

### Storefront 500 / Bad Gateway

```bash
$DC logs storefront --tail 30
# Kiểm tra MEDUSA_BACKEND_URL = http://medusa-backend-1:9000 (KHÔNG phải HTTPS domain)
grep MEDUSA_BACKEND_URL deploy/.env.production.local
```

### Hết disk

```bash
df -h /
docker system df
docker builder prune -f          # Xóa build cache (~15GB sau mỗi lần build)
docker image prune -f            # Xóa dangling images
```

### Hết RAM khi build

```bash
# Kiểm tra swap
free -h
swapon --show

# Tạo swap nếu chưa có
fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
```

---

## Cấu trúc env `.env.production.local`

```env
# === DATABASE ===
POSTGRES_USER=medusa
POSTGRES_PASSWORD=<random hex>
POSTGRES_DB=medusa

# === SECRETS (generate: openssl rand -hex 32) ===
JWT_SECRET=<32-byte hex>
COOKIE_SECRET=<32-byte hex>
REVALIDATE_SECRET=<32-byte hex>

# === DOMAINS ===
STORE_CORS=https://quatangtaya.com,https://www.quatangtaya.com
ADMIN_CORS=https://admin.quatangtaya.com
AUTH_CORS=https://admin.quatangtaya.com,https://quatangtaya.com

# === BACKEND URLS ===
# Internal Docker network (storefront → backend SSR)
MEDUSA_BACKEND_URL=http://medusa-backend-1:9000

# Public HTTPS domain (file URLs stored in DB, browser requests)
MEDUSA_BACKEND_PUBLIC_URL=https://admin.quatangtaya.com
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://admin.quatangtaya.com

# === STOREFRONT ===
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...   # Tự động set sau seed
NEXT_PUBLIC_DEFAULT_REGION=vn
```

---

## ssh-deploy.cjs — Quick reference

```bash
# Chạy từ máy local (Windows/Mac/Linux), cần npm install ssh2

node deploy/ssh-deploy.cjs check          # Kiểm tra server, Docker, disk, RAM
node deploy/ssh-deploy.cjs status         # Containers, health, recent logs
node deploy/ssh-deploy.cjs logs medusa    # Logs medusa (hoặc storefront, nginx)
node deploy/ssh-deploy.cjs verify         # Test HTTP endpoints
node deploy/ssh-deploy.cjs exec "CMD"     # Chạy lệnh tuỳ ý trên server
node deploy/ssh-deploy.cjs update-code    # git pull trên server
node deploy/ssh-deploy.cjs run-update     # git pull + oneclick-prod.sh update
```

Upload ảnh sản phẩm lên server:
```bash
node deploy/sftp-upload-docs.cjs          # Upload toàn bộ docs/ (794MB ảnh Sales Kit)
```
