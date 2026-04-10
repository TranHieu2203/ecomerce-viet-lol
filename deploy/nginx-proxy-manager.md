# Nginx Proxy Manager — quatangtaya.com

Áp dụng sau khi `docker compose -f deploy/docker-compose.prod.yml ... up -d`. **Giao diện quản trị** là container **`nginx-proxy-manager`** (image Nginx Proxy Manager): mở `http://<IP-VPS>:81` — lần đầu NPM thường yêu cầu tạo tài khoản admin (email + mật khẩu của bạn).

## DNS

Trỏ bản ghi **A** (hoặc AAAA nếu IPv6) về IP VPS:

| Host | Giá trị |
|------|---------|
| `@` hoặc `quatangtaya.com` | IP VPS |
| `admin` | IP VPS |
| `www` (tuỳ chọn storefront) | IP VPS |

## Proxy Host 1 — storefront

- **Domain names:** `quatangtaya.com` (và thêm `www.quatangtaya.com` nếu dùng)
- **Scheme:** `http`
- **Forward hostname / IP:** `storefront`
- **Forward port:** `8000`
- **Block Common Exploits:** bật
- **Websockets Support:** bật (an toàn cho Next khi cần)

Tab **SSL:** Request Let’s Encrypt, đồng ý điều khoản, bật **Force SSL**.

## Proxy Host 2 — Medusa (API + Admin `/app`)

- **Domain names:** `admin.quatangtaya.com`
- **Scheme:** `http`
- **Forward hostname / IP:** `medusa-lb`
- **Forward port:** `9000`
- **Websockets Support:** bật

Tab **SSL:** Let’s Encrypt + Force SSL.

## Ghi chú

- Trình duyệt và SDK gọi API qua `https://admin.quatangtaya.com` — trùng với `MEDUSA_BACKEND_URL` trong `deploy/.env.production`.
- Sau khi đổi biến storefront (đặc biệt `NEXT_PUBLIC_*`), cần **build lại** image storefront: `docker compose ... build --no-cache storefront` rồi `up -d`.

## Trên VPS: Git, clone, chạy production (tóm tắt)

```bash
# Cài Docker Engine + plugin compose (tài liệu chính thức Docker). Git: apt install git -y

git clone https://github.com/TranHieu2203/ecomerce-viet-lol.git
cd ecomerce-viet-lol
# deploy/.env.production đã có trong repo (domain quatangtaya.com) — trên server: nano deploy/.env.production và đổi mọi CHANGE_ME_*

docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production up -d --build
```

Lần đầu sau khi backend lên (xem log `docker compose ... logs -f medusa-backend-1`), chạy migration nếu cần (Medusa 2):

```bash
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production exec medusa-backend-1 \
  npx medusa db:migrate
```

Tạo user admin / publishable key trong Admin tại `https://admin.quatangtaya.com/app` (sau khi NPM đã có SSL).

## Deploy từ Windows (tùy chọn)

- Trên VPS có script `deploy/deploy-on-server.sh` (`init` = lần đầu: `up` + `db:migrate`; `update` = `pull` + `up` + `db:migrate`).
- Ở máy Windows: sao chép `deploy-vps.example.bat` → `deploy-vps.bat` (file này trong `.gitignore`), điền `SSH_HOST` / `REMOTE_DIR`, rồi `deploy-vps.bat init` hoặc `deploy-vps.bat update`.
- **Lần đầu:** `deploy/.env.production` đã có trong repo (placeholder); trên VPS vẫn nên đổi mọi `CHANGE_ME_*` trước khi go live.
