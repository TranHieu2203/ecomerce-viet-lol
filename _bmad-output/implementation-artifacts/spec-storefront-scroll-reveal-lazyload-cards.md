---
title: 'storefront-scroll-reveal-lazyload-cards'
type: 'feature'
created: '2026-04-09'
status: 'done'
context:
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/project-context.md
baseline_commit: '1b3c78dfe541586d044c4c0daa9cdcdd4c9dd557'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Cảm giác load trang storefront chưa “mượt”: nội dung xuất hiện đồng loạt, thiếu nhịp điệu; người dùng cảm thấy thô.

**Approach:** Thêm cơ chế **lazy “reveal on appear”** cho các **card/grid items** (news cards, product cards, list items) bằng IntersectionObserver + CSS/Tailwind (không thêm thư viện nặng), hỗ trợ các hướng animation nhẹ (fade + slide từ trái/phải/trên/dưới), có stagger hợp lý, và bắt buộc tôn trọng `prefers-reduced-motion` để tránh gây khó chịu.

## Boundaries & Constraints

**Always:**
- Tôn trọng `prefers-reduced-motion: reduce`:
  - Reveal chuyển sang **instant** (hoặc fade rất nhẹ) và **không** stagger.
- Không tạo CLS: reveal chỉ dùng `opacity`/`transform` và container kích thước giữ nguyên.
- Không thêm dependency animation nặng (vd: framer-motion).
- Không làm chậm đáng kể render/scroll: dùng IntersectionObserver, unobserve sau khi reveal, và giới hạn work trên mỗi frame.
- Không áp reveal cho các phần **critical LCP** (hero banner) và các element dễ gây “lag” khi nhiều (chỉ áp trên card/list chính).

**Ask First:**
- Có muốn reveal **lặp lại** khi scroll lên/xuống (replay) hay chỉ reveal **một lần**? (mặc định: một lần, để nhẹ và dễ chịu).

**Never:**
- Không slide xa; không bounce; không blur/filter nặng.
- Không animate box-shadow/filter trên list dài.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Reduced motion | `prefers-reduced-motion: reduce` | Card hiển thị ngay, không stagger, không translate | N/A |
| No IntersectionObserver | Browser cũ/edge case | Fallback: render bình thường (no animation) | N/A |
| Many cards | Grid 40–100 items | Không lag scroll; mỗi item reveal 1 lần; observer được cleanup | N/A |

</frozen-after-approval>

## Code Map

- `apps/backend-storefront/src/styles/globals.css` — nơi đặt keyframes cơ bản (fade/slide) + reduced-motion overrides nếu cần.
- `apps/backend-storefront/tailwind.config.js` — token duration/easing (đã có từ motion baseline).
- `apps/backend-storefront/src/modules/common/components/` — vị trí phù hợp để thêm component `Reveal`/`InView` dùng lại.
- `apps/backend-storefront/src/modules/home/components/cms-news-teaser.tsx` — news cards trên home.
- `apps/backend-storefront/src/modules/store/templates/paginated-products.tsx` — grid sản phẩm (collection/category/store).
- `apps/backend-storefront/src/modules/products/components/product-preview/index.tsx` — card sản phẩm.
- `apps/backend-storefront/src/app/[countryCode]/(main)/news/page.tsx` — list tin (nếu muốn áp trên list page).

## Tasks & Acceptance

**Execution:**
- [x] `apps/backend-storefront/src/modules/common/components/reveal/index.tsx` — tạo component `Reveal`:
  - props: `children`, `variant` (`up|down|left|right|fade`), `delayMs?`, `once?` (default true), `className?`
  - dùng IntersectionObserver để set state `inView`
  - reduced-motion: bypass animation (render final state)
  - fallback: nếu không có IntersectionObserver → render final state
- [x] `apps/backend-storefront/src/styles/globals.css` — thêm keyframes/utility classes (hoặc Tailwind `@layer utilities`) cho reveal:
  - `reveal-base` (opacity 0 → 1) + `translate` nhẹ (6–10px)
  - duration dùng token hiện có (120/180/240) + `ease-friendly`
- [x] `apps/backend-storefront/src/modules/home/components/cms-news-teaser.tsx` — wrap từng `<li>` card bằng `Reveal` (stagger: `idx * 40–60ms`).
- [x] `apps/backend-storefront/src/modules/store/templates/paginated-products.tsx` — wrap từng `<li>` sản phẩm bằng `Reveal` (stagger nhẹ, giới hạn tối đa delay để không “lết”).
- [x] `apps/backend-storefront/src/modules/products/components/product-preview/index.tsx` — đảm bảo card vẫn clickable + focus-visible; Reveal không được làm mất focus ring.
- [ ] (Optional) `apps/backend-storefront/src/app/[countryCode]/(main)/news/page.tsx` — áp reveal cho list card nếu UX hợp.

**Acceptance Criteria:**
- Given user scroll xuống trang có grid card, when card đi vào viewport, then card reveal mượt (fade + slide nhẹ) theo variant chọn.
- Given `prefers-reduced-motion: reduce`, when load/scroll, then cards hiển thị ngay (không translate/stagger).
- Given trang có nhiều items (>=48), when scroll nhanh, then không bị giật rõ rệt và không leak observer.
- Given keyboard user tab vào card/link, when focus-visible, then ring vẫn thấy rõ và không bị wrapper che/mất.

## Spec Change Log

## Design Notes

- Default: `once=true` để tránh “nhấp nháy” khi user scroll lên xuống.
- Translate nhỏ (6–10px), duration ~180ms, easing friendly; stagger max ~240–300ms tổng thể cho một row.

## Verification

**Commands:**
- `cd apps/backend-storefront && npx tsc --noEmit` -- expected: exit 0

**Manual checks (if no CLI):**
- Home: kiểm tra news teaser cards reveal theo thứ tự.
- Collection/category grid: scroll và xem sản phẩm reveal.
- DevTools emulate reduced-motion: xác nhận không còn reveal animation.

## Suggested Review Order

**Reveal component (IntersectionObserver + reduced motion + focus safety)**

- Core logic: IO observe/unobserve + reduced-motion bypass + inert toggle.
  [`reveal/index.tsx:1`](../../apps/backend-storefront/src/modules/common/components/reveal/index.tsx#L1)

**Reveal utilities**

- Utility classes for reveal states (fade/slide) and motion-safe transitions.
  [`globals.css:1`](../../apps/backend-storefront/src/styles/globals.css#L1)

**Apply to content surfaces**

- Home news teaser: stagger reveal per card.
  [`cms-news-teaser.tsx:1`](../../apps/backend-storefront/src/modules/home/components/cms-news-teaser.tsx#L1)

- Product grids: reveal items on appear with capped stagger.
  [`paginated-products.tsx:1`](../../apps/backend-storefront/src/modules/store/templates/paginated-products.tsx#L1)

---
title: 'storefront-motion-baseline-friendly'
type: 'feature'
created: '2026-04-09'
status: 'draft'
context:
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/project-context.md
---

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
- [ ] `apps/backend-storefront/tailwind.config.js` — bổ sung “motion tokens” dùng chung:
  - duration: 120/180/240ms
  - easing: 1 curve “friendly” (cubic-bezier gần spring) + 1 curve “standard”
  - animation/transition helpers (opacity/transform) cho hover/enter/leave
- [ ] `apps/backend-storefront/src/styles/globals.css` — thêm utilities giảm motion:
  - `@media (prefers-reduced-motion: reduce)` tắt `scroll-behavior` smooth (nếu có) và giảm animation-duration/iteration cho các class baseline
  - đảm bảo các transition quan trọng có bản “reduce” (không transform lớn)
- [ ] `apps/backend-storefront/src/modules/home/components/hero-slider.tsx` — làm chuyển slide mượt:
  - dùng cross-fade (2 layers) hoặc fade-in/out trên ảnh + text
  - giữ aspect-ratio box hiện có (không CLS)
  - reduced-motion: tắt interval autoplay, chuyển slide = instant hoặc fade rất nhẹ
- [ ] `apps/backend-storefront/src/modules/layout/components/side-menu/index.tsx` — polish enter/leave:
  - easing/duration nhất quán; backdrop fade mềm; panel translate nhỏ + opacity
  - reduced-motion: bỏ translate, chỉ opacity (hoặc instant)
- [ ] `apps/backend-storefront/src/modules/home/components/cms-news-teaser.tsx` — card micro-interaction:
  - hover: ảnh scale nhẹ + opacity overlay rất nhẹ; card lift bằng transform nhẹ
  - focus-visible: ring rõ (a11y), không chỉ hover
  - reduced-motion: bỏ scale, chỉ đổi border/color
- [ ] (Tùy phát hiện) `apps/backend-storefront/src/modules/products/components/product-preview/index.tsx` — hover/focus/press nhất quán với news cards.

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

