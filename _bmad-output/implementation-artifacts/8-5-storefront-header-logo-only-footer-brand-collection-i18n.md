# Story 8.5: Storefront — header chỉ logo, footer thương hiệu + collection localize

**Story Key:** `8-5-storefront-header-logo-only-footer-brand-collection-i18n`  
**Story ID:** 8.5  
**Epic:** 8 — Điều hướng & thương hiệu storefront (Wave 2)  
**Status:** done

> **Phụ thuộc:** **8.1–8.4** đã xong (schema `site_title_i18n` / `tagline_i18n`, Admin PATCH, nav CMS). **Không** mở rộng Epic 9 (CMS pages). **Không** đổi contract `nav-menu` / `buildResolvedNavMenu` trừ khi phát hiện bug chặn branding.

---

## Story

Là **khách**,  
tôi muốn **header gọn với logo trái; footer có tên shop, tagline và link collection đúng ngôn ngữ**,  
để **FR-11**, **FR-11b**, **FR-23**, **FR-26**, **FR-28**, **SC-11**, **SC-12**.

---

## Acceptance Criteria

1. **Header — không còn tên shop cạnh logo:** Trên `Nav`, khi có **logo** (`cms.logo_url`), **không** hiển thị text tên shop bên cạnh/đồng hàng với logo (hiện tại có `span` visible từ `xsmall:` và `sr-only`). Khi **không** có logo, giữ **một** dòng tên shop (text) làm fallback hợp lý — vẫn là “chỉ khu vực brand”, không thêm block phụ.
2. **Logo — `alt` / `aria-label` thống nhất:** `Image` / `<img>` logo dùng **`alt`** mô tả thương hiệu (hoặc rỗng + **`aria-label`** trên link home nếu team chọn pattern một nguồn). Tránh `alt=""` + không có nhãn thay thế khi logo là nội dung duy nhất của link.
3. **Footer — tên shop + tagline theo locale & CMS:** Tên shop và tagline footer đọc từ **CMS** với **ưu tiên i18n** (`site_title_i18n`, `tagline_i18n` JSON `{ vi?, en? }`), **fallback** `site_title` legacy rồi `NEXT_PUBLIC_STORE_DISPLAY_NAME` rồi chuỗi fallback message (cùng logic tinh thần `getStoreBrandName`). Tagline: nếu CMS không có bản cho locale thì fallback **`getStorefrontMessages(locale).footer.tagline`**.
4. **Store API `GET /store/custom/cms-settings`:** Trả về thêm payload public an toàn cho **`site_title_i18n`** và **`tagline_i18n`** (nullable object) **hoặc** trường đã resolve theo `?locale=` — **chốt một cách**; nếu dùng query `locale`, storefront **phải** truyền `countryCode` và đảm bảo cache Next không gộp nhầm hai locale (document rõ trong code: `fetch` + `query` + key cache).
5. **Footer — tên collection:** Cột/list collection trong footer dùng **`displayCollection(countryCode, collection.title, collection.metadata)`** từ `@lib/util/i18n-catalog` (đã có cho PLP/metadata) — **không** hard-code tiếng Anh cho tiêu đề cột: dùng **`m.footer.collections`** từ `getStorefrontMessages(locale)`.
6. **Branding nhà phát triển (Medusa/Next):** `MedusaCTA` chỉ hiển thị **môi trường không production** **hoặc** khi bật cờ env (ví dụ `NEXT_PUBLIC_SHOW_DEV_BRANDING=true`) — mặc định **ẩn trên production**. Ghi chú ngắn trong `.env.example` nếu thêm biến.

---

## Tasks / Subtasks

- [x] (AC: 4) Backend **`apps/backend/src/api/store/custom/cms-settings/route.ts`**: bổ sung đọc `site_title_i18n` / `tagline_i18n` từ `getOrCreateSettings()` và xuất JSON store; giữ `site_title` legacy như hiện tại để tương thích.
- [x] (AC: 3–4) Storefront **`apps/backend-storefront/src/lib/data/cms.ts`**: mở rộng type `CmsSettingsPublic`, parse an toàn; thêm helper **`resolveCmsSiteTitle(locale, cms)`** / **`resolveCmsTagline(locale, cms)`** (hoặc gộp một `resolveStoreBranding`) — fallback thứ tự khớp AC3.
- [x] (AC: 1–2) **`modules/layout/templates/nav/index.tsx`**: bỏ phần text tên shop khi có logo; set `alt`/`aria-label` nhất quán; đồng bộ **`brandName`** truyền **`SideMenu`** với tên đã resolve theo locale.
- [x] (AC: 3, 5) **`modules/layout/templates/footer/index.tsx`**: dùng branding resolve; map collection với `displayCollection`; heading collections → `m.footer.collections`.
- [x] (AC: 6) **`modules/layout/components/medusa-cta/index.tsx`** + nơi render (footer, checkout): bọc điều kiện hiển thị; cập nhật **`apps/backend-storefront/.env.example`** nếu cần.
- [x] Rà soát **`getStoreBrandName`** / metadata pages (`page.tsx` product/collection/category) để dùng **cùng** chuỗi tên shop đã resolve i18n (tránh SEO/title một ngôn ngữ trong khi UI khác).
- [x] (Khuyến nghị) Unit test nhỏ cho helper resolve i18n string `{vi,en}` (file `*.unit.spec.ts` nếu thêm pure function) hoặc ghi rõ manual QA checklist. — *Storefront chưa cấu hình Jest; QA thủ công.*

---

## Dev Notes

### Hiện trạng code (điểm chạm)

- Header logo + text: ```60:97:apps/backend-storefront/src/modules/layout/templates/nav/index.tsx``` — cần gỡ block `logoSrc && headerTitle` (dòng 89–96).
- Footer brand + collections: ```24:127:apps/backend-storefront/src/modules/layout/templates/footer/index.tsx``` — `brandName` chỉ `site_title`; cột Collections hard-code `"Collections"` (dòng 105–106); `c.title` thô chưa qua `displayCollection`.
- Store cms-settings chỉ trả `site_title`: ```24:33:apps/backend/src/api/store/custom/cms-settings/route.ts```.
- Entity đã có **`site_title_i18n`**, **`tagline_i18n`**: `apps/backend/src/modules/store-cms/models/store-cms-settings.ts`.
- Helper catalog: **`displayCollection`** trong `apps/backend-storefront/src/lib/util/i18n-catalog.ts`.

### Kiến trúc & FR

- **ADR-07** logo URL; **ADR-13** `site_title_i18n`, `tagline_i18n` — [Source: `_bmad-output/planning-artifacts/architecture.md`].
- Wave 2: header **chỉ logo trái**; `site_title` + tagline từ **cms-settings** ở **footer** [Source: `architecture.md` § storefront].

### Tránh làm

- Không hard-code danh sách collection production làm nguồn truth (chỉ hiển thị từ `listCollections` đã có).
- Không leak dữ liệu admin-only trên Store API; chỉ field branding public.
- Không thêm locale thứ ba [Source: `_bmad-output/project-context.md`].

### Kiểm thử gợi ý

- Manual: Admin set `site_title_i18n` / `tagline_i18n` khác nhau vi/en; đổi locale storefront — header chỉ logo; footer đúng tên + tagline; tên collection khớp `metadata.i18n` khi có.
- Production build: `MedusaCTA` ẩn; bật cờ (nếu có) thì hiện.

---

## Intelligence từ story trước (8.4)

- **8.4** cố ý **không** làm header chỉ logo / footer branding — thuộc **8.5** [Source: `8-4-storefront-meganav-navdrawer-desktop-rules-fr-24.md`].
- `SideMenu` nhận `brandName` — cần cùng chuỗi resolve locale với footer.
- ISR tag **`cms`** đã dùng cho `getCmsSettingsPublic` — khi đổi shape API, xác nhận backend vẫn gọi revalidate tag `cms` sau PATCH settings (đã có từ flow CMS).

---

## References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 8.5]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — ADR-07, ADR-13, Wave 2 header/footer]
- [Source: `_bmad-output/project-context.md`]
- [Source: `_bmad-output/implementation-artifacts/8-4-storefront-meganav-navdrawer-desktop-rules-fr-24.md`]

---

## Dev Agent Record

### Agent Model Used

Cursor Agent (bmad-dev-story)

### Debug Log References

### Review Findings

- [x] [Review][Decision] `pickLocaleString`: sau locale chính có fallback `vi` — **chốt A (2026-04-06):** giữ hành vi; đã ghi chú trong `apps/backend-storefront/src/lib/data/cms.ts`.
- [x] **[CR 2026-04-06]** Code review (Acceptance Auditor): AC1–6 khớp code (`cms-settings` trả i18n; `getCmsSettingsPublic` cache một response + comment; nav chỉ text khi không logo + `alt={headerTitle}`; footer `resolveCms*` + `displayCollection` + `m.footer.collections`; `MedusaCTA` production + cờ env; metadata pages dùng `resolveCmsSiteTitle`). **Edge:** không fallback `en` sau `vi` trong `pickLocaleString` — đã chốt sản phẩm. **Gợi ý follow-up (không chặn):** thêm `aria-label` trên `LocalizedClientLink` logo nếu muốn nhân đôi nhãn với `alt` (không bắt buộc vì `Image`/`img` đã có `alt`).

### Completion Notes List

- Store `GET /store/custom/cms-settings` trả thêm `site_title_i18n`, `tagline_i18n`; storefront cache một response, resolve theo locale trong RSC (comment trong `getCmsSettingsPublic`).
- `resolveCmsSiteTitle` / `resolveCmsTagline` + parse chỉ key `vi`/`en` từ JSON.
- Nav: bỏ text cạnh logo; `alt={headerTitle}` cho ảnh logo.
- Footer: tagline CMS + `displayCollection` cho từng link; heading `m.footer.collections`.
- `MedusaCTA`: ẩn khi `NODE_ENV === production` trừ khi `NEXT_PUBLIC_SHOW_DEV_BRANDING=true`.
- Trang metadata (home, category, collection, product) + checkout header dùng `resolveCmsSiteTitle`.
- `npx tsc --noEmit` storefront: pass.

### File List

- `apps/backend/src/api/store/custom/cms-settings/route.ts`
- `apps/backend-storefront/src/lib/data/cms.ts`
- `apps/backend-storefront/src/modules/layout/templates/nav/index.tsx`
- `apps/backend-storefront/src/modules/layout/templates/footer/index.tsx`
- `apps/backend-storefront/src/modules/layout/components/medusa-cta/index.tsx`
- `apps/backend-storefront/src/app/[countryCode]/(main)/page.tsx`
- `apps/backend-storefront/src/app/[countryCode]/(main)/categories/[...category]/page.tsx`
- `apps/backend-storefront/src/app/[countryCode]/(main)/collections/[handle]/page.tsx`
- `apps/backend-storefront/src/app/[countryCode]/(main)/products/[handle]/page.tsx`
- `apps/backend-storefront/src/app/[countryCode]/(checkout)/layout.tsx`
- `apps/backend-storefront/.env.example`

---

## Ghi chú hoàn thành workflow

Ultimate context engine analysis completed — comprehensive developer guide created.
