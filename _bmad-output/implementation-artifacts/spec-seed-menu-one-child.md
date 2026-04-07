---
title: 'Seed lại dữ liệu + rút gọn menu 1 con'
type: 'feature'
created: '2026-04-07'
status: 'done'
baseline_commit: '23ecee85b1ab6c52d7eaf920181eea3ad6f1724a'
context:
  - _bmad-output/project-context.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Sau khi cập nhật script seed (WEBTAYA/Sales Kit) cần chạy lại để DB có đủ data. Ngoài ra menu hiện có trường hợp chỉ có 1 menu con làm UI rườm rà (menu cha và con gần như trùng nhau).

**Approach:** Chạy lại seed Sales Kit để tái tạo catalog/CMS đầy đủ. Sửa UI menu (desktop + mobile) để khi 1 nhóm chỉ có đúng 1 item con thì không mở submenu/accordion; thay vào đó click nhóm sẽ điều hướng thẳng tới item con.

## Boundaries & Constraints

**Always:**
- Seed Sales Kit vẫn phải giữ cơ chế guard `SEED_SALES_KIT_ALLOW`/`seed:sales-kit:confirm` vì có thao tác wipe dữ liệu.
- Không thay đổi shape payload menu từ backend (`ResolvedNavGroup` không có `href`), chỉ thay đổi cách render ở storefront.
- Giữ hành vi menu hiện tại cho nhóm có 2+ children.

**Ask First:**
- Không có.

**Never:**
- Không tự động tạo commit/push nếu người dùng chưa yêu cầu.
- Không thay đổi cấu trúc nav tree CMS (schema/DB) chỉ để phục vụ UI.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Desktop group nhiều con | `group.children.length >= 2` | MegaNav hiển thị button + dropdown như hiện tại | N/A |
| Desktop group 1 con | `group.children.length === 1` | MegaNav hiển thị link (label của group), click đi tới `child.href`, không dropdown | Nếu thiếu `href`/child null → fallback giữ như cũ (không crash) |
| Mobile group nhiều con | `group.children.length >= 2` | SideMenu dùng accordion mở/đóng như hiện tại | N/A |
| Mobile group 1 con | `group.children.length === 1` | SideMenu hiển thị link cho group, click đi tới `child.href` và đóng menu | Nếu thiếu `href`/child null → fallback giữ accordion như cũ |

</frozen-after-approval>

## Code Map

- `apps/backend/src/scripts/seed-sales-kit.ts` -- seed Sales Kit (wipe + seed products/collections/categories/CMS)
- `apps/backend-storefront/src/modules/layout/components/mega-nav/index.tsx` -- menu desktop (MegaNav)
- `apps/backend-storefront/src/modules/layout/components/side-menu/index.tsx` -- menu mobile drawer (SideMenu)
- `apps/backend-storefront/src/lib/nav/nav-types.ts` -- type `ResolvedNavGroup/Child`

## Tasks & Acceptance

**Execution:**
- [x] `apps/backend-storefront/src/modules/layout/components/mega-nav/index.tsx` -- nếu group có đúng 1 child thì render `LocalizedClientLink` tới `child.href` thay vì button+dropdown -- giảm 1 cấp click và tránh submenu thừa.
- [x] `apps/backend-storefront/src/modules/layout/components/side-menu/index.tsx` -- nếu group có đúng 1 child thì render link (đóng menu khi navigate) thay vì accordion -- UI mobile gọn và đúng intent.
- [x] `apps/backend/src/scripts/seed-sales-kit.ts` -- giữ nguyên thay đổi seed categories đã làm; chạy lại `seed:sales-kit:confirm` để DB có đủ data -- đảm bảo catalog/CMS đúng.

**Acceptance Criteria:**
- Given đã bật guard seed (confirm/ENV), when chạy `npm run seed:sales-kit:confirm` trong `apps/backend`, then seed hoàn tất và có đủ products/collections/categories/CMS như script.
- Given một nav group chỉ có 1 child, when user click vào label nhóm ở desktop hoặc mobile, then điều hướng thẳng tới trang của child và không hiện submenu/accordion.
- Given một nav group có từ 2 child trở lên, when user dùng menu, then hành vi dropdown/accordion giữ nguyên.

## Spec Change Log

## Verification

**Commands:**
- `cd apps/backend; npm run seed:sales-kit:confirm` -- expected: hoàn tất không lỗi; data được seed lại.
- `cd apps/backend-storefront; npx tsc --noEmit` -- expected: exit 0 (không lỗi type sau khi sửa menu components).

