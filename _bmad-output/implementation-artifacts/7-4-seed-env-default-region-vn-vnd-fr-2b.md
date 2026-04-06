# Story 7.4: Seed & env mặc định region VN + VND (FR-2b)

**Story Key:** `7-4-seed-env-default-region-vn-vnd-fr-2b`  
**Epic:** 7 — Seed dữ liệu Phụ lục A  
**Status:** done

> Đã triển khai 2026-04-06: env mẫu, README FR-2b, ghi chú seed; `sprint-status.yaml` cập nhật `7-4` + `epic-7` → done.

---

## Story

Là **kỹ sư**,  
tôi muốn **seed và biến môi trường storefront mặc định khớp region `vn` và tiền tệ VND**,  
để **đáp ứng FR-2b / SC-1b**: dev mới clone repo không phải chỉnh tay từng máy; Medusa store default region + currency nhất quán với PRD.

---

## Acceptance Criteria

1. **Given** tài liệu onboarding (README root hoặc `apps/backend` + storefront); **When** dev đọc hướng dẫn setup; **Then** có đoạn rõ **bắt buộc/khuyến nghị** set `NEXT_PUBLIC_DEFAULT_REGION=vn` (hoặc tên biến đang dùng) trong `apps/backend-storefront/.env.local` và giải thích map tới **country `vn`** trên Medusa region (không chỉ comment trong `.env.example` mà không hướng dẫn copy).
2. **Given** file mẫu env ở **repo root** `.env.example`; **When** copy sang storefront; **Then** block storefront liệt kê `NEXT_PUBLIC_DEFAULT_REGION=vn` **không comment** (hoặc có dòng active + comment giải thích) và trỏ tới cùng semantic với code trong `@lib/data/regions.ts`.
3. **Given** DB sạch (hoặc chỉ có dữ liệu demo Medusa chưa có region VND); **When** chạy seed chuẩn dự án (`pnpm --filter backend seed` hoặc script tương đương trong `apps/backend/package.json`); **Then** tồn tại region **Vietnam** với `currency_code` **vnd**, `countries` chứa **`vn`**, **store** có `default_region_id` trỏ region đó, **supported_currencies** có **vnd** là **default** (đã có logic trong `seed.ts` — story xác nhận không regress và bổ sung test/doc nếu thiếu).
4. **Given** storefront chạy với `.env.local` đúng mẫu; **When** mở `/vi` (hoặc route `[countryCode]` mặc định); **Then** `getRegion` / PLP resolve được region VND (không `null` do map country) — ít nhất kiểm chứng thủ công hoặc ghi rõ bước verify trong README.
5. **Given** không có file mẫu env trong `apps/backend-storefront` (hiện chỉ có `.env.local` local); **When** hoàn story; **Then** có **`apps/backend-storefront/.env.example`** (hoặc cập nhật root `.env.example` đủ để thay thế) chứa tối thiểu: `MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, **`NEXT_PUBLIC_DEFAULT_REGION=vn`**, `REVALIDATE_SECRET` (placeholder) — khớp pattern bảo mật (không commit secret thật).

---

## Tasks / Subtasks

- [x] **Rà soát `seed.ts`** (AC: #3)  
  - [x] Xác nhận logic VN/VND + `default_region_id`; bổ sung comment FR-2b tại `countries = ["vn"]`.  
- [x] **Env mẫu** (AC: #2, #5)  
  - [x] Root `.env.example`: block storefront với dòng active `NEXT_PUBLIC_DEFAULT_REGION=vn` + mô tả FR-2b.  
  - [x] Tạo `apps/backend-storefront/.env.example` (placeholder, không secret thật).  
- [x] **README** (AC: #1, #4)  
  - [x] Mục “Mặc định VN / VND (FR-2b)” + bước verify `curl /store/regions`.  
- [ ] **Verify thủ công** (AC: #4) — dev chạy local  
  - [ ] `curl` + mở `/vi` sau seed.  
- [ ] **Test tự động** — không thêm (README đủ theo story).

---

## Dev Notes

### Bối cảnh hiện trạng (đừng làm lại từ đầu)

- `apps/backend/src/scripts/seed.ts` đã: `countries = ["vn"]`, tạo/reuse region **VND**, `default_region_id` trên store, `supported_currencies` với **vnd** default + usd. [Source: `apps/backend/src/scripts/seed.ts`]  
- Storefront: `MEDUSA_REGION_COUNTRY = process.env.NEXT_PUBLIC_DEFAULT_REGION || "vn"` trong `getRegion`. [Source: `apps/backend-storefront/src/lib/data/regions.ts`]  
- Root `.env.example` có `# NEXT_PUBLIC_DEFAULT_REGION=vn` nhưng **đang comment** — story cần làm nổi bật và đồng bộ mẫu storefront. [Source: `.env.example`]

### Ràng buộc kiến trúc / project-context

- Segment URL storefront là **`[countryCode]`** nhưng semantic locale `vi`/`en`; **map Medusa region** dùng **ISO country** `vn` qua `NEXT_PUBLIC_DEFAULT_REGION`. [Source: `_bmad-output/project-context.md`]  
- PRD: **FR-2b**, **SC-1b** — region gắn `vn`, tiền tệ VND. [Source: `_bmad-output/planning-artifacts/prd.md`]

### File dự kiến chạm

| Khu vực | File |
|--------|------|
| Env mẫu | `.env.example`, `apps/backend-storefront/.env.example` (mới) |
| Tài liệu | `README.md` (root) |
| Seed (chỉ khi cần sửa) | `apps/backend/src/scripts/seed.ts` |

### Testing

- Thủ công: seed trên DB sạch → `GET /store/regions` (hoặc Admin) → Vietnam + VND; storefront `pnpm dev` + `/vi`.  
- Backend: `npm run test:unit` nếu thêm util parse; không bắt buộc mở rộng suite nếu chỉ doc/env.

### Project Structure Notes

- Giữ **idempotent** seed — không phá upsert handle/SKU đã có ở epic 7.1–7.3.  
- Không đổi tên folder `[countryCode]` trong story này.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 7.4]  
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR-2b, SC-1b]  
- [Source: `apps/backend-storefront/src/lib/data/regions.ts`]  
- [Source: `apps/backend/src/scripts/seed.ts`]

---

## Dev Agent Record

### Agent Model Used

Cursor agent (implementation theo story 7.4).

### Debug Log References

—

### Completion Notes List

- Seed không đổi hành vi — chỉ comment FR-2b.  
- Không commit `.env.local`; chỉ `.env.example` mới trong storefront.

### File List

- `.env.example` (root)  
- `apps/backend-storefront/.env.example`  
- `README.md`  
- `apps/backend/src/scripts/seed.ts`  
- `_bmad-output/implementation-artifacts/sprint-status.yaml`  
- `_bmad-output/implementation-artifacts/7-4-seed-env-default-region-vn-vnd-fr-2b.md`
