# ecomerce-viet-lol

Medusa 2 backend + Next.js starter storefront, Postgres & Redis qua Docker.

## Yêu cầu

- Node.js 20+
- Docker Desktop

## Chạy nhanh

1. Khởi động database:

   ```bash
   docker compose up -d
   ```

   Postgres: `localhost:5433` (tránh xung đột cổng 5432 trên Windows). Redis: `localhost:6379`.

2. Backend (Medusa): `http://localhost:9000` — Admin: `http://localhost:9000/app`

   ```bash
   npm run dev:backend
   ```

3. Storefront: `http://localhost:8000`

   ```bash
   npm run dev:storefront
   ```

## Tài khoản Admin (local)

Đã tạo trong quá trình bootstrap:

- Email: `admin@ecomerce-viet-lol.local`
- Mật khẩu: `ChangeMe123!`

Đổi mật khẩu sau lần đăng nhập đầu.

## Biến môi trường

- Backend: `apps/backend/.env` (không commit — đã có trong `.gitignore`).
- Storefront: `apps/backend-storefront/.env.local` — tạo từ mẫu `apps/backend-storefront/.env.example`; `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` lấy sau lệnh seed.

Mẫu gốc: `.env.example` (root) và `apps/backend-storefront/.env.example`.

### Mặc định VN / VND (FR-2b, SC-1b)

1. **Backend:** `npm run dev:backend` (hoặc seed) tạo/đảm bảo region **Vietnam** (`currency_code` **vnd**), quốc gia **`vn`**, `default_region_id` trên store và **vnd** là tiền tệ mặc định — xem `apps/backend/src/scripts/seed.ts`.
2. **Storefront:** copy `apps/backend-storefront/.env.example` → `.env.local`, điền `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` thật, giữ **`NEXT_PUBLIC_DEFAULT_REGION=vn`** (map country ISO-2 → region trong `apps/backend-storefront/src/lib/data/regions.ts`; khác với locale URL `vi`/`en`).
3. **Kiểm tra nhanh:** với backend đang chạy, gọi Store API (kèm header publishable key), ví dụ:  
   `curl -s -H "x-publishable-api-key: <KEY>" http://localhost:9000/store/regions`  
   — kỳ vọng có region gắn country `vn` và giá catalog hiển thị VND trên `/vi` khi có sản phẩm.

## Ngôn ngữ storefront (i18n)

Dự án **chỉ hỗ trợ hai mã ngôn ngữ**: **`vi`** (Tiếng Việt) và **`en`** (English).

- **URL:** prefix bắt buộc — `/{vi|en}/...` (ví dụ `/vi`, `/en/collections/...`). Truy cập `/` được redirect về `/vi` (mặc định).
- **Giá / region Medusa:** không gắn với mã locale URL; storefront dùng `NEXT_PUBLIC_DEFAULT_REGION` (**mặc định `vn`**) để chọn region theo quốc gia, tiền tệ seed **VND**; `vi`/`en` chỉ cho nội dung và metadata `metadata.i18n`.
- **CMS (`store_cms`):** `enabled_locales` và `default_locale` trong Admin chỉ nên dùng tổ hợp trong phạm vi **`vi` + `en`** (mặc định: `default_locale=vi`, `enabled_locales=["vi","en"]`).
- **API public:** `GET /store/custom/banner-slides?locale=vi|en`, `GET /store/custom/cms-settings`, `GET /store/custom/locales` (trả đúng hai mã trên khi cấu hình chuẩn).

Chi tiết kỹ thuật: `apps/backend-storefront/src/lib/util/locales.ts` (`SUPPORTED_LOCALES`), middleware `apps/backend-storefront/src/middleware.ts`.

## Phiên bản

- Medusa packages: **2.13.1** (`apps/backend/package.json`).
