# Story 12.2: Audit i18n storefront (menu/labels/products/news) + tự test UI/API

Status: ready-for-dev

## Story

Là **owner vận hành + QA/dev**,  
tôi muốn **rà soát toàn bộ nội dung storefront theo locale (từ menu → label UI → product/collection → tin tức) và sửa các điểm chưa i18n đúng**,  
để **khi chuyển ngôn ngữ thì nội dung thực sự thay đổi, không còn trộn VN/EN và không còn phần nào “đứng yên” do hard-code hoặc fetch sai locale**.

## Phạm vi

- Bao phủ **storefront Next.js** tại `apps/backend-storefront` (không phải Medusa Admin UI).
- Nội dung cần kiểm tra (tối thiểu):
  - **Header / MegaNav / Drawer**: nhãn nhóm + nhãn mục con, “Xem thêm”, các link phụ (Home/Store/Account/Cart).
  - **Footer**: brand/site title + tagline + headings + link collections + social/contact fallback.
  - **Trang sản phẩm & danh mục**: PLP/PDP/collections/categories (title/description khi có i18n).
  - **Tin tức**: `/news`, `/news/[slug]`, taxonomy (category/tag) và CTA liên quan.
  - **SEO metadata** trên các route chính (title/description) — phải bám locale.
- Ngoài phạm vi:
  - Checkout/payment nâng cao, RBAC Growth, thay đổi schema DB.
  - “Dịch thuật” nội dung mới (copywriting) — chỉ đảm bảo **cơ chế hiển thị theo locale** hoạt động.

## Acceptance Criteria

1. **AC1 — Locale switching đổi nội dung thật (UI):**  
   **Given** chạy local backend + storefront  
   **When** mở cùng một trang ở `/vi/...` và `/en/...` (cùng path sau prefix) và dùng switcher đổi qua lại  
   **Then** các nhóm sau **phải thay đổi text hiển thị** (không chỉ đổi URL):
   - Header: nhãn điều hướng cố định + “Xem thêm” (FR-24)  
   - Drawer: các link phụ (Home/Store/Account/Cart) và nhãn section liên quan  
   - Footer: headings + tagline/site title (nếu CMS có i18n) hoặc fallback messages theo locale  
   - News: tiêu đề trang (“Tin tức”/“News”), CTA (“Tất cả tin tức”, phân trang, lọc)

2. **AC2 — Không còn hard-code xen kẽ VN/EN trên cùng viewport (SC-10 / FR-22):**  
   **Given** locale = `vi`  
   **When** duyệt các route chính  
   **Then** không có nhãn UI cố định bị “lọt” tiếng Anh (trừ nội dung seed thiếu dịch có policy fallback)  
   **And** **Given** locale = `en`  
   **Then** các nhãn UI cố định tương ứng phải là tiếng Anh (không kẹt tiếng Việt).

3. **AC3 — Product/Collection i18n đúng nơi hiển thị:**  
   **Given** seed đã có một số `metadata.i18n` (epic 7)  
   **When** xem PLP/PDP/collections  
   **Then** mọi nơi render title/description **phải dùng helper i18n catalog**, không dùng `product.title` / `collection.title` trực tiếp nếu đã có helper tương ứng.  
   (Định nghĩa helper hiện có: `displayProduct`, `displayCollection` trong `apps/backend-storefront/src/lib/util/i18n-catalog.ts`.)

4. **AC4 — News i18n đúng + taxonomy hiển thị đúng locale:**  
   **Given** `/[locale]/news` và `/[locale]/news/[slug]`  
   **When** đổi locale  
   **Then** title/excerpt/category/tag labels hiển thị theo locale (hoặc fallback policy), và các label UI của trang tin dùng `getStorefrontMessages(locale)`.

5. **AC5 — API smoke test theo locale:**  
   **Given** backend chạy  
   **When** gọi các Store routes sau với `locale=vi` và `locale=en`  
   **Then** response payload phải khác nhau ở các field có i18n (hoặc trả fallback hợp lệ), và storefront hiển thị tương ứng:
   - `GET /store/custom/nav-menu?locale=...`
   - `GET /store/custom/cms-settings`
   - `GET /store/custom/cms-news?locale=...`
   - `GET /store/custom/cms-news/:slug?locale=...`

## Tasks / Subtasks

- [ ] **T1 — Lập checklist “điểm chạm i18n” theo route (AC: 1,2)**  
  - [ ] Home: `apps/backend-storefront/src/app/[countryCode]/(main)/page.tsx`  
  - [ ] Nav header: `apps/backend-storefront/src/modules/layout/templates/nav/index.tsx`  
  - [ ] Drawer: `apps/backend-storefront/src/modules/layout/components/side-menu/index.tsx`  
  - [ ] Footer: `apps/backend-storefront/src/modules/layout/templates/footer/index.tsx`  
  - [ ] News list/detail/category: `apps/backend-storefront/src/app/[countryCode]/(main)/news/**`

- [ ] **T2 — Audit i18n messages & hard-coded strings (AC: 1,2)**  
  - [ ] Dùng message source hiện có: `apps/backend-storefront/src/lib/i18n/storefront-messages.ts`  
  - [ ] Với component client (drawer, select…), dùng provider/hook hiện có (`useStorefrontMessages`) hoặc thread locale prop từ server component (không tự chế i18n system mới).

- [ ] **T3 — Audit i18n catalog usage (AC: 3)**  
  - [ ] Tìm tất cả nơi hiển thị `product.title`, `collection.title`, `product.description` trên storefront.  
  - [ ] Chuẩn hoá dùng `displayProduct` / `displayCollection` (`src/lib/util/i18n-catalog.ts`) cho các điểm hiển thị user-facing.

- [ ] **T4 — Audit news i18n end-to-end (AC: 4)**  
  - [ ] Confirm fetch layer truyền đúng locale vào Store API: `apps/backend-storefront/src/lib/data/cms.ts` (`getCmsNewsList`, `getCmsNewsArticle`, categories/tags).  
  - [ ] Confirm UI labels của news dùng `getStorefrontMessages(locale)` (không hard-code).

- [ ] **T5 — Thực thi test UI + API, ghi lại bằng chứng (AC: 1,5)**  
  - [ ] Chạy backend + storefront dev:
    - Root: `npm run dev:backend`
    - Root: `npm run dev:storefront` (port 8000)
  - [ ] Seed dữ liệu cần thiết (nếu DB trống): `apps/backend`: `npm run seed:sales-kit:confirm`
  - [ ] UI test manual (tối thiểu 8 điểm chạm):
    - `/vi` ↔ `/en`
    - `/vi/news` ↔ `/en/news`
    - 1 bài tin `/vi/news/[slug]` ↔ `/en/news/[slug]`
    - 1 collection `/vi/collections/...` ↔ `/en/collections/...`
    - PDP `/vi/products/...` ↔ `/en/products/...`
  - [ ] API smoke test (PowerShell `Invoke-WebRequest` hoặc tương đương) cho 4 endpoints trong AC5 với `locale=vi` vs `en` và so sánh các field i18n.

- [ ] **T6 — Fix issues discovered (AC: 1–4)**  
  - [ ] Ưu tiên fix theo thứ tự: **Nav/Drawer/Footer labels** → **News labels** → **Catalog display** → **Metadata SEO**.
  - [ ] Không “đập đi làm lại” kiến trúc i18n; tái sử dụng helper & message system đang có.

## Dev Notes

### Context bắt buộc (kiến trúc/PRD/UX)

- Storefront dùng prefix locale theo `[countryCode]` nhưng semantic là locale (`vi`|`en`|`ja`).  
  [Source: `_bmad-output/project-context.md` §Next.js storefront; `apps/backend-storefront/src/lib/util/locales.ts`]
- UI string dùng message map theo locale: `getStorefrontMessages(locale)` trong `apps/backend-storefront/src/lib/i18n/storefront-messages.ts`.  
- Catalog i18n dùng `metadata.i18n` + helper `displayProduct`/`displayCollection`.  
  [Source: `_bmad-output/planning-artifacts/architecture.md` ADR-02; `apps/backend-storefront/src/lib/util/i18n-catalog.ts`]
- Nav menu lấy từ Store API custom `GET /store/custom/nav-menu?locale=` và caching tag `cms-nav`.  
  [Source: `_bmad-output/planning-artifacts/architecture.md` ADR-11; `apps/backend-storefront/src/lib/data/nav-menu.ts`]
- News lấy từ Store API custom `GET /store/custom/cms-news` / `/:slug` (tag `cms-news`), và storefront routes `/[locale]/news...`.  
  [Source: `_bmad-output/planning-artifacts/architecture.md` ADR-25; `apps/backend-storefront/src/lib/data/cms.ts`]

### Guardrails (chống lỗi thường gặp)

- Không nhầm “locale” với “region/country”: biến `countryCode` trong code storefront là locale path segment.
- Không hard-code danh sách locale ngoài `ALL_APP_LOCALE_CODES` và `enabled_locales` từ CMS.
- Với client components: tránh đọc locale từ `window.location` rải rác; dùng hook/provider sẵn có hoặc prop.
- Fallback i18n hợp lệ:
  - UI messages: fallback `DEFAULT_LOCALE = "vi"`.
  - Catalog i18n: fallback `vi` trong `resolveI18nField`.

### Testing standards

- Nếu có thay đổi logic helper i18n: thêm unit test (nếu repo đã có pattern test cho storefront thì bám theo; nếu không, tối thiểu đảm bảo typecheck + manual regression theo checklist T5).
- Backend integration tests (nếu phải sửa Store API): dùng `apps/backend` scripts `test:integration:http` theo `project-context.md`.

## Dev Agent Record

### Agent Model Used

_(điền khi dev-story chạy)_

### Debug Log References

### Completion Notes List

### File List

