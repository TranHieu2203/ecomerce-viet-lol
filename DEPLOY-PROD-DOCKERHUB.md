# Deploy Production (DockerHub images, VPS chỉ pull)

Flow chuẩn:

- **Local/Windows**: build image → push DockerHub
- **VPS/Ubuntu**: pull image → chạy init/update (migrate/seed)

---

## Yêu cầu

### Local (máy dev)

- Docker Desktop (đang chạy)
- Đã đăng nhập DockerHub: `docker login`

### VPS (Ubuntu)

- Docker Engine + docker compose plugin + git
- Lần đầu có thể chạy:

```bash
sudo bash deploy/bootstrap-ubuntu-git-docker.sh
```

---

## SSH key (khuyến nghị) — để deploy 1-click từ Windows

### Gen SSH key trên Windows

Mở PowerShell, chạy:

```powershell
ssh-keygen -t ed25519 -C "deploy@ecomerce-viet-lol" -f "$env:USERPROFILE\.ssh\ecomerce_viet_lol_ed25519"
```

### Add public key lên VPS

In public key:

```powershell
type "$env:USERPROFILE\.ssh\ecomerce_viet_lol_ed25519.pub"
```

Trên VPS:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "<PASTE_PUBLIC_KEY_HERE>" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Test login:

```powershell
ssh -i "$env:USERPROFILE\.ssh\ecomerce_viet_lol_ed25519" root@<VPS_IP>
```

---

## Cấu hình production env

File dùng cho production là `deploy/.env.production`.

Các biến quan trọng:

- **DockerHub images**
  - `DOCKERHUB_NAMESPACE=hieutech2203`
  - `BACKEND_IMAGE=hieutech2203/ecomerce-viet-lol-backend:prod`
  - `STOREFRONT_IMAGE=hieutech2203/ecomerce-viet-lol-storefront:prod`
- **Database**
  - `POSTGRES_PASSWORD=...` (volume DB đã tạo rồi thì **không đổi** được nếu không reset volume)
- **Domain/CORS**
  - `STORE_CORS=...`
  - `ADMIN_CORS=...`
  - `AUTH_CORS=...`
  - `MEDUSA_BACKEND_URL=https://admin.<domain>`
- **Secrets**
  - `JWT_SECRET`, `COOKIE_SECRET`, `REVALIDATE_SECRET`
  - Lần đầu chạy `init`, script `deploy/deploy-on-server.sh` sẽ tự gen nếu còn `CHANGE_ME_*`.

---

## 1) Build + Push images lên DockerHub (Local)

Chạy tại root repo:

```bat
.\PROD-1CLICK-LOCAL-BUILD-PUSH-DOCKERHUB.bat
```

Lưu ý:

- File `.bat` chỉ chạy trên **Windows**.
- Trên Linux/VPS, bạn chỉ chạy `bash deploy/deploy-on-server.sh ...` (không chạy `.bat` bằng `bash`).

Script sẽ:

- build + push **backend** với 2 tag:
  - `:<gitsha>` (ví dụ `:088dc62`)
  - `:prod` (dùng cho VPS pull)
- build + push **storefront** với 2 tag tương tự

---

## 2) Deploy lần đầu (init) lên VPS

### Cách nhanh từ Windows (SSH 1-click)

```bat
.\PROD-1CLICK-DEPLOY-VPS-PULL-IMAGES.bat init
```

Nó sẽ SSH vào VPS và chạy:

- `bash deploy/deploy-on-server.sh init`

### Chạy trực tiếp trên VPS (Linux)

SSH vào VPS, vào thư mục repo rồi chạy:

```bash
# INIT (xoá sạch toàn bộ dữ liệu volumes + seed lại từ đầu)
bash deploy/prod-init.sh
```

`prod-init.sh` sẽ:

- `docker compose pull` + `down -v` (xoá sạch volumes: DB/redis/uploads/NPM data)
- `docker compose up -d`
- `db:migrate`
- `npm run seed` + `seed:ensure-shipping`
- đọc `pk_...` trong DB và ghi vào `deploy/.env.production`

---

## 3) Deploy lần sau (update) lên VPS

```bat
.\PROD-1CLICK-DEPLOY-VPS-PULL-IMAGES.bat update
```

### Chạy trực tiếp trên VPS (Linux)

```bash
bash deploy/prod-update.sh
```

`prod-update.sh` sẽ:

- `docker compose pull` + `up -d`
- `db:migrate`
- **không seed**, **không xoá volume**

---

## Checklist A→Z (làm 1 lần cho xong)

### A) Local (Windows) — build + push images

```bat
.\PROD-1CLICK-LOCAL-BUILD-PUSH-DOCKERHUB.bat
```

### B) VPS — lần đầu (xoá sạch data rồi seed lại)

```bash
cd ~/ecomerce-viet-lol
git pull --ff-only
cp deploy/.env.production.example deploy/.env.production
# sửa deploy/.env.production: POSTGRES_PASSWORD thật, JWT/COOKIE/REVALIDATE, CORS, domain...
bash deploy/prod-init.sh
```

### C) VPS — lần sau (giữ data, chỉ update + migrate)

```bash
cd ~/ecomerce-viet-lol
git pull --ff-only
bash deploy/prod-update.sh
```

---

## Quy trình “lần sau” (build bản mới + update VPS)

Mỗi lần bạn sửa code và muốn lên production:

### Bước 1 — build + push image mới (Local/Windows)

```bat
.\PROD-1CLICK-LOCAL-BUILD-PUSH-DOCKERHUB.bat
```

Script sẽ push **2 tag** cho mỗi image:

- `:prod` (VPS sẽ pull theo tag này)
- `:<gitsha>` (để trace/rollback, ví dụ `:088dc62`)

### Bước 2 — pull image mới + migrate (VPS)

- Chạy trực tiếp trên VPS:

```bash
bash deploy/prod-update.sh
```

- Hoặc chạy từ Windows (SSH 1-click):

```bat
.\PROD-1CLICK-DEPLOY-VPS-PULL-IMAGES.bat update
```

---

## Nginx Proxy Manager (SSL + domain)

Sau khi stack chạy, cấu hình proxy/SSL theo:

- `deploy/nginx-proxy-manager.md`

Giao diện NPM: `http://<IP-VPS>:81`.

Lưu ý: production compose hiện chạy **1 Medusa backend** (`medusa-backend-1`). Vì vậy Proxy Host `admin.*` sẽ forward tới `medusa-backend-1:9000` (không qua `medusa-lb`).

---

## Lưu ý quan trọng về `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`

Storefront build yêu cầu `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` (check ở `apps/backend-storefront/next.config.js`).

Vì `init` có thể tạo/ghi `pk_` mới vào `deploy/.env.production` trên VPS, nên **sau init** bạn nên:

- chạy lại `.\PROD-1CLICK-LOCAL-BUILD-PUSH-DOCKERHUB.bat` để build/push storefront (tag `:prod`) với `pk_` mới
- rồi chạy `update` để VPS pull storefront mới

---

## Troubleshooting nhanh

- **Push bị `denied/unauthorized`**: chạy lại `docker login` (đúng account) và kiểm tra repo trên DockerHub đã được tạo/quyền push.
- **Đổi `POSTGRES_PASSWORD` xong không vào DB**: do volume DB cũ vẫn dùng password cũ → giữ nguyên password, hoặc reset volume DB (mất dữ liệu).
- **Migrate bị `KnexTimeoutError` / `SELECT 1` timeout**:
  - Thường do `DATABASE_URL` bị sai (đặc biệt khi password có ký tự đặc biệt như `@`, `:`, `#`, `/`…).
  - Cách xử lý tốt nhất:
    - Đặt password chỉ gồm chữ/số/`_`/`-`, hoặc
    - Set `DATABASE_URL` với password **URL-encode** (ví dụ `@` → `%40`), và đảm bảo có `?ssl=false`.
- **Backend restart, log có `relation "xxx" does not exist` (thiếu bảng `tax_provider`, `payment_provider`, `currency`...)**:
  - Nguyên nhân: DB chưa được migrate (hoặc migrate không chạy do backend crash-loop).
  - Cách xử lý:

```bash
# chạy migrate kiểu one-off container (không phụ thuộc backend đang Up)
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production run --rm --no-deps medusa-backend-1 npx medusa db:migrate

# sau đó restart backend
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production up -d medusa-backend-1
```
- **Migrate fail với `The server does not support SSL connections`**:
  - Nguyên nhân: client đang cố connect Postgres bằng SSL, nhưng Postgres container nội bộ không bật SSL.
  - Cách xử lý: đảm bảo **không** set `?ssl=false` trong `DATABASE_URL` (một số parser coi `"false"` là truthy), và ép `PGSSLMODE=disable` trong compose, sau đó chạy lại migrate.
- **Backend restart với lỗi `Cannot find module '/app/apps/backend/medusa-config'`**:
  - Image thiếu file config runtime. Repo đã có `apps/backend/medusa-config.js` để chạy production; hãy build/push lại image `:prod` rồi `update` trên VPS.
- **Storefront restart với lỗi `Cannot find module 'ansi-colors'`**:
  - Do `ansi-colors` bị prune (devDependencies). Repo đã chuyển `ansi-colors` sang `dependencies`; hãy build/push lại image `:prod` rồi `update` trên VPS.
