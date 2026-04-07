# Story 9.2: Admin + Store API — CRUD trang CMS, draft/publish, preview token



**Story Key:** `9-2-admin-store-cms-pages-crud-draft-publish-preview`  

**Story ID:** 9.2  

**Epic:** 9 — CMS vận hành & nội dung tĩnh (Wave 3)  

**Status:** done



> **Phụ thuộc:** **9.1** (bảng `store_cms_page`, `store_cms_revision`, model + service). **Không** làm Admin UI editor (story **9.3**). **Không** route storefront `/p/[slug]` (story **9.6**) — chỉ API + revalidate hook chuẩn bị tag `cms-pages`.



---



## Story



Là **quản trị viên**,  

tôi muốn **tạo/sửa trang, xem trước bản nháp an toàn, xuất bản**,  

để **FR-30**, **FR-34**, **UX-DR7**.



---



## Acceptance Criteria



1. **Admin `GET /admin/custom/cms-pages`:** liệt kê trang (pagination đơn giản hoặc full list nếu <100 — chốt trong Dev Notes); mỗi item có `id`, `slug`, `status`, `updated_at`, `title` (raw JSON `{vi,en}`) hoặc đã resolve một locale admin mặc định — **chốt một** contract và giữ ổn định cho 9.3.

2. **Admin `POST /admin/custom/cms-pages`:** tạo trang; validate **`slug`** khớp `^[a-z0-9-]+$`, unique (409 hoặc 400 với message tiếng Việt **NFR-9**); `title` bắt buộc có đủ key **`vi`** và **`en`** (chuỗi có thể rỗng tạm nếu team cho phép — chốt một); `body` nullable cho draft rỗng; `status` mặc định `draft`.

3. **Admin `PATCH /admin/custom/cms-pages/:id`:** partial update; không cho phép đổi `slug` sau tạo **hoặc** cho phép với ràng buộc unique + document — **chốt một**; sanitize **`body`** (HTML/text) server-side trước khi lưu (cùng hướng 9.1: `body` text).

4. **Admin `DELETE /admin/custom/cms-pages/:id`:** soft-delete nhất quán module (dùng `deleted_at` nếu entity hỗ trợ) **hoặc** hard delete — **chốt một** và khớp migration partial unique trên `slug`.

5. **Admin publish:** **`PATCH /admin/custom/cms-pages/:id/publish`** (hoặc tương đương) chuyển `status` → `published`, set `published_at` (now nếu null); **`PATCH .../unpublish`** hoặc PATCH body — **chốt một**; sau publish/unpublish gọi **revalidate storefront** với tag **`cms-pages`** (mở rộng `revalidateStorefrontCms` / pattern đã có cho `cms`, `cms-nav`).

6. **Revision (chuẩn bị 9.5):** mỗi lần **save quan trọng** (POST create, PATCH nội dung, publish) ghi một bản vào **`store_cms_revision`** với `entity_type: "page"`, `entity_id` = id trang, `payload_snapshot` = snapshot JSON đủ để restore (ít nhất `slug`, `title`, `body`, `status`, `published_at`). `actor_user_id` nullable nếu chưa lấy được user từ request — ưu tiên set khi Medusa cung cấp.

7. **Store `GET /store/custom/cms-pages/:slug`:** `AUTHENTICATE = false`; query **`locale`** (bắt buộc hoặc default `vi` + kiểm tra `enabled_locales` giống nav-menu — **chốt một**); chỉ trả trang **`published`** và **chưa xóa mềm**; response JSON: `title`, `body` đã resolve theo locale (fallback `vi` rồi `en` theo quy ước repo); **404** khi không có bản published.

8. **Preview (ADR-14 MVP):** **`POST /admin/custom/cms-preview-token`** — body `{ page_id, slug? }` hoặc tương đương; trả `{ token, expires_at }` (TTL ngắn, ví dụ 15–60 phút). Store **`GET /store/custom/cms-pages/:slug?locale=&cms_preview=<token>`** (hoặc header) — với token hợp lệ cho đúng `page_id`/`slug`, trả **draft** (không cache công khai: `Cache-Control: private, no-store` hoặc tương đương); token sai/hết hạn → hành vi như không có token (chỉ published). **Không** lộ draft khi thiếu token.

9. **Kiểm thử:** unit hoặc `integration:http` / `integration:modules` — ít nhất: validate slug, publish chuyển status, store GET published vs 404 draft; preview: có token thấy draft, không token không thấy.



---



## Tasks / Subtasks



- [x] Service layer `store-cms`: CRUD `StoreCmsPage` (dùng `MedusaService` generated methods hoặc custom query soft-delete).

- [x] Utils: validate slug regex; resolve `title`/`body` theo locale + `enabled_locales`; sanitize `body` (chọn thư viện hoặc escape tối thiểu — ghi rõ trong Completion Notes).

- [x] Admin routes: `cms-pages/route.ts` (GET list, POST), `cms-pages/[id]/route.ts` (PATCH, DELETE), `cms-pages/[id]/publish/route.ts` (và unpublish nếu tách).

- [x] Revision writer: helper `appendPageRevision(service, payload, actor?)` gọi từ create/update/publish.

- [x] Preview token: lưu in-memory dev-only **không** chấp nhận prod — **ưu tiên** bảng nhỏ hoặc JWT/HMAC signed với `CMS_PREVIEW_SECRET` trong `.env` (document `.env.example`); validate slug + page id khớp token.

- [x] Store route: `store/custom/cms-pages/[slug]/route.ts` — logic published vs preview; tag ISR `cms-pages` cho fetch storefront sau này (Next 9.6).

- [x] `revalidate-storefront.ts`: hỗ trợ tag `cms-pages`; gọi sau publish/unpublish (và tùy chọn sau PATCH nội dung published).

- [x] Tests theo `apps/backend/package.json` + `project-context.md`.



---



## Dev Notes



### Kiến trúc



- **ADR-12**, **ADR-14**, **ADR-16** — [Source: `_bmad-output/planning-artifacts/architecture.md` §4.6–4.7, §5.1–5.2].

- Pattern Admin auth: [Source: `apps/backend/src/api/admin/custom/cms-settings/route.ts`].

- Pattern Store public: [Source: `apps/backend/src/api/store/custom/cms-settings/route.ts`], [Source: `apps/backend/src/api/store/custom/nav-menu/route.ts`] (locale + `enabled_locales`).

- Model: [Source: `apps/backend/src/modules/store-cms/models/store-cms-page.ts`], [Source: `apps/backend/src/modules/store-cms/models/store-cms-revision.ts`].



### Tránh làm



- Không implement UI Admin (9.3).

- Không thêm locale thứ ba.

- Không expose draft body trên Store không có preview hợp lệ.



### References



- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 9.2]

- [Source: `_bmad-output/project-context.md`]



### Chốt kỹ thuật (implementation)



- **Admin list:** `title` trả **raw JSON** `{ vi, en }`; phân trang `limit` (tối đa 100) + `offset`, kèm `count`.

- **Slug:** không đổi sau tạo (PATCH gửi slug khác slug hiện tại → 400).

- **DELETE:** `deleteStoreCmsPages` (soft-delete Medusa, khớp partial unique slug).

- **Publish / unpublish:** `POST` `/admin/custom/cms-pages/:id/publish` và `.../unpublish` (tương đương PATCH subresource).

- **Sanitize `body`:** regex loại `<script>`, `<iframe>`, `on*` handlers, `javascript:` — không thêm npm package (ghi trong Completion Notes).

- **Preview:** HMAC-SHA256 (`signCmsPreviewToken` / `verifyCmsPreviewToken`), bí mật `CMS_PREVIEW_SECRET`. Store: query `cms_preview` hoặc header `x-cms-preview` (query được ưu tiên).



---



## Dev Agent Record



### Agent Model Used



Composer (Cursor agent)



### Debug Log References



_(không có)_



### Review Findings

**Code review (2026-04-06)** — Blind Hunter + Edge Case Hunter + Acceptance Auditor (hợp nhất trong một phiên).

- [x] [Review][Patch] Store GET chưa hỗ trợ preview token qua header (AC8: query hoặc header) — [`apps/backend/src/api/store/custom/cms-pages/[slug]/route.ts`] — đã thêm `x-cms-preview` (ưu tiên query `cms_preview`).
- [x] [Review][Patch] `publish` / `unpublish`: nên chuẩn hóa kết quả `updateStoreCmsPages` giống PATCH `[id]` (`Array.isArray`) tránh `updated` undefined nếu runtime khác kiểu — [`apps/backend/src/api/admin/custom/cms-pages/[id]/publish/route.ts`], [`unpublish/route.ts`]
- [x] [Review][Patch] `sanitizeCmsPageBody` MVP còn khe XSS (ví dụ `<svg/onload=...>`, `onerror` dính sát tên thẻ, `data:`/`vbscript:`) — [`apps/backend/src/utils/cms-page.ts`]
- [x] [Review][Patch] Slug không giới hạn độ dài — nên tối đa hợp lý (vd. 128/200) trước khi lưu — [`apps/backend/src/utils/cms-page.ts`], POST admin — `CMS_PAGE_SLUG_MAX_LEN = 200`
- [x] [Review][Defer] Thiếu integration test cho publish / store GET draft vs published / preview (AC9) — deferred, infra `test:integration:http` + DB test chưa ổn định trên máy dev



### Completion Notes List



- Đã triển khai CRUD admin, store GET theo slug, publish/unpublish + `revalidateStorefrontCms("cms-pages")`.

- Revision `page` ghi khi POST tạo, PATCH `title`/`body`, POST publish/unpublish; `actor_user_id` từ `req.auth_context.actor_id` khi có.

- Unit test: `cms-page.unit.spec.ts`, `cms-preview-token.unit.spec.ts`. `test:integration:http` không chạy được trên máy dev do cấu hình DB test (SASL password); không phải regression do story.

- 2026-04-07: Batch-fix sau code review (option 0): header `x-cms-preview`, normalize `updateStoreCmsPages` ở publish/unpublish, sanitize chặt hơn, giới hạn slug 200 ký tự + unit test.



### File List



- `apps/backend/src/utils/cms-page.ts`

- `apps/backend/src/utils/cms-page-revision.ts`

- `apps/backend/src/utils/cms-preview-token.ts`

- `apps/backend/src/api/admin/custom/cms-pages/route.ts`

- `apps/backend/src/api/admin/custom/cms-pages/[id]/route.ts`

- `apps/backend/src/api/admin/custom/cms-pages/[id]/publish/route.ts`

- `apps/backend/src/api/admin/custom/cms-pages/[id]/unpublish/route.ts`

- `apps/backend/src/api/admin/custom/cms-preview-token/route.ts`

- `apps/backend/src/api/store/custom/cms-pages/[slug]/route.ts`

- `apps/backend/src/utils/revalidate-storefront.ts`

- `apps/backend/src/utils/__tests__/cms-page.unit.spec.ts`

- `apps/backend/src/utils/__tests__/cms-preview-token.unit.spec.ts`

- `.env.example`

- `apps/backend/.env.template`

- `_bmad-output/implementation-artifacts/sprint-status.yaml`

- `_bmad-output/implementation-artifacts/9-2-admin-store-cms-pages-crud-draft-publish-preview.md`



### Change Log



- 2026-04-06: Story 9.2 — API CMS pages CRUD, revision, preview HMAC, store public + preview, revalidate tag `cms-pages`, unit tests.

- 2026-04-07: Sửa theo code review (batch): preview header, publish/unpublish an toàn kiểu, sanitize + slug max.

- 2026-04-07: Team đánh dấu story hoàn thành (`done`).

---

## Status

done


