## Mục tiêu

Triển khai `ecomerce-viet-lol` lên **production (Ubuntu)** bằng **Docker**:

- **Build trực tiếp trên server** (không cần DockerHub).
- **Tự init DB lần đầu**: migrate + seed (dữ liệu prod = seed chuẩn trong repo).
- Chạy sau **Nginx Proxy Manager** (reverse proxy + SSL).
- Chỉ dùng **2 file one-click**:
  - `deploy/oneclick-prod.sh` (server Ubuntu)
  - `deploy/oneclick-local.ps1` (Windows local)

---

## Domain / DNS

Đã chốt:

- `quatangtaya.com` → `103.124.94.227`
- `admin.quatangtaya.com` → `103.124.94.227`

---

## Production (Ubuntu) — 1 lần là chạy

### 1) SSH vào server

Trên máy bạn:

```bash
ssh root@103.124.94.227
```

### 2) Cài Docker (nếu chưa có)

Nếu server sạch, cài Docker Engine + compose plugin theo hướng dẫn chính thức.

### 3) Vào thư mục repo

Server đã có git/repo theo bạn nói. Ví dụ:

```bash
cd /opt/ecomerce-viet-lol
```

### 4) Cấu hình env production

Chạy init sẽ tự tạo `deploy/.env.production.local` từ template `deploy/.env.production`.

Bạn cần đảm bảo các biến sau đúng domain:

- `MEDUSA_BACKEND_URL=http://medusa-backend-1:9000` (SSR trong Docker → backend nội bộ, tránh 502)
- `NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://admin.quatangtaya.com` (trình duyệt + `next/image`)
- `STORE_CORS=https://quatangtaya.com,https://www.quatangtaya.com`
- `ADMIN_CORS=https://admin.quatangtaya.com`
- `AUTH_CORS=https://quatangtaya.com,https://www.quatangtaya.com,https://admin.quatangtaya.com`
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...` — **sau seed** phải ghi đúng key thật rồi **rebuild storefront** (`docker compose build --no-cache storefront` hoặc `bash deploy/oneclick-prod.sh update`), vì `NEXT_PUBLIC_*` được bake lúc build.

### 5) INIT (wipe toàn bộ docker + dựng lại)

Vì server dedicated, bạn yêu cầu **xoá toàn bộ images + volumes**.

```bash
bash deploy/oneclick-prod.sh init
```

Script sẽ bắt bạn gõ `WIPE` để xác nhận.

### 6) Cấu hình Nginx Proxy Manager

Mở:

- `http://103.124.94.227:81`

Tạo tài khoản admin trong NPM UI, sau đó tạo 2 Proxy Hosts:

**Proxy Host 1 — Storefront**
- **Domain**: `quatangtaya.com` (thêm `www.quatangtaya.com` nếu dùng)
- **Scheme**: `http`
- **Forward Hostname**: `storefront`
- **Forward Port**: `8000`
- **Websockets Support**: bật
- **Block Common Exploits**: bật
- Tab **SSL**: Request Let’s Encrypt + Force SSL

**Proxy Host 2 — Medusa (Admin/API)**
- **Domain**: `admin.quatangtaya.com`
- **Scheme**: `http`
- **Forward Hostname**: `medusa-backend-1`
- **Forward Port**: `9000`
- **Websockets Support**: bật
- Tab **SSL**: Request Let’s Encrypt + Force SSL

### 7) Kiểm tra

- Storefront: `https://quatangtaya.com`
- Admin: `https://admin.quatangtaya.com/app`

### Tài khoản Admin (sau seed / `oneclick-prod.sh init`)

Lệnh seed tạo user admin **nếu chưa có** user trùng email (idempotent).

| Biến | Mặc định |
|------|----------|
| `ADMIN_EMAIL` | `admin@ecomerce-viet-lol.local` |
| `ADMIN_PASSWORD` | `ChangeMe123!` |

Trên server có thể set trong `deploy/.env.production.local` **trước** lần `init`/seed đầu tiên. Nếu DB đã có user cùng email, seed **không** ghi đè mật khẩu.

Chạy lại chỉ bước admin (trong container backend):

```bash
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production.local exec -T medusa-backend-1 sh -lc "cd /app/apps/backend && npm run seed:ensure-admin-user"
```

### Sales Kit seed (`seed-sales-kit`)

Backend container mount `../docs:/app/docs:ro` — trên VPS cần **clone đủ** thư mục `docs/` ở gốc repo (có subfolder tên chứa `"Sales Kit"`). Image không COPY `docs/` để tránh image quá nặng.

Tuỳ chọn: set `SALES_KIT_DOCS_PATH` trong container nếu bạn mount nguồn Sales Kit ở path khác.

```bash
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production.local exec -T medusa-backend-1 sh -lc "cd /app/apps/backend && npm run seed:sales-kit:confirm"
```

---

## Production UPDATE (không wipe)

```bash
bash deploy/oneclick-prod.sh update
```

- Rebuild + restart + chạy `db:migrate`
- Không seed lại, không xoá volume

---

## Local (Windows) — 1 click

```powershell
powershell -ExecutionPolicy Bypass -File deploy\oneclick-local.ps1
```

Sau khi chạy:

- Storefront: `http://localhost:8000`
- Backend/Admin: `http://localhost:9000/app`

---

## Ghi chú quan trọng

- Lệnh `init` **xoá toàn bộ docker volumes** ⇒ DB production bị reset hoàn toàn.
- “Prod có toàn bộ data như dev” được hiểu là: **DB trắng + seed của repo** ⇒ dữ liệu giống môi trường dev mới dựng.

---

## Troubleshooting

### Lỗi compose: `required variable NEXT_PUBLIC_MEDUSA_BACKEND_URL is missing`

File `deploy/.env.production.local` trên server tạo trước khi có biến mới. Cách xử lý:

- Chạy `bash deploy/oneclick-prod.sh update` (script sẽ **append** các key thiếu từ `deploy/.env.production`), hoặc
- Tự thêm vào `.env.production.local` hai dòng như trong `deploy/.env.production`:

```bash
MEDUSA_BACKEND_URL=http://medusa-backend-1:9000
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://admin.quatangtaya.com
MEDUSA_BACKEND_PUBLIC_URL=https://admin.quatangtaya.com
```

### Ảnh trong Admin / DB trỏ `http://localhost:9000/static/...`

Medusa **file-local** mặc định `backend_url=http://localhost:9000/static` — URL đó được **ghi vào DB** lúc upload/seed. Trên prod phải set **`MEDUSA_BACKEND_PUBLIC_URL`** = domain HTTPS mà NPM trỏ vào backend (thường **cùng** `NEXT_PUBLIC_MEDUSA_BACKEND_URL`, không có `/static`). Đã cấu hình trong `apps/backend/medusa-config.ts` + truyền env qua compose.

Sau khi sửa env: **rebuild + restart backend**, rồi **seed/upload lại** (URL cũ trong DB không tự đổi), ví dụ chạy lại `npm run seed:sales-kit:confirm` nếu catalog từ Sales Kit.

### Storefront log: `Bad Gateway` (502) hoặc `publishable key`

- **502:** thường do storefront trong Docker gọi `https://admin...` ra ngoài rồi NPM/backend không phản hồi đúng. Dùng `MEDUSA_BACKEND_URL=http://medusa-backend-1:9000` + `NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://admin.quatangtaya.com` như template `deploy/.env.production`.
- **`A valid publishable key is required`:** cập nhật `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` trong `deploy/.env.production.local`, sau đó **rebuild** image storefront (biến `NEXT_PUBLIC_*` nằm trong bundle build).

### Backend restart loop — `Could not find index.html in the admin build directory`

Medusa 2 build admin vào `.medusa/server/public/admin`, nhưng `medusa start` chạy từ thư mục app thường tìm `public/admin`. Image Docker đã tạo symlink `public` → `.medusa/server/public`. Nếu vẫn lỗi sau khi pull mới, rebuild không cache:

```bash
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production.local build --no-cache medusa-backend-1
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production.local up -d medusa-backend-1
```

Khi container `medusa-backend-1` đang **Restarting**, không dùng `exec`; kiểm tra filesystem bằng container one-off:

```bash
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production.local run --rm --no-deps medusa-backend-1 sh -lc 'ls -la public/admin/index.html .medusa/server/public/admin/index.html'
```

