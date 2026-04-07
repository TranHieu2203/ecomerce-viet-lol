# Deferred work

## Deferred from: code review of 9-6-storefront-cms-page-route-seo-announcement-not-found.md (2026-04-07)

- **HTML CMS trên SF (`dangerouslySetInnerHTML`):** phụ thuộc sanitize backend; cân nhắc CSP / DOMPurify client nếu chính sách bảo mật thắt chặt.
- **i18n a11y:** `aria-label` AnnouncementBar / region — hiện tiếng Anh; có thể gắn `getStorefrontMessages` sau.
- **Storefront unit test:** parse `not_found` / announcement (tuỳ chọn) nếu muốn CI không chỉ backend.

## Deferred from: code review of 9-5-admin-history-restore-fr-37.md (2026-04-07)

- **`GET` settings/nav:** hiện `listStoreCmsRevisions({ entity_type })` rồi lọc `entity_id` trong JS — đủ cho quy mô revision nhỏ; nếu bảng lớn, chuyển điều kiện `(entity_id IS NULL OR entity_id = 'cms')` xuống query.
- **Revision noise trên `PATCH` settings:** mọi request có key trong whitelist đều append revision trước update; có thể so khớp snapshot hoặc hash payload để bỏ qua khi không đổi.

## Deferred from: code review of 9-4-media-picker-reuse-uploaded-files-fr-35.md (2026-04-07)

- **`GET /admin/custom/cms-media-library` — `retrieveFile` tuần tự** — Với nhiều file id, latency tăng tuyến tính; MVP chấp nhận được. Có thể tối ưu batch/concurrency sau nếu cần.

## Deferred from: code review of 9-2-admin-store-cms-pages-crud-draft-publish-preview.md (2026-04-06)

- **Integration tests AC9** — Chưa có `integration:http` (hoặc tương đương) cho publish, store GET published vs draft, preview token; chờ cấu hình DB test / SASL ổn định.

## Deferred from: code review of 8-4-storefront-meganav-navdrawer-desktop-rules-fr-24 (2026-04-06)

- **Drawer: Language/Region chủ yếu hover** — `side-menu/index.tsx` vẫn `onMouseEnter`/`onMouseLeave` cho `LanguageSelect` / `CountrySelect`; FR-25 yêu cầu touch rõ ràng — có thể chuyển sang tap/expicit toggle sau, gom với audit mobile nav.

## Deferred from: code review of 8-3-admin-nav-tree-editor-drag-tabs-vi-en (2026-04-06)

- **confirm() khi xóa nhóm menu** — `nav-header-menu-section.tsx` dùng `window.confirm` giống flow xóa banner trên cùng route Storefront CMS; có thể thay bằng dialog `@medusajs/ui` và gom chuẩn a11y cho cả trang sau.
