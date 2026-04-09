---
title: 'Seed giá đa currency + map locale en → USD region'
type: 'feature'
created: '2026-04-09'
status: 'in-progress'
baseline_commit: '421312304d2bdd3c8bab631f9fe7714901f4b408'
context:
  - '_bmad-output/project-context.md'
  - '_bmad-output/planning-artifacts/architecture.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Hiện storefront `en` và `vi` đang dùng chung region mặc định (`vn`), nên giá luôn theo VND và còn bị seed hard-code 100.000₫. Team muốn `en` hiển thị giá theo USD (region/currency riêng), đồng thời seed giá theo cả VND và USD để trang chủ hiển thị đúng theo region.

**Approach:** Backend seed thêm 1 region USD (country `us`, currency `usd`) và seed product variant prices có đủ `vnd` + `usd` (random theo range). Storefront map locale `en` → lookup region theo country `us` (trong khi `vi` giữ `vn`) để toàn bộ listing/homepage/cart dùng đúng region/currency.

## Boundaries & Constraints

**Always:**
- Giữ URL prefix là locale (`vi`/`en`) như hiện tại; không đổi cấu trúc route `src/app/[countryCode]`.
- `vi` vẫn map về VN/VND như hiện tại (không thay đổi hành vi cho người dùng Việt).
- Seed phải idempotent “hợp lý”: rerun seed không tạo trùng region; nếu region tồn tại thì reuse/update countries/tax region cần thiết.
- Giá hiển thị phải đi qua `calculated_price` (storefront đã dùng `variants.calculated_price`).

**Ask First:**
- Có cần để **cart** bám theo locale (en→USD) hay vẫn pin theo `NEXT_PUBLIC_DEFAULT_REGION`? (Spec này đề xuất bám theo locale để đồng bộ hiển thị.)
- Range random giá USD/VND mong muốn (nếu team có pricing cụ thể). (Spec này đề xuất range mặc định an toàn.)

**Never:**
- Không triển khai đầy đủ checkout/shipping cho US (service zone, shipping options USD, taxes nâng cao) trong scope này.
- Không dùng “Price Lists” để thay thế base price nếu mục tiêu chỉ là hiển thị giá theo currency.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| `vi` homepage pricing | User truy cập `/{vi}/` và backend có region VND + giá VND | Giá hiển thị VND (đúng theo `calculated_price.currency_code="vnd"`) | Nếu không resolve được region → page return `null` như hiện tại |
| `en` homepage pricing | User truy cập `/{en}/` và backend có region USD (country `us`) + giá USD | Giá hiển thị USD (đúng theo `calculated_price.currency_code="usd"`) | Nếu thiếu USD region hoặc thiếu USD price → fallback sang VND region mặc định (hoặc trả null tùy quyết định trong code) |
| Cart currency | User ở `en`, mở cart mới | Cart dùng region USD (và line items hiển thị USD) | Nếu không tìm được USD region → fallback `vn` để tránh crash |

</frozen-after-approval>

## Code Map

- `apps/backend/src/scripts/seed.ts` -- seed store currencies + regions (hiện chỉ đảm bảo VND region)
- `apps/backend/src/scripts/seed-sales-kit.ts` -- seed catalog product/variants/prices (hiện hard-code 100000 VND)
- `apps/backend-storefront/src/lib/data/regions.ts` -- resolve region (hiện locale → default "vn")
- `apps/backend-storefront/src/lib/data/cart.ts` -- chọn region cho cart (hiện pin theo env default)

## Tasks & Acceptance

**Execution:**
- [x] `apps/backend/src/scripts/seed.ts` -- đảm bảo tồn tại USD region (`currency_code: "usd"`, `countries: ["us"]`) và tax region cho `us`; reuse nếu đã tồn tại -- để storefront có thể resolve region theo country `us`.
- [x] `apps/backend/src/scripts/seed-sales-kit.ts` -- thay hard-code `100000 vnd` bằng seed giá random theo range, và thêm thêm 1 price `usd` (minor units cents) cho mỗi variant -- để product có giá cho cả 2 currency.
- [x] `apps/backend-storefront/src/lib/data/regions.ts` -- map locale `en` → region lookup country `us` (vi → vn, locale khác fallback default) -- để listing/homepage lấy đúng `region_id`.
- [x] `apps/backend-storefront/src/lib/data/cart.ts` -- dùng locale-from-path khi resolve region (thay vì luôn dùng env default), hoặc dùng chung helper resolveRegionCountry -- để cart và totals theo đúng currency với locale.

**Acceptance Criteria:**
- Given backend đã seed xong (có region `vnd` và `usd`), when truy cập `/{vi}/` then giá hiển thị theo VND.
- Given backend đã seed xong (có region `usd` attach country `us`), when truy cập `/{en}/` then giá hiển thị theo USD.
- Given user ở `/{en}/` và chưa có cart, when tạo/nhìn cart then cart region là USD và line item prices hiển thị USD.

## Spec Change Log

## Design Notes

Để giảm rủi ro “đụng shipping/checkout US”, phần seed region USD chỉ nhằm mục tiêu resolve pricing theo `region_id`. Nếu cần checkout US hoạt động hoàn chỉnh, sẽ mở story khác để seed service zone + shipping options + price USD tương ứng.

## Verification

**Commands:**
- `cd apps/backend; npm run seed` -- expected: seed xong không tạo trùng region; có region USD với country `us`
- `cd apps/backend; npm run seed:sales-kit:confirm` -- expected: products có prices cho `vnd` + `usd`
- `cd apps/backend-storefront; npm run dev` -- expected: `/vi` thấy VND; `/en` thấy USD

