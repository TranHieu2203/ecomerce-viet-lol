# Story 9.4: Media picker — chọn file đã upload (FR-35)

**Story Key:** `9-4-media-picker-reuse-uploaded-files-fr-35`

**Story ID:** 9.4

**Epic:** 9 — CMS vận hành & nội dung tĩnh (Wave 3)

**Status:** done

**Phụ thuộc:** **9.3** (màn Storefront CMS + `SiteContentAdr13Section` có `og_image_file_id`; banner + logo dùng `ImageUploadField` trong `storefront-cms/page.tsx`). **Không** làm story **9.5** (history/restore), **9.6** (storefront route). **Không** thêm locale thứ ba.

---

## Story

Là **quản trị viên**,  
tôi muốn **gắn lại ảnh đã có cho logo / slide banner / ảnh OG mà không bắt buộc upload trùng file mỗi lần**,  
để **FR-35** và giảm thời gian vận hành.

---

## Acceptance Criteria

1. **Ràng buộc Medusa File Module (bắt buộc đọc trước khi code):** Trong `@medusajs/file`, `listAndCountFiles` / `listFiles` **chỉ được gọi khi filter theo `id`** — không có list “toàn bộ file trên disk/S3” qua service chuẩn. Story này **không** yêu cầu provider storage tự liệt kê; thay vào đó dùng một trong hai hướng đã chốt dưới đây (ưu tiên **1a + 1b**).

2. **Backend `GET /admin/custom/cms-media-library` (tên path có thể đổi nhưng phải document trong Completion Notes):**
   - **Auth:** giống các route admin custom hiện có (cookie/session admin).
   - **1a — Tập ảnh “đã dùng trong CMS”:** Truy vấn **distinct** các `file_id` không rỗng từ:
     - `store_cms_settings.logo_file_id`, `store_cms_settings.og_image_file_id`
     - `store_banner_slide.image_file_id` (các bản chưa xóa mềm nếu có `deleted_at`)
   - Với mỗi id, dùng `req.scope.resolve(Modules.FILE)` kiểu `IFileModuleService`, gọi `retrieveFile(id)` để lấy **`id` + `url`** (và các field phụ trợ UI nếu DTO mở rộng — không bịa field).
   - Trả JSON dạng `{ files: Array<{ id: string; url: string }> }` (hoặc tương đương ổn định). Thứ tự: gợi ý **mới nhất trước** nếu có thể suy ra từ `updated_at` entity chứa `file_id` (chốt một quy tắc sort trong Dev Notes).

3. **1b — “Gần đây” trong phiên Admin (bổ sung UX):** Sau mỗi lần upload thành công qua helper hiện có (`adminUploadFiles` trong `storefront-cms/page.tsx`), **đẩy `file_id` vào danh sách tạm** (ví dụ `sessionStorage` key cố định, tối đa ~30 id, dedupe). Component picker **gộp** id từ **1a** và **1b**; với id chỉ có trong 1b, gọi thêm một endpoint nhẹ **`GET /admin/custom/cms-media-library/resolve?id=`** *hoặc* batch resolve trong cùng response — **chốt một** cách để không N+1 request không cần thiết (ưu tiên một round-trip).

4. **Admin UI — component tái sử dụng:** Trích `ImageUploadField` thành **`MediaPickerField`** (hoặc tên tương đương) trong file share (ví dụ `apps/backend/src/admin/routes/storefront-cms/media-picker-field.tsx`) dùng chung cho:
   - Logo (`logo_file_id`) — mục “Cấu hình chung” trong `storefront-cms/page.tsx`
   - Mỗi slide banner (`image_file_id`) — cùng file `page.tsx`
   - Ảnh OG (`og_image_file_id`) — `site-content-adr13-section.tsx`  
   Hành vi: giữ **upload mới** + ô nhập/copy **file id** thủ công; thêm **“Chọn từ thư viện”** mở **Drawer/Modal** (Medusa UI): danh sách thumbnail (dùng `url` từ API), chọn một dòng → điền `file_id` vào field; **toast tiếng Việt** khi lỗi load (NFR-9).

5. **Trợ giúp ngắn (FR-36 tối thiểu):** Một dòng `Text`/`Hint` tiếng Việt dưới picker: thư viện gồm ảnh **đã từng gắn vào CMS hoặc vừa upload trong phiên này** (đúng với hành vi 1a+1b).

6. **Kiểm thử:** Ít nhất **unit test** cho pure helper (nếu tách: merge + dedupe id, sort) hoặc test nhỏ cho parser query — theo convention `*.unit.spec.ts` trong `apps/backend`. Integration HTTP **không bắt buộc** nếu ghi rõ lý do giống các story CMS trước (infra DB).

---

## Tasks / Subtasks

- [x] Đọc `IFileModuleService` + `Modules.FILE` — xác nhận không dùng `listFiles` để “browse all”.
- [x] Service store-cms hoặc route: method/query gom distinct `file_id` từ settings + banner slides (soft-delete aware).
- [x] `GET /admin/custom/cms-media-library` (+ optional `resolve` hoặc mở rộng response) — pattern middleware giống `apps/backend/src/api/admin/custom/cms-settings/route.ts`.
- [x] `MediaPickerField` + tích hợp `sessionStorage` sau `adminUploadFiles`.
- [x] Thay thế `ImageUploadField` tại logo, slides, OG.
- [x] Unit test + manual QA checklist ngắn trong Completion Notes.

### Review Findings

- [x] [Review][Patch] Chuẩn hóa `updated_at` khi parse ra `NaN` (sort ổn định) — [`apps/backend/src/modules/store-cms/service.ts`] — đã sửa 2026-04-07.
- [x] [Review][Patch] Giới hạn độ dài `session_ids` query (chống lạm dụng nhiều `retrieveFile`) — [`apps/backend/src/api/admin/custom/cms-media-library/route.ts`] — đã sửa 2026-04-07.
- [x] [Review][Defer] Latency tuần tự `retrieveFile` theo từng id — [`route.ts`] — deferred, ghi `deferred-work.md`.

---

## Dev Notes

### Kiến trúc & PRD

- **ADR-15**, **§6 Media pipeline**, **§8 File picker** — [Source: `_bmad-output/planning-artifacts/architecture.md`].
- **FR-35** — [Source: `_bmad-output/planning-artifacts/prd.md`].
- UX: **`MediaPickerField`** — [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` §15.5].

### Code đang có (reuse)

- Upload: `adminUploadFiles`, `ImageUploadField` — [Source: `apps/backend/src/admin/routes/storefront-cms/page.tsx`].
- OG field state: `ogFileId` — [Source: `apps/backend/src/admin/routes/storefront-cms/site-content-adr13-section.tsx`].
- File module resolve: `container.resolve(Modules.FILE) as IFileModuleService` — [Source: `apps/backend/src/utils/banner-derivatives.ts`].
- Models: `logo_file_id`, `og_image_file_id` — [Source: `apps/backend/src/modules/store-cms/models/store-cms-settings.ts`]; `image_file_id` — [Source: `apps/backend/src/modules/store-cms/models/store-banner-slide.ts`].

### Tránh làm

- Không giả định `GET /admin/uploads` trả danh sách (route core hiện chỉ thấy **POST** upload trong build Medusa đang dùng).
- Không mở Store API public cho toàn bộ thư viện file.
- Không thêm bảng persistence “mọi file từng upload” trừ khi product yêu cầu — MVP là 1a+1b; mở rộng ghi vào `deferred-work.md` nếu cần.

### Testing

- [Source: `_bmad-output/project-context.md` — Jest, `npm run test:unit` từ `apps/backend`].

---

## Change Log

- 2026-04-07: Triển khai FR-35 — API `GET /admin/custom/cms-media-library`, `listCmsReferencedImageFileIdsOrdered`, `MediaPickerField` + `sessionStorage`, unit test `cms-media-library`.

---

## Dev Agent Record

### Agent Model Used

Cursor Agent (Composer)

### Debug Log References

### Completion Notes List

- **API:** `GET /admin/custom/cms-media-library` — query `session_ids` (comma-separated) gộp với file id từ DB; sort DB theo `max(updated_at)` theo từng `file_id` (settings.logo, settings.og, slides.image).
- **Session:** `cms_media_recent_upload_ids` trong `sessionStorage`, tối đa 30; đẩy id sau mỗi upload thành công trong `MediaPickerField`.
- **UI:** `Drawer` danh sách thumbnail; logo + slide + OG dùng `MediaPickerField`. Logic upload tách `admin-upload.ts` dùng chung.
- **QA thủ công:** Vào Admin Storefront CMS — upload ảnh, mở “Chọn từ thư viện”, chọn ảnh đã gắn; kiểm tra OG trong SEO & nội dung site.
- `npm run test:unit` (toàn bộ) pass; `npm run build` backend + admin pass.
- **Code review 2026-04-07:** patch NaN timestamp + cap `session_ids` query; defer batch retrieve.

### File List

- `apps/backend/src/modules/store-cms/service.ts`
- `apps/backend/src/utils/cms-media-library.ts`
- `apps/backend/src/utils/__tests__/cms-media-library.unit.spec.ts`
- `apps/backend/src/api/admin/custom/cms-media-library/route.ts`
- `apps/backend/src/admin/routes/storefront-cms/admin-upload.ts`
- `apps/backend/src/admin/routes/storefront-cms/media-picker-field.tsx`
- `apps/backend/src/admin/routes/storefront-cms/page.tsx`
- `apps/backend/src/admin/routes/storefront-cms/site-content-adr13-section.tsx`

---

## Previous story intelligence

- File story **9.3** chưa có trong `implementation-artifacts`; codebase đã có `SiteContentAdr13Section` và editor CMS — coi **9.3** là đã hoàn thành trên nhánh hiện tại. Pattern admin: `adminFetch`, toast, Medusa UI — giữ nhất quán.
- **9.2** [Source: `9-2-admin-store-cms-pages-crud-draft-publish-preview.md`]: nhấ mạnh message lỗi **tiếng Việt**, không lộ stack cho user admin.

## Git intelligence (gần đây)

- Repo có ít commit tổng hợp; ưu tiên đối chiếu **file thực tế** trong `apps/backend/src/admin/routes/storefront-cms/` hơn lịch sử git.

## Project context reference

- [Source: `_bmad-output/project-context.md`] — Medusa **2.13.1**, module `store_cms`, admin routes dưới `src/api/admin/custom/`.

---

_Ultimate context engine analysis completed — comprehensive developer guide created._
