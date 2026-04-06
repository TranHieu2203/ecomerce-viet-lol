# Deferred work

## Deferred from: code review of 8-4-storefront-meganav-navdrawer-desktop-rules-fr-24 (2026-04-06)

- **Drawer: Language/Region chủ yếu hover** — `side-menu/index.tsx` vẫn `onMouseEnter`/`onMouseLeave` cho `LanguageSelect` / `CountrySelect`; FR-25 yêu cầu touch rõ ràng — có thể chuyển sang tap/expicit toggle sau, gom với audit mobile nav.

## Deferred from: code review of 8-3-admin-nav-tree-editor-drag-tabs-vi-en (2026-04-06)

- **confirm() khi xóa nhóm menu** — `nav-header-menu-section.tsx` dùng `window.confirm` giống flow xóa banner trên cùng route Storefront CMS; có thể thay bằng dialog `@medusajs/ui` và gom chuẩn a11y cho cả trang sau.
