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

- `MEDUSA_BACKEND_URL=https://admin.quatangtaya.com`
- `STORE_CORS=https://quatangtaya.com,https://www.quatangtaya.com`
- `ADMIN_CORS=https://admin.quatangtaya.com`
- `AUTH_CORS=https://quatangtaya.com,https://www.quatangtaya.com,https://admin.quatangtaya.com`
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...` (có thể cập nhật sau seed lần đầu)

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

