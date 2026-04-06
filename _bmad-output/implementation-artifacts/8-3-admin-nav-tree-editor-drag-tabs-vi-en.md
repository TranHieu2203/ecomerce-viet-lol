# Story 8.3: Admin UI — editor cây menu (kéo thả, tabs vi/en)

**Story Key:** `8-3-admin-nav-tree-editor-drag-tabs-vi-en`  
**Story ID:** 8.3  
**Epic:** 8 — Điều hướng & thương hiệu storefront (Wave 2)  
**Status:** done

> **Phụ thuộc:** API **8.2** (`GET`/`PATCH /admin/custom/cms-nav`) và schema **8.1** đã xong.  
> **Không** sửa Storefront MegaNav / drawer (**8.4**). **Không** đổi contract `nav_tree` ở backend trừ khi bắt buộc (ưu tiên tái sử dụng validate hiện có).

---

## Story

Là **quản trị viên**,  
tôi muốn **chỉnh menu hai cấp trực quan** (kéo thả thứ tự, tabs **vi | en**, chọn collection / URL ngoài),  
để **FR-29**, **UX-DR6** (trợ giúp menu) và chuẩn bị **NFR-9** (thông báo lỗi tiếng Việt).

---

## Acceptance Criteria

1. **Trên Medusa Admin**, route hiện có **Storefront CMS** (`apps/backend/src/admin/routes/storefront-cms/page.tsx`) có thêm **một section** (hoặc component con tách file) **“Menu header (2 cấp)”** với đoạn **trợ giúp tiếng Việt ngắn** (theo UX §6 mục 4 — editor cây; gợi ý: giải thích cấp 1 = nhóm, cấp 2 = collection hoặc link ngoài, giới hạn 2 cấp).
2. **Tải dữ liệu:** gọi `GET /admin/custom/cms-nav` (cùng pattern `adminFetch` + `credentials: "include"` như trang CMS hiện tại); hiển thị `nav_tree` dạng `{ version, items[] }` (rỗng → `items: []`).
3. **Chỉnh sửa cấu trúc:**
   - Thêm / xóa **nhóm** (cấp 1); mỗi nhóm có `id` **ổn định** (UUID hoặc id không đổi khi reorder) để DnD và PATCH không làm mất tham chiếu.
   - Trong mỗi nhóm: thêm / xóa **mục con** — loại **`collection`** (chọn `handle`) hoặc **`link`** (`url` + nhãn).
   - **Kéo thả** để đổi thứ tự: (a) thứ tự các **nhóm**, (b) thứ tự **mục con trong một nhóm**. Không hỗ trợ kéo mục giữa hai nhóm trên MVP **hoặc** nếu làm thì phải cập nhật đúng `children` đích và không phá độ sâu > 2.
4. **Tabs ngôn ngữ vi | en:** với nhãn nhóm (`label.vi` / `label.en`), nhãn link (`label`), và `label_override` của collection — cho phép để trống một phía; lưu đúng shape backend (`NavLocaleLabel`).
5. **Collection:** ô chọn `handle` — có **autocomplete / search** tối thiểu (gọi API Admin Medusa lấy danh sách collection, ví dụ query list có `q` hoặc limit — tra đúng endpoint SDK Medusa 2.13 trong project). Khi `label_override` trống cả hai locale, hiển thị chỉ báo kiểu **“Lấy tên từ catalog”** (theo UX).
6. **Link ngoài:** nhập URL; validate phía client **tối thiểu** (trim, không rỗng); lỗi chi tiết từ server **PATCH** phải hiển thị cho user (message từ API — backend 8.2 đã có tiếng Việt cho một số lỗi).
7. **Lưu:** nút **Lưu menu** → `PATCH /admin/custom/cms-nav` body `{ nav_tree }`. Thành công → `toast` thành công (tiếng Việt). Lỗi → `toast` hoặc inline message với `error.message` từ `adminFetch`. Không cần gọi revalidate từ client (backend đã `revalidateStorefrontCms("cms-nav")` sau PATCH 8.2).
8. **Không** thay đổi hành vi các section **Banner** / **Cấu hình chung** hiện có (tránh regression).

---

## Tasks / Subtasks

- [x] (AC: 1–2) Thêm section UI + load `GET /admin/custom/cms-nav` khi mount; state `nav_tree` đồng bộ với type TS khớp [Source: `apps/backend/src/utils/nav-tree.ts` — `NavTree`, `NavTreeGroup`, …].
- [x] (AC: 3) Tích hợp **drag-and-drop** (đề xuất `@dnd-kit/core` + `@dnd-kit/sortable` — thêm dependency vào `apps/backend` nếu chưa có; tránh copy logic reorder thủ công như banner nếu AC yêu cầu kéo thả). Giữ reorder **trong** danh sách groups và **trong** `children` của từng group.
- [x] (AC: 4) Component tabs **Tiếng Việt | English** (có thể dùng `@medusajs/ui` hoặc nút toggle) để sửa các trường `label` / `label_override`.
- [x] (AC: 5) Gọi API list collections từ Admin; map về `handle` + title hiển thị; lưu `handle` vào child `type: "collection"`.
- [x] (AC: 6–7) Form link + `PATCH` lưu; xử lý lỗi và toast.
- [x] (AC: 1) Khối **trợ giúp** (Text `size="small"` hoặc `?` collapsible) — nội dung tiếng Việt, đúng màn.
- [x] Kiểm tra thủ công: lưu → Storefront `GET /store/custom/nav-menu?locale=vi` phản ánh thứ tự/nhãn (không bắt buộc automated test trong story này).

### Review Findings

_(bmad-code-review, 2026-04-06)_

- [x] [Review][Patch] Lỗi `GET /admin/collections` bị nuốt im lặng — admin không biết hết quyền / lỗi mạng khi gợi ý handle [`nav-header-menu-section.tsx` ~357] — **đã sửa:** `toast.warning` trong `catch` của `searchCollections`.
- [x] [Review][Defer] `window.confirm` khi xóa nhóm — cùng pattern với banner trên trang; a11y kém hơn dialog `@medusajs/ui` — deferred, có thể gom refactor cả trang sau.

---

## Dev Notes

### Contract & validate

- **Nguồn sự thật cấu trúc:** [Source: `apps/backend/src/utils/nav-tree.ts`] — `parseNavTreeJson`, `EMPTY_NAV_TREE`, rule độ sâu 2, `validateTargetUrl` cho link.  
- **PATCH** đã validate server-side: không gửi `children` lồng sâu hơn 1 cấp dưới group.  
- **ID nhóm:** đảm bảo mỗi `NavTreeGroup.id` là string duy nhất (UUID v4 client-side ổn).

### API & auth

- **GET/PATCH base path:** giống các custom route admin khác (xem cách `page.tsx` gọi `cms-settings`). Path đầy đủ có thể dùng `__BACKEND_URL__` hoặc relative `/admin/custom/...` tùy pattern hiện tại của file.  
- [Source: `apps/backend/src/api/admin/custom/cms-nav/route.ts`]

### Tránh làm

- Không sửa `build-resolved-nav-menu.ts` / store `nav-menu` trừ khi phát hiện bug blocking UI.  
- Không implement MegaNav store (**8.4**).

### Kiểm thử

- Ưu tiên **manual QA** checklist trong PR. Unit test UI không bắt buộc; có thể thêm test nhỏ cho pure function map state → JSON nếu tách được.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 8.3]  
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — §6 mục 4 Menu header]  
- [Source: `_bmad-output/implementation-artifacts/8-2-admin-crud-menu-store-get-nav-menu-resolved.md` — contract & completion notes]  
- [Source: `_bmad-output/project-context.md` — Medusa 2.x, Admin custom routes]

---

## Dev Agent Record

### Agent Model Used

Cursor Agent (bmad-dev-story)

### Debug Log References

_(không có)_

### Completion Notes List

- Section **Menu header (2 cấp)** trên route Storefront CMS: load `GET /admin/custom/cms-nav`, chỉnh sửa nhóm/mục con (collection + link), DnD reorder nhóm và mục con trong nhóm (`@dnd-kit/core` + `@dnd-kit/sortable`), tabs VI/EN cho nhãn, tìm collection qua `GET /admin/collections?q&limit`, `PATCH` + toast tiếng Việt.
- Tách `adminFetch` dùng chung; model editor `navTreeToEditor` / `editorToNavTree` + unit test nhỏ.
- Build backend + `npm run test:unit` pass.

### File List

- `apps/backend/package.json`
- `apps/backend/src/admin/routes/storefront-cms/admin-fetch.ts`
- `apps/backend/src/admin/routes/storefront-cms/nav-editor-model.ts`
- `apps/backend/src/admin/routes/storefront-cms/nav-header-menu-section.tsx`
- `apps/backend/src/admin/routes/storefront-cms/page.tsx`
- `apps/backend/src/admin/routes/storefront-cms/__tests__/nav-editor-model.unit.spec.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/8-3-admin-nav-tree-editor-drag-tabs-vi-en.md`

### Change Log

- 2026-04-06: Hoàn thành story 8.3 — editor menu admin + DnD + i18n tabs + gợi ý collection; sprint `8-3` → `review`.
- 2026-04-06: Code review — patch toast khi lỗi tải collections; sprint `8-3` → `done`.

---

**Ghi chú workflow:** Ultimate context engine analysis completed — comprehensive developer guide created.
