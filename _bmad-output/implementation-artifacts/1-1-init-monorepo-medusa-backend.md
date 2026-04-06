# Story 1.1: Khởi tạo monorepo và Medusa backend

**Story Key:** `1-1-init-monorepo-medusa-backend`  
**Epic:** 1 — Nền tảng & tích hợp  
**Status:** review

> Ghi chú: Validation tùy chọn (`bmad-create-story:validate`) trước khi `bmad-dev-story`.

---

## Story

Là **kỹ sư**,  
tôi muốn **khởi tạo monorepo với app Medusa 2.x kết nối PostgreSQL + Redis local**,  
để **API Admin/Store chạy local, truy cập được Admin UI, và sẵn sàng mở rộng module CMS/i18n**.

---

## Acceptance Criteria

1. **Given** Node.js **v20+** (LTS), Git, Docker đã cài; **When** chạy `docker compose up -d` ở root repo (đã có sẵn) và khởi tạo Medusa theo hướng dẫn dưới; **Then** server Medusa lắng nghe **`http://localhost:9000`** và Admin mở được **`http://localhost:9000/app`**.
2. **Given** DB/Redis từ Docker; **When** cấu hình `.env` backend; **Then** ứng dụng kết nối DB **không lỗi** và `npm run dev` / `pnpm dev` chạy ổn định.
3. **Given** repo greenfield; **When** hoàn tất story; **Then** tồn tại **`apps/backend`** (Medusa) và **root** có **`package.json` workspaces** (hoặc tài liệu rõ cấu trúc monorepo) khớp ADR-01 trong `architecture.md`.
4. **Given** nhu cầu CI/dev; **When** đọc root; **Then** có **`.env.example`** (hoặc cập nhật file hiện có) liệt kê tối thiểu: `DATABASE_URL`, `REDIS_URL`, `ADMIN_CORS`, `STORE_CORS`, `JWT_SECRET`, `COOKIE_SECRET` (placeholder an toàn — không ghi secret thật mẫu ngẫu nhiên trong git).
5. **Given** developer mới; **When** làm theo `Dev Notes`; **Then** có thể tái lập bước cài đặt trong **≤ 15 phút** (ước lượng) nếu Docker + Node sẵn.

---

## Tasks / Subtasks

- [x] **Chạy infrastructure** (AC: #1–2)  
  - [x] `docker compose up -d` tại root; xác nhận Postgres + Redis **healthy**.  
- [x] **Tạo Medusa trong monorepo** (AC: #1, #3)  
  - [x] Tạo thư mục `apps` nếu chưa có.  
  - [x] Chạy `create-medusa-app@latest` với `--directory-path apps`, `--with-nextjs-starter`, `--db-url` Docker (cổng **5433** do xung đột 5432 trên Windows).  
  - [x] Storefront tại `apps/backend-storefront` (tên mặc định từ CLI).  
- [x] **Cấu hình môi trường** (AC: #2, #4)  
  - [x] `apps/backend/.env`: `DATABASE_URL` / `REDIS_URL`; thêm `redisUrl` trong `medusa-config.ts`.  
  - [x] `apps/backend-storefront/.env.local`: `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` từ DB sau seed.  
- [x] **Root & script** (AC: #3)  
  - [x] `package.json` root với `dev:backend` / `dev:storefront` (`--prefix`).  
  - [x] `apps/backend/package.json`: script `medusa` qua `node .../cli.js` (Windows không có `.bin/medusa`).  
  - [x] Phụ thuộc `date-fns` (thiếu làm Vite Admin lỗi).  
- [x] **Tài liệu** (AC: #5)  
  - [x] `README.md` root.  
- [x] **Xác nhận**  
  - [x] `medusa db:migrate`, seed demo, user admin CLI.  
  - [x] HTTP 200: `http://localhost:9000/health`, `http://localhost:8000`.

---

## Dev Notes

### Bối cảnh dự án

- Repo đã có **`docker-compose.yml`** (Postgres `medusa/medusa/medusa`, Redis `6379`). [Source: `docker-compose.yml`]  
- `.env.example` root đã có mẫu `DATABASE_URL` / `REDIS_URL`. Cần **đồng bộ** với backend Medusa. [Source: `.env.example`]

### Ràng buộc kiến trúc (bắt buộc tuân thủ)

- **ADR-01:** Hai app trong monorepo — story này tạo **`apps/backend`**; storefront sẽ là `apps/storefront` sau. [Source: `planning-artifacts/architecture.md` §3]  
- **Medusa 2.x:** module trong `src/modules`, API custom trong `src/api`, workflow trong `src/workflows`. [Source: https://docs.medusajs.com/learn/installation — Project Files]  
- Sau story này, các epic **E2+** sẽ thêm migration `store_banner_slide`, API custom — **giữ** cấu trúc `src/` chuẩn Medusa.

### Lệnh gợi ý (ưu tiên pnpm; thay bằng npm nếu team dùng npm)

```bash
# 1) Infrastructure (từ root repo)
docker compose up -d

# 2) Medusa vào apps/backend — kết nối DB Docker có sẵn
#    (tạo thư mục cha apps nếu CLI yêu cầu)
# CMD (dòng tiếp nối bằng ^)
npx create-medusa-app@latest backend --directory-path apps --db-url "postgres://medusa:medusa@localhost:5432/medusa" --no-browser

# Hoặc PowerShell: một dòng như trên, hoặc dùng backtick ` ở cuối dòng để xuống dòng.
```

- Nếu CLI hỏi có cài Next.js starter: **No** (để story 1.2/storefront riêng theo kiến trúc).  
- Sau cài: vào `apps/backend`, thêm **`REDIS_URL`** vào `.env` nếu chưa có: `redis://localhost:6379`.  
- Chạy migrate/seed theo output CLI; sau đó:

```bash
cd apps/backend
pnpm install   # hoặc npm install
pnpm run dev   # hoặc npm run dev
```

### Kiểm tra phiên bản & tài liệu chính thức

- **Node:** v20+ LTS. [Source: https://docs.medusajs.com/learn/installation]  
- **Tạo project:** `create-medusa-app@latest`; tùy chọn `--version X.Y.Z` để ghim Medusa (ghi **semver đã chọn** vào README/backend `package.json` sau khi tạo). [Source: https://docs.medusajs.com/resources/create-medusa-app]  
- **Chạy dev:** `npm run dev` — server `9000`, Admin `9000/app`. [Source: https://docs.medusajs.com/learn/installation]

### CORS

- Khi storefront chưa có: đặt `STORE_CORS`/`ADMIN_CORS` trỏ tới URL tạm (localhost) để tránh lỗi khi mở Admin; cập nhật lại ở story 1.2/6.x. [Source: kiến trúc + troubleshooting Medusa CORS]

### Testing

- **Thủ công:** mở `http://localhost:9000/app`, đăng nhập; gọi `GET http://localhost:9000/health` nếu endpoint health có trong bản cài (hoặc endpoint store tối thiểu từ docs).  
- **Không bắt buộc** unit test trong story 1.1.

### Project Structure Notes

Mục tiêu sau story:

```text
ecomerce-viet-lol/
  docker-compose.yml
  package.json              # workspaces (mới)
  .env.example              # cập nhật đủ biến backend
  apps/
    backend/                # Medusa (create-medusa-app)
      medusa-config.ts
      src/
      .env                  # local, không commit
```

### References

- [architecture.md — ADR-01, container, Postgres](../planning-artifacts/architecture.md)  
- [epics.md — Epic 1, Story 1.1](../planning-artifacts/epics.md)  
- [implementation-readiness-report](../planning-artifacts/implementation-readiness-report-2026-03-30.md) — Docker: nên bổ sung vào architecture sau story.  
- [Medusa — Installation](https://docs.medusajs.com/learn/installation)  
- [Medusa — create-medusa-app](https://docs.medusajs.com/resources/create-medusa-app)

---

## Mở issue / Câu hỏi còn lại (sau khi implement)

- CLI `create-medusa-app` có đổi tên thư mục hoặc vị trí `apps/backend` — điều chỉnh workspaces cho khớp.  
- Nếu Redis không bắt buộc trên bản Medusa đã cài, xác minh trong `medusa-config.ts`; vẫn nên giữ Redis Docker cho đồng bộ epic sau (queue/workflow).

---

## Dev Agent Record

### Agent Model Used

Cursor Agent

### Debug Log References

- Postgres host: đổi map `5433:5432` vì Windows đã có service chiếm 5432 → `create-medusa-app` báo sai mật khẩu khi dùng 5432.  
- `npm run dev` thất bại: không có `node_modules/.bin` → đổi script sang `node ./node_modules/@medusajs/cli/cli.js`.  
- Admin Vite: thiếu `date-fns` → thêm dependency và `npm install`.

### Completion Notes List

- Backend Medusa **2.13.1**, migrate + seed demo + publishable key cho storefront.  
- Cần chạy `docker compose up -d` rồi `npm run dev:backend` và `npm run dev:storefront` (hoặc trong từng `apps/*`).

### File List

- `docker-compose.yml`
- `.env.example`
- `package.json` (root)
- `.gitignore` (root)
- `README.md`
- `apps/backend/**` (scaffold Medusa + chỉnh `package.json`, `medusa-config.ts`)
- `apps/backend-storefront/**` (Next starter + `.env.local`)

## Change Log

- 2026-03-30: Bootstrap Medusa + Next storefront; Docker Postgres cổng 5433; sửa script CLI Windows; thêm Redis vào config.
