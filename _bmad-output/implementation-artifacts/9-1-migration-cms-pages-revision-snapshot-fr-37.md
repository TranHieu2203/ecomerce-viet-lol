# Story 9.1: Migration `cms_pages` + revision / snapshot (FR-37)

**Story Key:** `9-1-migration-cms-pages-revision-snapshot-fr-37`  
**Epic:** 9 — CMS vận hành & nội dung tĩnh (Wave 3)  
**Status:** review

> **Phạm vi:** chỉ **schema + model Medusa module `store-cms` + migration** (và cập nhật snapshot MikroORM nếu repo dùng). **Không** implement Admin/Store API (story **9.2**), **không** UI (9.3), **không** logic prune/restore (9.5) — nhưng schema revision phải **đủ** để 9.2/9.5 ghi/đọc snapshot.

---

## Story

Là **kỹ sư backend**,  
tôi muốn **bảng (hoặc JSON có version) cho trang tĩnh và cơ chế lưu N bản gần nhất**,  
để **FR-30** (trang CMS) và **FR-37** (lịch sử / hoàn tác).

---

## Acceptance Criteria

1. **Bảng trang CMS (`store_cms_page` — ADR-12):** sau khi chạy migration, tồn tại entity với ít nhất các trường logic:
   - `id` (PK, text/uuid — **khớp** convention các model hiện có trong module, ví dụ `store_banner_slide`),
   - `slug` **duy nhất**, validate format gợi ý kiến trúc: `^[a-z0-9-]+$` (enforce ở service/API story sau; migration: unique index + cột text),
   - `title` **JSONB** `{ "vi", "en" }` (bắt buộc đủ key theo quy ước CMS repo),
   - `body` — **một** kiểu đã chốt trong Dev Notes (text hoặc jsonb), nullable nếu draft rỗng được phép,
   - `status` chỉ nhận giá trị **`draft` | `published`** (Postgres: `text` + check constraint hoặc enum — nhất quán với cách team đã làm),
   - `published_at` timestamptz nullable,
   - `created_at` / `updated_at` / `deleted_at` nếu module dùng soft-delete giống `store_banner_slide`.
2. **Bảng revision (`store_cms_revision` — ADR-16):** migration tạo bảng với:
   - `id` PK,
   - `entity_type` text (chuẩn bị giá trị: `settings` | `nav` | `page` | `banner` — có thể ràng buộc CHECK hoặc để text tự do tạm thời nếu cần linh hoạt seed),
   - `entity_id` text **nullable** (page thì gắn id trang; settings có thể null hoặc id singleton — ghi rõ convention trong Dev Notes),
   - `payload_snapshot` **JSONB** không null,
   - `created_at` timestamptz,
   - `actor_user_id` text nullable (chuẩn bị audit; 9.2+ mới ghi giá trị).
3. **Index / hiệu năng:** index hợp lý để sau này list revision theo `entity_type` + `entity_id` + `created_at` DESC (story 9.5); ít nhất composite index hoặc hai index được document trong Dev Notes.
4. **Đăng ký module:** thêm **model** vào `apps/backend/src/modules/store-cms` và **`MedusaService({ ... })`** trong `service.ts` giống `StoreBannerSlide` / `CmsSetting` — để `db:generate` / migration flow Medusa nhất quán.
5. **Không phá môi trường đã seed:** migration **additive**; `down()` rollback được (drop bảng hoặc revert cột theo chuẩn file migration lân cận).
6. **Kiểm thử:** ít nhất một test **unit** hoặc **integration:modules** xác nhận module load được và/hoặc schema tồn tại — khớp `TEST_TYPE` và `testMatch` trong `apps/backend/package.json` (xem `project-context.md`).

---

## Tasks / Subtasks

- [x] Thêm model **`store_cms_page`** (`models/store-cms-page.ts` hoặc tên file đồng bộ kebab-case với bảng).
- [x] Thêm model **`store_cms_revision`** (`models/store-cms-revision.ts`).
- [x] Tạo file migration mới trong `apps/backend/src/modules/store-cms/migrations/` (timestamp sau migration mới nhất hiện có; cập nhật `.snapshot-store-cms.json` nếu workflow generate yêu cầu).
- [x] Cập nhật **`service.ts`**: include cả hai model trong `MedusaService({ ... })`.
- [x] (Tuỳ chọn, khuyến nghị) Seed idempotent **0–N** trang mẫu slug gợi ý kiến trúc (`gioi-thieu`, …) — **chỉ** nếu story/time cho phép; nếu không, ghi “defer” vào Completion Notes để 9.2/seed riêng xử lý.
- [x] Test theo chuẩn repo.

---

## Dev Notes

### Kiến trúc bắt buộc

- **Trang CMS:** [Source: `_bmad-output/planning-artifacts/architecture.md` — §4.6 ADR-12] — slug unique, title JSON vi/en, body, status draft|published, `published_at`, timestamps.
- **Revision:** [Source: `architecture.md` — §4.7 ADR-16] — snapshot theo lần save quan trọng; restore sau này = transaction ghi đè + revision mới (9.5). Giới hạn **N bản** (ví dụ 20) là **logic ứng dụng / job** — không bắt buộc trong migration 9.1, nhưng thiết kế bảng phải cho phép query + prune theo entity.
- **Module:** `STORE_CMS_MODULE = "store_cms"`, đường dẫn `apps/backend/src/modules/store-cms` — [Source: `_bmad-output/project-context.md`].
- **Stack:** Medusa **2.13.1**, MikroORM migrations trong module — bắt chước style [Source: `apps/backend/src/modules/store-cms/migrations/Migration20260406140000.ts`].

### Chốt kỹ thuật (tránh lệch story sau)

- **`body`:** kiến trúc cho phép **text hoặc jsonb**. Chốt **một** kiểu trong implementation (vd. `text` cho HTML/Markdown sau này sanitize ở API layer) và ghi vào Completion Notes — **9.3** rich text sẽ bám theo.
- **`entity_id` cho `entity_type: "page"`:** dùng **id** khóa chính của `store_cms_page`. Với `settings` có thể dùng id singleton `cms` hoặc null — chọn một convention và document.

### Phụ thuộc & không làm

- **Phụ thuộc:** Epic 8 (nav/settings) đã ổn; không cần đổi `nav_tree`.
- **Không** thêm route `src/api/...` trong 9.1.
- **Không** implement **ADR-13** mở rộng settings (seo, announcement, …) trong story này — thuộc các story 9.2–9.3 nếu migration tách bạch.

### Cross-story (Epic 9)

- **9.2:** CRUD + draft/publish + preview token — cần bảng `store_cms_page`.
- **9.5:** UI lịch sử & restore — cần `store_cms_revision` + query index.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 9, Story 9.1]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — ADR-12, ADR-16, §5 API cms-pages / cms-revisions]
- [Source: `_bmad-output/project-context.md` — module store-cms, Jest `integration:modules`]
- Pattern model + migration: [Source: `apps/backend/src/modules/store-cms/models/store-banner-slide.ts`], [Source: `apps/backend/src/modules/store-cms/service.ts`]

---

## Dev Agent Record

### Agent Model Used

Cursor Agent (Composer)

### Debug Log References

### Completion Notes List

- Migration **`Migration20260406150000`**: bảng `store_cms_page` (CHECK `status`, unique partial `slug`), `store_cms_revision` (CHECK `entity_type`, index `(entity_type, entity_id, created_at)`). **`body`**: kiểu `text` (sanitize ở story 9.2).
- Snapshot **`.snapshot-store-cms.json`**: đồng bộ sau `medusa db:generate`; file migration auto **`Migration20260406103911`** (có `alter store_cms_settings` nguy hiểm ở `down`) đã **xoá** — giữ migration thủ công an toàn hơn.
- Seed trang mẫu: **defer** tới 9.2 / script seed riêng.
- **Header menu storefront (ngoài phạm vi 9.1):** `getNavMenuPublic` nuốt lỗi → menu rỗng im lặng. Đã thêm **`console.error` trong `NODE_ENV=development`** khi `FetchError` hoặc lỗi khác; nguyên nhân thường gặp: `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` / backend URL, hoặc **`nav_tree` null** (chưa cấu hình Admin), hoặc nhóm menu không có **children** (MegaNav lọc `children.length > 0`).

### File List

- `apps/backend/src/modules/store-cms/models/store-cms-page.ts`
- `apps/backend/src/modules/store-cms/models/store-cms-revision.ts`
- `apps/backend/src/modules/store-cms/migrations/Migration20260406150000.ts`
- `apps/backend/src/modules/store-cms/migrations/.snapshot-store-cms.json`
- `apps/backend/src/modules/store-cms/service.ts`
- `apps/backend/src/modules/store-cms/__tests__/cms-page-status.unit.spec.ts`
- `apps/backend-storefront/src/lib/data/nav-menu.ts` _(hỗ trợ debug menu — không thuộc AC story 9.1)_

---

## Yêu cầu kỹ thuật (guardrails cho dev agent)

| Hạng mục | Yêu cầu |
|----------|---------|
| Phiên bản | Medusa 2.13.1, Node ≥ 20 |
| Vị trí code | `apps/backend/src/modules/store-cms/` |
| i18n JSON | Chỉ `vi` / `en` cho title (và các field JSON tương lai) — không thêm locale thứ ba |
| Migration | Additive; có `down()`; khớp snapshot module nếu dùng |
| Test | `npm run test:integration:modules` hoặc unit từ `apps/backend` theo convention hiện có |

---

## Tuân thủ kiến trúc (tóm tắt)

- **ADR-12:** schema `store_cms_page` đúng bảng mục 4.6.
- **ADR-16:** schema `store_cms_revision` đúng tinh thần mục 4.7 (payload JSONB, entity_type/id, thời điểm, actor).

---

## Thông tin kỹ thuật cập nhật (stack dự án)

- Medusa **2.13.1**, PostgreSQL; module custom đăng ký trong `medusa-config.ts` (đã có).
- Không cần nâng cấp thư viện cho pure migration trừ khi phát hiện lỗi tương thích — ưu tiên bám version đã lock.

---

## Tham chiếu project-context

- Đọc **`_bmad-output/project-context.md`** trước khi sửa code: `STORE_CMS_MODULE`, migration path, Jest `TEST_TYPE`.

---

## Trạng thái hoàn thành story (meta)

- **Status:** review  
- **Ghi chú:** Schema + model + test constants; chạy `npx medusa db:migrate` (hoặc flow deploy) trên môi trường dev trước khi story 9.2.
