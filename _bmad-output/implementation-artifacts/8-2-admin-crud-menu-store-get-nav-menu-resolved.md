# Story 8.2: Admin API — CRUD menu + Store API — `GET nav-menu` đã resolve

**Story Key:** `8-2-admin-crud-menu-store-get-nav-menu-resolved`  
**Epic:** 8 — Điều hướng & thương hiệu storefront (Wave 2)  
**Status:** ready-for-dev

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

- [ ] Thêm **`src/api/admin/custom/cms-nav/route.ts`**: `GET`, `PATCH` (session admin giống `cms-settings`).  
- [ ] Thêm **`src/utils/nav-tree-schema.ts`** (hoặc tương đương): parse + validate bằng **Zod** (thêm dependency nếu chưa có — hoặc validate thủ công đủ AC).  
- [ ] Thêm **`src/utils/build-resolved-nav-menu.ts`** (hoặc method service): nhận `nav_tree` + `locale` + `Query`/`container` để load collections theo handle (gom handle unique, một query batch nếu được).  
- [ ] Thêm **`src/api/store/custom/nav-menu/route.ts`**: `GET`, đọc `locale`, gọi builder, `res.json(...)`.  
- [ ] Cập nhật **`revalidate-storefront.ts`**: tham số `tag?: string` (mặc định `"cms"` để không phá chỗ gọi cũ); PATCH cms-nav gọi `revalidateStorefrontCms("cms-nav")`.  
- [ ] **PATCH `cms-settings`** (tùy chọn trong 8.2): đảm bảo khi cập nhật settings **không** xóa `nav_tree` — nếu code review trước đó lo ngại partial update, **xác minh** `updateCmsSettings` chỉ cập nhật field truyền vào; nếu không, merge `nav_tree` từ `current` trước khi update.  
- [ ] Test: unit cho validator nav + ít nhất một case `validateTargetUrl` trên link trong tree; integration HTTP tùy thời gian.

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

_(khi hoàn thành)_

### Debug Log References

### Completion Notes List

### File List

_(khi hoàn thành)_
