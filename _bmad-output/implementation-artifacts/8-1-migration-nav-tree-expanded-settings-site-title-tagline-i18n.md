# Story 8.1: Migration & entity lưu cây menu + mở rộng settings (site_title, tagline i18n)

**Story Key:** `8-1-migration-nav-tree-expanded-settings-site-title-tagline-i18n`  
**Epic:** 8 — Điều hướng & thương hiệu storefront (Wave 2)  
**Status:** done

> Đã triển khai 2026-04-06: migration + model + defaults service; `medusa db:migrate` chạy OK. API PATCH/GET mở rộng field → story **8.2**. **Không** triển khai API Admin/Store ở story này (thuộc **8.2**). Validation Zod/io-ts chi tiết cho `nav_tree` có thể để 8.2, nhưng **contract JSON** phải khớp `architecture.md` §4.5.

---

## Story

Là **kỹ sư backend**,  
tôi muốn **migration lưu nav tree (tối đa 2 cấp) và trường thương hiệu footer theo kiến trúc**,  
để **FR-29**, **FR-11b**, **FR-27** có nơi persist trước khi làm API và UI.

---

## Acceptance Criteria

1. **Given** bảng singleton `store_cms_settings` đã tồn tại (`id` cố định `cms` qua `CMS_SETTINGS_ID`); **When** chạy migration mới trong `apps/backend/src/modules/store-cms/migrations/`; **Then** thêm cột **`nav_tree`** kiểu **jsonb** nullable (lưu document cây menu theo ADR-11) và **`site_title_i18n`**, **`tagline_i18n`** jsonb nullable (object `{ vi?, en? }` hoặc tương đương — thống nhất một shape trong code comment + Dev Notes).
2. **Given** model `store-cms-settings.ts`; **When** cập nhật `model.define`; **Then** các trường mới map đúng cột; **`site_title`** (text legacy) **giữ nguyên** để giai đoạn chuyển tiếp FR-11b (fallback env/copy cho đến khi UI ghi `site_title_i18n`).
3. **Given** `StoreCmsModuleService.getOrCreateSettings()`; **When** tạo row mới; **Then** `nav_tree` có thể `null` hoặc default `{"version":1,"items":[]}` — **chốt một** và document; không làm vỡ seed/môi trường đã có (migration **additive only**, `IF NOT EXISTS` / `add column if not exists`).
4. **Given** `down()` migration; **When** rollback; **Then** drop column an toàn hoặc document limitation nếu Medusa không khuyến nghị rollback dữ liệu production.
5. **Given** chạy `medusa db:migrate` (hoặc script tương đương) từ `apps/backend`; **When** không có lỗi; **Then** bảng phản ánh schema mới; file snapshot MikroORM (`.snapshot-store-cms.json`) được cập nhật **nếu** workflow team dùng `migration:generate` — không xóa migration cũ.

---

## Tasks / Subtasks

- [x] Migration `Migration20260406140000` — `nav_tree`, `site_title_i18n`, `tagline_i18n` + comment contract.  
- [x] `store-cms-settings.ts` — `model.json().nullable()` cho 3 cột.  
- [x] `getOrCreateSettings()` — `null` cho nav + i18n khi tạo mới.  
- [x] `medusa db:migrate` — module `store_cms` migrated OK.  
- [x] Không thêm route API.

---

## Dev Notes

### Contract `nav_tree` (ADR-11 — bắt buộc khớp khi implement 8.2)

Tham chiếu `architecture.md` mục **4.5**: `version`, `items` (nhóm cấp 1), mỗi nhóm có `label` {vi,en}, `children` với `type: "collection"` + `handle` + `label_override` nullable, hoặc `type: "link"` + `url` + `label` {vi,en}. **Độ sâu tối đa 2** (nhóm → mục); validate độ sâu ở **8.2** khi PATCH.

### Hiện trạng code

- Entity: `apps/backend/src/modules/store-cms/models/store-cms-settings.ts` — hiện có `default_locale`, `enabled_locales`, `logo_file_id`, `site_title`.  
- Service: `getOrCreateSettings()` tạo row `id: cms`.  
- Migration gần nhất mẫu: `Migration20260331120000.ts` (pattern `add column if not exists`).

### Ràng buộc

- **STORE_CMS_MODULE** = `"store_cms"`; đăng ký trong `medusa-config.ts` — không đổi trừ khi kiến trúc yêu cầu.  
- **Không** thêm `store_cms_page` / revision trong 8.1 (Epic 9).  
- ADR-13 còn nhiều field (seo, footer_contact, …) — **8.1 chỉ** `site_title_i18n`, `tagline_i18n` + `nav_tree`; các JSON khác để story sau.

### Testing

- Migrate up/down trên DB dev (nếu down được).  
- Unit test tối thiểu **không bắt buộc** nếu chỉ migration; có thể thêm smoke `listCmsSettings` trả về field mới `undefined/null` hợp lệ.

### Project Structure Notes

```
apps/backend/src/modules/store-cms/
  migrations/MigrationYYYYMMDDHHMMSS.ts  # mới
  models/store-cms-settings.ts             # sửa
  service.ts                               # sửa defaults
```

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 8.1]  
- [Source: `_bmad-output/planning-artifacts/architecture.md` — ADR-11, ADR-13 §4.4–4.5]  
- [Source: `_bmad-output/project-context.md` — module store-cms]  
- [Source: `apps/backend/src/modules/store-cms/`]

---

## Dev Agent Record

### Agent Model Used

Cursor agent (bmad-dev-story).

### Debug Log References

—

### Completion Notes List

- `.snapshot-store-cms.json` chưa chỉnh tay; Medusa migrate không regenerate file này trong lần chạy.

### File List

- `apps/backend/src/modules/store-cms/migrations/Migration20260406140000.ts`  
- `apps/backend/src/modules/store-cms/models/store-cms-settings.ts`  
- `apps/backend/src/modules/store-cms/service.ts`  
- `_bmad-output/implementation-artifacts/sprint-status.yaml`  
- `_bmad-output/implementation-artifacts/8-1-migration-nav-tree-expanded-settings-site-title-tagline-i18n.md`
