---
project_name: ecomerce-viet-lol
user_name: HieuTV-Team-MedusaV2
date: '2026-04-06'
sections_completed:
  - technology_stack
  - language_rules
  - framework_rules
  - testing_rules
  - quality_rules
  - workflow_rules
  - anti_patterns
status: complete
rule_count: 32
optimized_for_llm: true
---

# Project Context cho AI Agents

_File này gom các quy tắc và pattern quan trọng mà agent phải tuân thủ khi sửa/triển khai code. Ưu tiên chi tiết “dễ làm sai”, không lặp lại kiến thức phổ biến._

---

## Technology Stack & Versions

| Thành phần | Ghi chú |
|------------|---------|
| **Monorepo** | Root chỉ orchestrate script; app chính: `apps/backend` (Medusa), `apps/backend-storefront` (Next.js). |
| **Medusa** | `@medusajs/*` **2.13.1** (khớp nhau: framework, medusa, admin-sdk, cli, test-utils). **Node >= 20**. |
| **Next.js storefront** | **15.3.9**; React **19.0.4** (có `overrides` trong package.json). Dev: `next dev --turbopack -p 8000`. |
| **TypeScript** | Backend ~**5.6.2**; Storefront ~**5.3.2**. |
| **Ảnh** | `sharp` ^0.33.5 (derivative banner). |
| **DB** | PostgreSQL (xem `.env.example`: cổng **5433** trong docker-compose để tránh xung đột Windows). |

Chi tiết kiến trúc/ADR: `_bmad-output/planning-artifacts/architecture.md`.

---

## Critical Implementation Rules

### Language-Specific Rules

- Backend bật **`strictNullChecks`** nhưng **không** bật full `strict` toàn bộ — đừng giả định mọi strict flag giống storefront.
- Backend: **`module`/`moduleResolution`: Node16** — import ESM/CJS và extension `.js` output cần tuân convention Medusa build.
- Storefront: **`strict: true`**, alias `@lib/*`, `@modules/*`, `@pages/*` từ `tsconfig` (`baseUrl: ./src`).
- Ưu tiên **async/await** cho I/O; với Medusa dùng type `MedusaRequest` / `MedusaResponse` từ `@medusajs/framework/http` trên route handlers.

### Framework-Specific Rules

**Medusa backend**

- Module custom CMS: **`./src/modules/store-cms`**, constant **`STORE_CMS_MODULE = "store_cms"`** — resolve service bằng `req.scope.resolve(STORE_CMS_MODULE)`.
- Đăng ký module trong **`medusa-config.ts`** (`modules: [{ resolve: "./src/modules/store-cms" }]`).
- API file-based: **`src/api/.../route.ts`**, export `GET`/`POST`/… và có thể export **`AUTHENTICATE = false`** cho route store public.
- Store routes CMS mẫu: `src/api/store/custom/cms-settings`, `banner-slides`, `locales`; Admin: `src/api/admin/custom/...`.
- Migration MikroORM theo chuẩn Medusa — đặt trong module (ví dụ `modules/store-cms/migrations/`).

**Next.js storefront**

- App Router dưới **`src/app`**. Segment động tên **`[countryCode]`** nhưng **semantic = locale** (`vi` | `en`) — middleware và `@lib/util/locales` gắn với i18n; **không đổi tên folder** nếu không đồng bộ toàn bộ import/middleware.
- **Locale storefront:** tối đa `vi`, `en`, `ja` trong code; Admin **bật/tắt** qua `enabled_locales` (FR-17). Luôn bật `vi`. Fallback nội dung i18n theo locale đang xem → `vi` → `en`/`ja` khi thiếu.
- ISR / revalidate: backend gọi storefront qua biến **`STOREFRONT_REVALIDATE_URL`** + **`REVALIDATE_SECRET`** (mô tả trong `.env.example`).

### Testing Rules

- Jest + **@swc/jest**, `testEnvironment: "node"`.
- Chọn suite bằng **`TEST_TYPE`**: `integration:http` → `integration-tests/http/*.spec.*`; `integration:modules` → `src/modules/*/__tests__/**`; `unit` → `**/*.unit.spec.*` hoặc `**/*.test.*`.
- Script: `npm run test:unit` / `test:integration:http` / `test:integration:modules` **từ `apps/backend`**.
- Thêm test module nên đặt cạnh module trong `__tests__` để khớp `testMatch`.

### Code Quality & Style Rules

- Giữ **một phong cách** với file lân cận: quote, import order — backend thiên ES module + Medusa patterns; storefront theo ESLint Next.
- **Đặt tên file route** Medusa đúng convention (`route.ts`); đường dẫn URL = cấu trúc thư mục dưới `src/api`.
- Dữ liệu đa ngôn ngữ CMS/banner: JSON có key **`vi` / `en` / `ja`** (khóa trong catalog); catalog mở rộng: **`metadata.i18n`** như `architecture.md`.

### Development Workflow Rules

- Env mẫu tại **repo root `.env.example`**: copy tương ứng sang `apps/backend/.env` và `apps/backend-storefront/.env.local`.
- Chạy dev: root `npm run dev:backend` / `npm run dev:storefront` (hoặc tương đương trong `package.json` root).
- Docker: `npm run docker:up` từ root nếu cần Postgres/Redis.

### Critical Don't-Miss Rules

- **Không** hard-code danh sách collection menu production — lấy từ API/store; parent/child theo metadata/handle đã chốt trong kiến trúc.
- **Không** expose secret revalidate hoặc JWT/cookie secret; đồng bộ `REVALIDATE_SECRET` giữa backend và storefront khi test ISR.
- Khi thêm API Store public: xác nhận **`AUTHENTICATE = false`** chỉ khi đúng yêu cầu bảo mật (chỉ dữ liệu public CMS).
- Script seed: **idempotent** theo handle/SKU (xem `src/scripts/seed*.ts`); chạy qua Medusa CLI `exec` như trong `apps/backend/package.json`.
- `@medusajs/js-sdk` / `ui` / `types` ở storefront đang **`latest`** — khi debug breaking change, so khớp hành vi với backend **2.13.1**.

---

## Hướng dẫn sử dụng

**Cho AI agents**

- Đọc file này (và khi cần sâu hơn: `architecture.md`, PRD) trước khi implement.
- Tuân thủ đúng các quy tắc; khi mơ hồ, chọn hướng **an toàn hơn** (types chặt hơn, không mở auth nhầm, không thêm locale).
- Khi pattern mới ổn định, đề xuất cập nhật lại file này.

**Cho người**

- Giữ file **ngắn, đủ sức nhắc**; cập nhật khi đổi phiên bản Medusa/Next hoặc convention mới.
- Xoá/bớt rule khi đã trở nên hiển nhiên với team.

Cập nhật lần cuối: **2026-04-06**
