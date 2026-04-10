# Nginx Proxy Manager — trỏ domain (SSL) cho Production

Áp dụng sau khi `docker compose -f deploy/docker-compose.prod.yml ... up -d`. **Giao diện quản trị** là container **`nginx-proxy-manager`** (image Nginx Proxy Manager): mở `http://<IP-VPS>:81` — lần đầu NPM thường yêu cầu tạo tài khoản admin (email + mật khẩu của bạn).

## DNS

Trỏ bản ghi **A** (hoặc AAAA nếu IPv6) về IP VPS:

| Host | Giá trị |
|------|---------|
| `@` hoặc `yourdomain.com` | IP VPS |
| `admin.yourdomain.com` | IP VPS |
| `www.yourdomain.com` (tuỳ chọn) | IP VPS |

### Ví dụ (repo mặc định)

| Host | Giá trị |
|------|---------|
| `quatangtaya.com` | IP VPS |
| `admin.quatangtaya.com` | IP VPS |
| `www.quatangtaya.com` | IP VPS |

## Đăng nhập NPM UI

- Mở `http://<IP-VPS>:81`
- Tạo tài khoản admin lần đầu (email + mật khẩu do bạn đặt)

## Proxy Host 1 — Storefront (Next.js)

- **Domain names:** `yourdomain.com` (và thêm `www.yourdomain.com` nếu dùng)
- **Scheme:** `http`
- **Forward hostname / IP:** `storefront` (tên service trong `deploy/docker-compose.prod.yml`)
- **Forward port:** `8000`
- **Block Common Exploits:** bật
- **Websockets Support:** bật (an toàn cho Next khi cần)

Tab **SSL:** Request Let’s Encrypt, đồng ý điều khoản, bật **Force SSL**.

## Proxy Host 2 — Medusa (API + Admin `/app`)

- **Domain names:** `admin.yourdomain.com`
- **Scheme:** `http`
- **Forward hostname / IP:** `medusa-backend-1` (Medusa backend)
- **Forward port:** `9000`
- **Websockets Support:** bật

Tab **SSL:** Let’s Encrypt + Force SSL.

## Ghi chú

- Trình duyệt và SDK gọi API qua `https://admin.yourdomain.com` — phải khớp `MEDUSA_BACKEND_URL` trong `deploy/.env.production`.
- Nếu đổi biến storefront (đặc biệt `NEXT_PUBLIC_*`), cần **build/push lại** image storefront ở local và `update` trên VPS (flow DockerHub).

### Env phải khớp domain (production)

Trong `deploy/.env.production` (ví dụ):

- `MEDUSA_BACKEND_URL=https://admin.yourdomain.com`
- `STORE_CORS=https://yourdomain.com,https://www.yourdomain.com`
- `ADMIN_CORS=https://admin.yourdomain.com`
- `AUTH_CORS=https://yourdomain.com,https://www.yourdomain.com,https://admin.yourdomain.com`

## Trên VPS: Git, clone, chạy production (tóm tắt)

```bash
# Lần đầu trên VPS Ubuntu: Git + Docker (một lệnh)
#   curl -fsSL https://raw.githubusercontent.com/TranHieu2203/ecomerce-viet-lol/prod/deploy/bootstrap-ubuntu-git-docker.sh | sudo bash
# Hoặc sau khi clone: sudo bash deploy/bootstrap-ubuntu-git-docker.sh

git clone https://github.com/TranHieu2203/ecomerce-viet-lol.git
cd ecomerce-viet-lol

# Sửa deploy/.env.production cho đúng domain + image DockerHub
nano deploy/.env.production

bash deploy/deploy-on-server.sh init
```

Tạo user admin lần đầu qua onboarding tại `https://admin.quatangtaya.com/app` (sau khi NPM đã có SSL).

## Deploy từ Windows (tùy chọn)

- Trên VPS: `deploy/deploy-on-server.sh` (`init` = seed + env đầy đủ; `update` = `pull` + `up --build` + migrate, giữ volume).
- Ở máy Windows: mở gốc repo `deploy-vps.bat`, sửa `SSH_HOST` / `REMOTE_DIR` nếu cần, rồi `deploy-vps.bat init` hoặc `deploy-vps.bat update`.
- **Lần đầu:** `deploy/.env.production` đã có trong repo (placeholder); trên VPS vẫn nên đổi mọi `CHANGE_ME_*` trước khi go live.
- **Tunnel DB/Redis về máy dev:** `ssh-data-tunnel.bat` (sửa `SSH_HOST`). Compose prod map Postgres/Redis chỉ `127.0.0.1` trên VPS; máy bạn dùng `localhost:15432` / `localhost:16379`.
- **Tunnel UI NPM:** `ssh-npm-ui-tunnel.bat` (sửa `SSH_HOST`) → `http://localhost:8881`.
