---
title: 'storefront-motion-baseline-friendly'
type: 'feature'
created: '2026-04-09'
status: 'done'
context:
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/project-context.md
baseline_commit: '557c1b02cfb0c93abbaff5fc9bae8f101e594663'
---

# NOTE (locked): Human approved at 2026-04-09.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Animation/motion của front-store hiện còn “thô” (chuyển trạng thái gắt, thiếu easing nhất quán), làm trải nghiệm kém dễ chịu và kém “bắt mắt” theo tiêu chí thương hiệu.

**Approach:** Thiết lập một **motion baseline toàn site** (token + utility + pattern) theo style **Friendly** (mềm, có spring nhẹ bằng CSS easing) và áp dụng vào các điểm chạm chính (hero slider, nav/drawer, card hover/focus/press), đồng thời bắt buộc tôn trọng **`prefers-reduced-motion`** và không làm xấu **LCP/CLS**.

## Boundaries & Constraints

**Always:**
- Tôn trọng `@media (prefers-reduced-motion: reduce)`:
  - Không autoplay chuyển slide; không animate translate lớn; giảm/loại animation không cần thiết.
  - Giữ UX vẫn usable (không phụ thuộc animation để hiểu state).
- Không gây **layout shift**: ưu tiên `opacity`, `transform` (không animate `height/width` trên content flow trừ khi đã có “container height cố định”).
- Không thêm dependency animation nặng (vd: framer-motion) trong phase này; ưu tiên Tailwind/CSS + Headless UI Transition sẵn có.
- Motion nhất quán: cùng set duration + easing theo “token”, tránh mỗi component một kiểu.

**Ask First:**
- Nếu cần thay đổi hành vi autoplay slider (tắt/bật mặc định) ngoài reduced-motion, phải hỏi lại (ảnh hưởng UX marketing).
- Nếu muốn thêm thư viện animation (framer-motion) hoặc micro-interaction phức tạp (shared element transitions), phải hỏi lại.

**Never:**
- Không tạo animation gây chóng mặt: parallax mạnh, infinite loop lặp nhiều nơi, bounce quá đà, flashing.
- Không animate properties gây repaint nặng trên nhiều node (vd: `box-shadow` lớn liên tục, `filter: blur()` trên list dài).
- Không đổi layout/IA (không đổi cấu trúc menu, không refactor route) — chỉ “polish motion”.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Reduced motion | `prefers-reduced-motion: reduce` | Không autoplay hero; chuyển slide = instant hoặc fade rất nhẹ; hover/press giảm transform | N/A |
| Touch devices | Mobile/touch | “Press feedback” rõ (scale rất nhẹ hoặc opacity), không phụ thuộc hover | N/A |
| Low-end perf | Nhiều card list | Hover không giật; tránh shadow animation nặng; dùng transform/opacity | N/A |

</frozen-after-approval>

## Code Map

- `apps/backend-storefront/tailwind.config.js` — nơi đặt token easing/duration/animation utilities (baseline).
- `apps/backend-storefront/src/styles/globals.css` — global utilities (reduced-motion, focus-visible polish, transition defaults nếu cần).
- `apps/backend-storefront/src/styles/tay-a-brand.css` — brand tokens (không đổi màu, chỉ tham chiếu nếu cần).
- `apps/backend-storefront/src/app/layout.tsx` — chỗ hợp lý để set lớp `motion-safe`/`motion-reduce` nếu cần (ưu tiên CSS media query).
- `apps/backend-storefront/src/modules/home/components/hero-slider.tsx` — điểm “thô” lớn: chuyển slide hiện tại là đổi state tức thì.
- `apps/backend-storefront/src/modules/layout/components/side-menu/index.tsx` — backdrop/panel transition (đã có Transition, polish easing).
- `apps/backend-storefront/src/modules/layout/templates/nav/index.tsx` — hover/focus/press cho header controls.
- `apps/backend-storefront/src/modules/home/components/cms-news-teaser.tsx` — card hover/focus; hiện chỉ transition border.
- (tùy audit) `apps/backend-storefront/src/modules/products/components/product-preview/*` — card hover image/title/price.

## Tasks & Acceptance

**Execution:**
- [x] `apps/backend-storefront/tailwind.config.js` — bổ sung “motion tokens” dùng chung:
  - duration: 120/180/240ms
  - easing: 1 curve “friendly” (cubic-bezier gần spring) + 1 curve “standard”
  - animation/transition helpers (opacity/transform) cho hover/enter/leave
- [x] `apps/backend-storefront/src/styles/globals.css` — thêm utilities giảm motion:
  - `@media (prefers-reduced-motion: reduce)` tắt `scroll-behavior` smooth (nếu có) và giảm animation-duration/iteration cho các class baseline
  - đảm bảo các transition quan trọng có bản “reduce” (không transform lớn)
- [x] `apps/backend-storefront/src/modules/home/components/hero-slider.tsx` — làm chuyển slide mượt:
  - dùng cross-fade (2 layers) hoặc fade-in/out trên ảnh + text
  - giữ aspect-ratio box hiện có (không CLS)
  - reduced-motion: tắt interval autoplay, chuyển slide = instant hoặc fade rất nhẹ
- [x] `apps/backend-storefront/src/modules/layout/components/side-menu/index.tsx` — polish enter/leave:
  - easing/duration nhất quán; backdrop fade mềm; panel translate nhỏ + opacity
  - reduced-motion: bỏ translate, chỉ opacity (hoặc instant)
- [x] `apps/backend-storefront/src/modules/home/components/cms-news-teaser.tsx` — card micro-interaction:
  - hover: ảnh scale nhẹ + opacity overlay rất nhẹ; card lift bằng transform nhẹ
  - focus-visible: ring rõ (a11y), không chỉ hover
  - reduced-motion: bỏ scale, chỉ đổi border/color
- [x] (Tùy phát hiện) `apps/backend-storefront/src/modules/products/components/product-preview/index.tsx` — hover/focus/press nhất quán với news cards.

**Acceptance Criteria:**
- Given người dùng bật `prefers-reduced-motion: reduce`, when mở trang Home, then hero **không tự chuyển slide** và mọi animation không gây khó chịu (không translate lớn, không nhấp nháy).
- Given desktop user hover card tin tức/sản phẩm, when hover/focus, then card phản hồi “mềm” (opacity/transform nhẹ) và không giật/không layout shift.
- Given mobile user tap/press các CTA (nút, card), when press, then có feedback tinh tế (opacity/scale rất nhẹ) và không phụ thuộc hover.
- Given chạy Lighthouse/quan sát thủ công, when load Home, then không có CLS mới phát sinh từ animation (khung hero ổn định).

## Spec Change Log

## Design Notes

- “Friendly” curve gợi ý: cubic-bezier gần spring (không bounce): ví dụ `(0.2, 0.9, 0.2, 1)` hoặc `(0.16, 1, 0.3, 1)`; dùng 1 chuẩn cho enter/hover, 1 chuẩn cho leave.
- Golden rule: animate **opacity/transform**; tránh animate shadow/filter trên list dài.

## Verification

**Commands:**
- `cd apps/backend-storefront && npx tsc --noEmit` -- expected: exit 0
- `npm run dev:storefront` (root) -- expected: UI chạy, chuyển slide/hover không lỗi runtime

**Manual checks (if no CLI):**
- DevTools “Rendering” + test `prefers-reduced-motion` (Emulate) và kiểm tra: hero không autoplay; hover/tap feedback mềm.

## Suggested Review Order

**Hero slider (reduced-motion + perf-safe cross-fade)**

- Reduced-motion disables autoplay and keeps behavior deterministic.
  [`hero-slider.tsx:60`](../../apps/backend-storefront/src/modules/home/components/hero-slider.tsx#L60)

- Two-layer cross-fade prevents loading all slides at once.
  [`hero-slider.tsx:94`](../../apps/backend-storefront/src/modules/home/components/hero-slider.tsx#L94)

**Reduced motion global guardrail**

- Global reduced-motion override to eliminate animations/transitions site-wide.
  [`globals.css:114`](../../apps/backend-storefront/src/styles/globals.css#L114)

**Nav drawer transition polish**

- HeadlessUI Transition uses friendly easing + reduced-motion transform removal.
  [`side-menu/index.tsx:82`](../../apps/backend-storefront/src/modules/layout/components/side-menu/index.tsx#L82)

**Card micro-interactions (news + products)**

- News card hover scale + focus-visible ring on link.
  [`cms-news-teaser.tsx:49`](../../apps/backend-storefront/src/modules/home/components/cms-news-teaser.tsx#L49)

- Product card focus-visible ring at the clickable wrapper.
  [`product-preview/index.tsx:40`](../../apps/backend-storefront/src/modules/products/components/product-preview/index.tsx#L40)

- Product thumbnail hover scale; no shadow transition (paint-safe).
  [`thumbnail/index.tsx:28`](../../apps/backend-storefront/src/modules/products/components/thumbnail/index.tsx#L28)

**Motion tokens (Tailwind)**

- Friendly/standard easing and duration tokens for consistent motion.
  [`tailwind.config.js:14`](../../apps/backend-storefront/tailwind.config.js#L14)

