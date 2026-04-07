# Story 9.5: Admin UI — lịch sử & khôi phục (FR-37)

**Story Key:** `9-5-admin-history-restore-fr-37`

**Story ID:** 9.5

**Epic:** 9 — CMS vận hành & nội dung tĩnh (Wave 3)

**Status:** done

**Phụ thuộc:** **9.1** (bảng `store_cms_revision` + model). **9.2–9.4** đã có luồng Admin/API CMS; **trang CMS** đã **ghi revision** khi create/patch/publish/unpublish (xem `appendPageRevision` / `createStoreCmsRevisions` trong `cms-pages`). Story này bổ sung **đọc danh sách + restore + prune**, **ghi revision cho settings/nav** (hiện chưa có), và **UI drawer** (UX: `RevisionDrawer` trong [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` §15.5]).

---

## Story

Là **quản trị viên**,  
tôi muốn **xem các phiên bản gần đây và khôi phục sau khi lưu nhầm**,  
để **FR-37** và trải nghiệm hoàn tác tối thiểu trên nội dung CMS.

---

## Acceptance Criteria

1. **API Admin — liệt kê revision (ADR-16):** `GET /admin/custom/cms-revisions` (hoặc cấu trúc path tương đương nhưng phải document trong Completion Notes), **bắt buộc query** `entity_type` thuộc `settings` | `nav` | `page` | `banner`. Với `page` **bắt buộc** `entity_id` = id trang; với `settings` và `nav` dùng **`entity_id=cms`** (thống nhất với `CMS_SETTINGS_ID` trong `apps/backend/src/modules/store-cms/service.ts`) để lọc index — **không** để client bỏ trống rồi trả toàn bộ bảng.
2. **API Admin — khôi phục:** `POST /admin/custom/cms-revisions/restore` (hoặc `POST .../restore` dưới resource revisions) với body tối thiểu `{ "revision_id": "<uuid>" }`. Handler: load revision theo id, xác nhận `entity_type`/`entity_id` khớp payload hoặc suy ra từ row; **áp `payload_snapshot` trong transaction** lên entity đích (Medusa module service), sau đó **ghi thêm một revision mới** (chuỗi audit — [Source: `architecture.md` §4.7]) với snapshot **sau** khi restore (hoặc ít nhất ghi revision mới phản ánh trạng thái đã restore — chốt một luật nhất quán trong code và ghi trong Completion Notes).
3. **Prune N bản (ADR-16):** Sau mỗi lần **tạo** revision (kể cả từ restore), giữ tối đa **20** bản **theo cặp** `(entity_type, entity_id)` (với `entity_id` null trong DB thì coi như khớp singleton `cms` nếu team map vậy — **phải** nhất quán với cách ghi khi implement). Xóa bản cũ nhất: ưu tiên **soft-delete** (`deleted_at`) nếu pattern Medusa/model hỗ trợ; tránh để bảng phình vô hạn.
4. **Ghi revision trước đây thiếu (để FR-37 có ý nghĩa trên settings/menu):**
   - **`PATCH /admin/custom/cms-settings`:** trước khi `updateCmsSettings`, tạo revision `entity_type: "settings"`, `entity_id: "cms"`, `payload_snapshot` chứa **toàn bộ trường ADR-13** cần cho restore (ít nhất: `default_locale`, `enabled_locales`, `logo_file_id`, `site_title`, `nav_tree`, `site_title_i18n`, `tagline_i18n`, `seo_defaults`, `og_image_file_id`, `footer_contact`, `announcement`, `not_found` — mirror row sau khi đọc `getOrCreateSettings`).
   - **`PATCH /admin/custom/cms-nav`:** trước khi cập nhật `nav_tree`, tạo revision `entity_type: "nav"`, `entity_id: "cms"`, `payload_snapshot` dạng `{ "nav_tree": <object đã validate> }` (hoặc snapshot đủ để restore chỉ menu).
5. **Admin UI — `RevisionDrawer` (hoặc tên component tương đương):**
   - Trên **`apps/backend/src/admin/routes/cms-pages/[id]/page.tsx`**: nút mở drawer **“Lịch sử phiên bản”**, gọi `GET .../cms-revisions?entity_type=page&entity_id=<id>`, hiển thị danh sách theo `created_at` giảm dần (hiển thị thời gian ngắn + gợi ý trạng thái/slug từ snapshot nếu có). Nút **“Khôi phục”** từng dòng → **hộp thoại xác nhận** (copy tiếng Việt rõ ràng) → `POST restore` → toast thành công / lỗi; sau thành công **reload form** từ `GET /admin/custom/cms-pages/:id`.
   - Trên **Storefront CMS** (`storefront-cms/page.tsx` hoặc vị trí hợp lý cho settings): entry point tương tự cho **`entity_type=settings`** (`entity_id` cố định `cms` trên query — không hiển thị raw id cho user nếu không cần).
   - **Menu:** trên màn chỉnh `nav_tree` (nơi đang gọi `PATCH /admin/custom/cms-nav`) thêm drawer **`entity_type=nav`**.
6. **Storefront sau restore:** Sau restore **trang** đã `published`, gọi `revalidateStorefrontCms("cms-pages")` (và/hoặc tag đang dùng khi publish — đồng bộ với `cms-pages` routes). Sau restore **settings** hoặc **nav**, gọi `revalidateStorefrontCms("cms")` / `("cms-nav")` như các route hiện có ([Source: `apps/backend/src/utils/revalidate-storefront.ts`]).
7. **NFR-9:** Mọi lỗi validation/404/409 trả **message tiếng Việt**; **không** trả stack trace cho client. Log server giữ chi tiết.
8. **Kiểm thử:** Unit test cho pure logic (parse snapshot, prune count, hoặc map restore fields) trong `apps/backend/src/utils/__tests__/*.unit.spec.ts` — theo [Source: `_bmad-output/project-context.md`]. Integration HTTP tùy chọn nếu lý do infra giống story 9.4.

---

## Tasks / Subtasks

- [x] Thiết kế contract JSON `GET` (shape `revisions[]`: `id`, `created_at`, `entity_type`, `entity_id`, `payload_snapshot` tối thiểu / hoặc preview an toàn cho UI).
- [x] Implement `GET /admin/custom/cms-revisions` + `POST .../restore` + helper prune (service hoặc util).
- [x] Hook **ghi revision** + prune vào `cms-settings` PATCH và `cms-nav` PATCH (trước khi đổi DB).
- [x] Đảm bảo restore **page** dùng validation/sanitize **cùng pipeline** với PATCH page hiện tại ([Source: `apps/backend/src/utils/cms-page.ts`]) — tránh XSS / slug invalid sau restore.
- [x] Component drawer + xác nhận + toast; tái sử dụng `adminFetch` ([Source: `apps/backend/src/admin/routes/storefront-cms/admin-fetch.ts`]).
- [x] `npm run test:unit` + build admin/backend pass; ghi QA thủ công ngắn trong Dev Agent Record.

### Review Findings

- [x] [Review][Patch] Restore trang: gọi `revalidateStorefrontCms("cms-pages")` khi trang **đã từng** hoặc **vẫn** `published` — tránh ISR giữ bản cũ sau khi restore về draft — [`apps/backend/src/utils/cms-revision-restore.ts`].
- [x] [Review][Patch] Gỡ export không dùng `storageEntityIdForRevision` — [`apps/backend/src/utils/cms-revision.ts`].
- [x] [Review][Defer] `GET` settings/nav: list theo `entity_type` rồi lọc `entity_id` trong JS — chấp nhận khi số revision nhỏ; có thể chuyển filter DB sau.
- [x] [Review][Defer] Mỗi `PATCH` settings có key trong whitelist đều tạo revision kể cả khi giá trị không đổi — có thể so sánh snapshot/hash sau nếu cần.

---

## Dev Notes

### Kiến trúc & PRD

- **ADR-16** — bảng `store_cms_revision`, GET list + POST restore, transaction, N=20 — [Source: `_bmad-output/planning-artifacts/architecture.md` — bảng ADR-16, §4.7, §5.1].
- **FR-37** — [Source: `_bmad-output/planning-artifacts/prd.md`].
- API mẫu: `GET /admin/custom/cms-revisions` + `POST .../restore` — [Source: `architecture.md` §5.1].

### Code đang có (reuse — không reinvent)

- Snapshot trang: `buildPageRevisionSnapshot`, `appendPageRevision` — [Source: `apps/backend/src/utils/cms-page-revision.ts`].
- Model revision + `CMS_REVISION_ENTITY_TYPES` — [Source: `apps/backend/src/modules/store-cms/models/store-cms-revision.ts`].
- Module service: `StoreCmsModuleService` extends `MedusaService` với `StoreCmsRevision` — dùng method generate sẵn (`listStoreCmsRevisions`, `createStoreCmsRevisions`, `updateStoreCmsRevisions`, `softDeleteStoreCmsRevisions` — tên chính xác kiểm tra qua SDK/types trong repo).
- `actorUserId` pattern — [Source: `apps/backend/src/api/admin/custom/cms-pages/[id]/route.ts`].
- Revalidate — [Source: `apps/backend/src/utils/revalidate-storefront.ts`].

### Phạm vi & tránh làm

- **Banner (`entity_type=banner`):** chỉ bắt buộc nếu đã có (hoặc sẽ thêm) logic ghi revision cho banner trong cùng story; nếu chưa có snapshot banner, có thể **defer** UI banner nhưng API phải **từ chối rõ** hoặc trả rỗng — không để restore sai entity.
- Không mở Store API public cho revision.
- Không thêm locale thứ ba; snapshot JSON giữ cấu trúc `vi`/`en` hiện có.

### Testing

- [Source: `_bmad-output/project-context.md`] — Jest, `npm run test:unit` từ `apps/backend`.

### Project Structure Notes

- Route admin custom: `apps/backend/src/api/admin/custom/cms-revisions/` (hoặc tên folder khớp URL chốt).
- Admin UI: `cms-pages/[id]/page.tsx`, `storefront-cms/page.tsx` (hoặc tách `revision-drawer.tsx` share).

### References

- Epic story gốc — [Source: `_bmad-output/planning-artifacts/epics.md` — Story 9.5].
- Migration revision — [Source: `apps/backend/src/modules/store-cms/migrations/Migration20260406150000.ts`].

---

## Dev Agent Record

### Agent Model Used

Cursor Agent (Composer)

### Debug Log References

### Completion Notes List

- **GET** `/admin/custom/cms-revisions?entity_type=page|settings|nav&entity_id=<id>` — `settings`/`nav` bắt buộc `entity_id=cms`; `banner` → 400 tiếng Việt.
- **POST** `/admin/custom/cms-revisions/restore` — body `{ "revision_id": string }`; sau restore ghi thêm revision mới (audit) + prune 20 bản; revalidate `cms-pages` / `cms` / `cms-nav` theo loại entity.
- **Ghi revision:** `PATCH cms-settings` (sau khi validate body, trước `updateCmsSettings`); `PATCH cms-nav` (trước update); trang: `appendPageRevision` + POST create (đã có prune).
- **UI:** `CmsRevisionDrawer` — editor trang CMS, Storefront CMS (cấu hình), menu header.
- **QA thủ công:** Lưu settings → mở lịch sử → khôi phục; sửa menu → lịch sử → khôi phục; sửa trang published → khôi phục → kiểm tra storefront sau revalidate.
- **Transaction:** restore thực hiện tuần tự qua `StoreCmsModuleService` (không bọc explicit SQL transaction toàn phần); nếu cần atomicity mạnh hơn, cân nhắc manager MikroORM sau.
- **Code review 2026-04-07:** patch revalidate khi unpublish qua restore; gỡ dead export; defer ghi trong `deferred-work.md`.

### File List

- `apps/backend/src/utils/cms-revision.ts`
- `apps/backend/src/utils/cms-revision-restore.ts`
- `apps/backend/src/utils/cms-page-revision.ts`
- `apps/backend/src/utils/__tests__/cms-revision.unit.spec.ts`
- `apps/backend/src/api/admin/custom/cms-revisions/route.ts`
- `apps/backend/src/api/admin/custom/cms-revisions/restore/route.ts`
- `apps/backend/src/api/admin/custom/cms-settings/route.ts`
- `apps/backend/src/api/admin/custom/cms-nav/route.ts`
- `apps/backend/src/api/admin/custom/cms-pages/route.ts`
- `apps/backend/src/admin/routes/storefront-cms/revision-drawer.tsx`
- `apps/backend/src/admin/routes/storefront-cms/page.tsx`
- `apps/backend/src/admin/routes/storefront-cms/nav-header-menu-section.tsx`
- `apps/backend/src/admin/routes/cms-pages/[id]/page.tsx`

---

## Change Log

- 2026-04-07: Triển khai FR-37 — API revisions + restore, prune 20, revision settings/nav, UI drawer, unit test prune.
- 2026-04-07: Code review — revalidate `cms-pages` khi restore ảnh hưởng trang đã/đang published; dọn export thừa.

---

## Previous story intelligence

- **9.4** [Source: `9-4-media-picker-reuse-uploaded-files-fr-35.md`]: pattern `adminFetch`, toast tiếng Việt, Medusa UI `Drawer`; giới hạn query param (chống abuse) — áp dụng tương tự nếu `GET revisions` có pagination/limit.
- **9.2:** nhấn mạnh message lỗi **tiếng Việt**, không lộ stack cho admin.

## Project context reference

- [Source: `_bmad-output/project-context.md`] — Medusa **2.13.1**, module `store_cms`, `STORE_CMS_MODULE`, route dưới `src/api/admin/custom/`.

---

_Ultimate context engine analysis completed — comprehensive developer guide created._
