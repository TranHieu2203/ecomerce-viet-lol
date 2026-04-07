---
title: 'Hiển thị link Zalo/MXH từ Admin lên storefront'
type: 'feature'
created: '2026-04-07'
status: 'done'
baseline_commit: 'c1d6b172221e2e10bb81077c17bdf9eb4c63a389'
context:
  - _bmad-output/project-context.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Admin đã có phần thiết lập liên hệ/MXH (bao gồm Zalo) trong CMS settings (`footer_contact.social`) nhưng storefront chưa hiển thị, nên người dùng không thấy kênh liên hệ trên trang chủ.

**Approach:** Reuse dữ liệu `footer_contact.social` từ Store API `/store/custom/cms-settings`, render danh sách link MXH ở **header** và **footer** của storefront, với fallback label theo locale và không làm hỏng layout khi thiếu dữ liệu.

## Boundaries & Constraints

**Always:**
- Nguồn dữ liệu: `store_cms_settings.footer_contact.social` (đã validate bởi backend `parseFooterContact`).
- Hiển thị ở cả **header** (nav bar) và **footer**.
- Không yêu cầu thay đổi schema/DB; nếu thiếu link thì UI ẩn khối MXH.
- Link mở tab mới (`target="_blank"`) và `rel="noreferrer noopener"`.

**Ask First:**
- Merge “tính năng Zalo/MXH” vào nhánh tổng hợp sau khi xong (theo yêu cầu user). Nếu phát sinh conflict lớn khi merge, sẽ tạm dừng để xử lý theo hướng ít rủi ro nhất.

**Never:**
- Không commit/push thêm nếu user không yêu cầu (ngoại trừ merge nội bộ theo yêu cầu “gộp vào 1 nhánh”).
- Không hardcode link MXH trong storefront (phải lấy từ CMS settings).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Có MXH | `cms.footer_contact.social` là mảng có 1+ item hợp lệ | Header + Footer hiển thị list link theo thứ tự | Bỏ qua item thiếu `url` (store API đã validate, nhưng storefront vẫn defensive) |
| Không có MXH | `footer_contact` null / `social` rỗng | Không render khối MXH | N/A |
| Label thiếu | item chỉ có `url` không có `label` | Dùng label mặc định theo hostname (vd `zalo.me`, `facebook.com`) hoặc `m.footer.socialFallback` | N/A |
| URL không phải http(s) | input xấu (không nên xảy ra) | Không render item đó | Không throw trong UI |

</frozen-after-approval>

## Code Map

- `apps/backend/src/admin/routes/storefront-cms/site-content-adr13-section.tsx` -- Admin UI nhập MXH vào `footer_contact.social`
- `apps/backend/src/utils/cms-settings-adr13.ts` -- validate `footer_contact.social`
- `apps/backend/src/api/store/custom/cms-settings/route.ts` -- public Store API trả `footer_contact`
- `apps/backend-storefront/src/lib/data/cms.ts` -- fetch/parse `footer_contact`
- `apps/backend-storefront/src/modules/layout/templates/nav/index.tsx` -- header/nav (vị trí hiển thị MXH)
- `apps/backend-storefront/src/modules/layout/templates/footer/index.tsx` -- footer (vị trí hiển thị MXH)

## Tasks & Acceptance

**Execution:**
- [x] `apps/backend-storefront/src/lib/data/cms.ts` -- thêm helper parse `footer_contact.social` thành list `{ href, label }` an toàn theo locale -- tránh lặp logic ở header/footer.
- [x] `apps/backend-storefront/src/modules/layout/templates/nav/index.tsx` -- render các link MXH (compact) ở header (cạnh LocaleSwitcher/Cart) -- giúp thấy kênh liên hệ ngay trên trang chủ.
- [x] `apps/backend-storefront/src/modules/layout/templates/footer/index.tsx` -- render block “Liên hệ/MXH” ở footer dùng cùng helper -- nhất quán với cấu hình admin.
- [x] Merge: tạo 1 nhánh tổng hợp và merge nhánh hiện tại + nhánh tính năng MXH vào đó -- để có đủ toàn bộ tính năng.

**Acceptance Criteria:**
- Given admin đã lưu `footer_contact.social` có Zalo/Facebook, when mở `http://localhost:8000/vi`, then header và footer hiển thị các link đó và click mở tab mới.
- Given `footer_contact.social` rỗng, when mở trang chủ, then không có khoảng trống/khối MXH.
- Given item MXH không có `label`, when render, then vẫn có text label hợp lý (fallback) và UI không crash.
- Given đã hoàn tất, when nhìn git branches, then có **1 nhánh tổng hợp** chứa toàn bộ tính năng (seed/menu fixes + MXH header/footer).

## Spec Change Log

## Verification

**Commands:**
- `cd apps/backend-storefront; npx tsc --noEmit` -- expected: exit 0

**Manual checks (if no CLI):**
- Admin: cập nhật Storefront CMS → SEO & nội dung site (ADR-13) → MXH #1 URL `https://zalo.me/...` → Save.
- Storefront: mở `/vi` và confirm header + footer hiện link.

