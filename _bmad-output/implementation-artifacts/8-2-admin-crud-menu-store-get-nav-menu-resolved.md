# Story 8.2: Admin API — CRUD menu + Store API — `GET nav-menu` đã resolve

**Story Key:** `8-2-admin-crud-menu-store-get-nav-menu-resolved`  
**Epic:** 8 — Điều hướng & thương hiệu storefront (Wave 2)  
**Status:** done

> Phụ thuộc **8.1** (cột `nav_tree` + model). **Không** làm Admin UI editor (story **8.3**). **Không** sửa component SF nav (story **8.4**).

---

## Story

Là **quản trị viên**,  
tôi muốn **lưu cây menu qua Admin API và để khách đọc menu đã resolve nhãn theo locale**,  
để **FR-29**, **FR-13**, **FR-23** — một nguồn CMS, tên collection đồng bộ `metadata.i18n`.

---

## Acceptance Criteria

1. **Admin `GET /admin/custom/cms-nav`:** trả `{ nav_tree }` lấy từ `store_cms_settings` (singleton `cms`); nếu `nav_tree` null → trả `null` hoặc `{ "version": 1, "items": [] }` — **chốt một** trong contract response và ghi rõ trong OpenAPI comment / Dev Notes.
2. **Admin `PATCH /admin/custom/cms-nav`:** body JSON `{ nav_tree: <object> }`; validate **độ sâu tối đa 2** (chỉ `items[].children[]`, không `children` lồng thêm); mọi `type: "link"` có `url` qua **`validateTargetUrl`** (`apps/backend/src/utils/validate-target-url.ts`, cùng quy tắc banner — NFR-4); `type: "collection"` bắt buộc `handle` string không rỗng; **optional:** từ chối `handle` không tồn tại trong DB (query `product_collection` theo handle) với **400** và message tiếng Việt ngắn (chuẩn bị NFR-9).
3. **Sau PATCH thành công:** gọi revalidate storefront với **`tag: "cms-nav"`** (mở rộng `revalidateStorefrontCms` nhận tham số `tag` hoặc hàm riêng — **storefront đã hỗ trợ** `body.tag` tại `apps/backend-storefront/src/app/api/revalidate/route.ts`).
4. **Store `GET /store/custom/nav-menu`:** `export const AUTHENTICATE = false`; query **`locale`** (bắt buộc hoặc default `vi` nếu thiếu — khớp `default_locale`); chỉ chấp nhận locale nằm trong `enabled_locales` của settings (sai → **400**).
5. **Payload Store (đã resolve):** với mỗi nhóm cấp 1: `label` string theo locale (từ `item.label[locale]` + fallback `vi`). Với child `collection`: `label` = `label_override[locale]` nếu có, không thì **`resolveI18nTitleDescription`** / `resolveI18nField` trên `metadata.i18n` của collection + `title` gốc; `href` dạng **`/collections/{handle}`** (storefront tự prefix locale). Với child `link`: `label` từ JSON, `href` = url đã validate.
6. **`nav_tree` null hoặc `items` rỗng:** Store trả cấu trúc rỗng hợp lệ (200), không 500.

---

## Tasks / Subtasks

- [x] Thêm **`src/api/admin/custom/cms-nav/route.ts`**: `GET`, `PATCH` (session admin giống `cms-settings`).  
- [x] Validate **`src/utils/nav-tree.ts`**: parse + validate thủ công (đủ AC, không thêm Zod).  
- [x] Thêm **`src/utils/build-resolved-nav-menu.ts`**: nhận `nav_tree` + `locale` + `Query` để load collections theo handle.  
- [x] Thêm **`src/api/store/custom/nav-menu/route.ts`**: `GET`, đọc `locale`, gọi builder, `res.json(...)`.  
- [x] Cập nhật **`revalidate-storefront.ts`**: tham số `tag` (mặc định `"cms"`); PATCH cms-nav gọi `revalidateStorefrontCms("cms-nav")`.  
- [x] **PATCH `cms-settings`**: merge `nav_tree`, `site_title_i18n`, `tagline_i18n` từ `current` để không xóa khi đổi logo/locale.  
- [x] Test: unit `src/utils/__tests__/nav-tree.unit.spec.ts` (link + `validateTargetUrl`).

---

## Dev Notes

### Contract `nav_tree` (lưu trong DB)

Khớp migration **8.1** / `architecture.md` §4.5:

- `version`: number (ví dụ `1`)  
- `items[]`: cấp 1 — `id`, `label: { vi, en }`, `children[]`  
- Child **`collection`:** `type`, `handle`, `label_override`: `null` | `{ vi?: string, en?: string }`  
- Child **`link`:** `type`, `url`, `label: { vi, en }`

### Tham chiếu code có sẵn

- URL: `validateTargetUrl` — [Source: `apps/backend/src/utils/validate-target-url.ts`]  
- i18n catalog: `resolveI18nField`, `resolveI18nTitleDescription` — [Source: `apps/backend/src/utils/resolve-i18n.ts`]  
- Admin auth pattern: [Source: `apps/backend/src/api/admin/custom/cms-settings/route.ts`]  
- Store public pattern: [Source: `apps/backend/src/api/store/custom/cms-settings/route.ts`]  
- Revalidate: [Source: `apps/backend/src/utils/revalidate-storefront.ts`] + storefront [Source: `apps/backend-storefront/src/app/api/revalidate/route.ts`]

### Query collection theo handle

Dùng `ContainerRegistrationKeys.QUERY` + `entity: "product_collection"`, `filters: { handle }` hoặc `filters: { handle: { $in: handles } }` — kiểm tra đúng API Medusa 2.13 trong codebase (`query.graph`).

### Phạm vi ngoài story

- Không sửa `storefront-cms` Admin React (8.3).  
- Store `cms-settings` có thể bổ sung `site_title_i18n` / `tagline` public sau; **8.2** tập trung **nav** only.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 8.2]  
- [Source: `_bmad-output/planning-artifacts/architecture.md` — ADR-11, §5 API]  
- [Source: `_bmad-output/project-context.md` — Store routes, `AUTHENTICATE = false`]

---

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

### Completion Notes List

- Admin **GET** `/admin/custom/cms-nav` luôn trả `nav_tree` dạng object `{ version, items }` (DB `null` → `{ version: 1, items: [] }`).
- Admin **PATCH** kiểm tra collection tồn tại qua `query.graph`; lỗi 400 tiếng Việt.
- Store **GET** `/store/custom/nav-menu?locale=` — thiếu `locale` thì dùng `default_locale`; locale không thuộc `enabled_locales` → 400.

### File List

- `apps/backend/src/api/admin/custom/cms-nav/route.ts`
- `apps/backend/src/api/store/custom/nav-menu/route.ts`
- `apps/backend/src/utils/nav-tree.ts`
- `apps/backend/src/utils/build-resolved-nav-menu.ts`
- `apps/backend/src/utils/revalidate-storefront.ts`
- `apps/backend/src/api/admin/custom/cms-settings/route.ts`
- `apps/backend/src/utils/__tests__/nav-tree.unit.spec.ts`
