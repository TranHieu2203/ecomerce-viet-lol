---
title: 'Tối ưu hiển thị sản phẩm: grid 5/4 cột + ảnh cân đối + description trên card'
type: 'feature'
created: '2026-04-09'
status: 'in-progress'
baseline_commit: '26cd3895f61b114d286feef925551ef62d988b7b'
context:
  - '_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Card sản phẩm ở trang chủ và trang chi tiết đang làm ảnh trông “hơi to” và layout chưa hài hoà; trang chủ cũng chưa hiển thị `description` nên thông tin sản phẩm bị thiếu khi browsing.

**Approach:** Chỉnh responsive grid để desktop hiển thị 5 cột, tablet 4 cột; tinh chỉnh container/aspect/padding của ảnh trong `ProductPreview` (home/listing) và `ImageGallery` (PDP) để ảnh cân đối; bổ sung hiển thị `description` (có line-clamp) trên card trang chủ.

## Boundaries & Constraints

**Always:**
- Không thay đổi cấu trúc route App Router `src/app/[countryCode]` (đang là locale).
- Chỉ chỉnh UI/layout (Tailwind classes, container sizing, `next/image` sizing); không thay đổi data model/seed.
- Giữ hành vi lazy-loading/scroll reveal hiện có cho card (nếu đã được bật trong codebase).
- `description` hiển thị theo đúng locale/fallback đang dùng trong storefront (nếu đã có helper i18n).

**Ask First:**
- Nếu `product.description` quá dài hoặc chứa HTML, hiển thị theo hướng: (a) plain text + line-clamp, (b) strip HTML rồi line-clamp. (Mặc định spec này chọn plain text + line-clamp, không render HTML.)

**Never:**
- Không thay đổi logic fetch sản phẩm / pagination / caching.
- Không thay đổi hành vi SEO/metadata của PDP.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Home grid breakpoints | Viewport tablet / desktop | Tablet: 4 columns; Desktop: 5 columns | N/A |
| Description missing | `product.description` null/empty | Card không render dòng mô tả; spacing vẫn đẹp | N/A |
| Very long description | `product.description` dài | Card clamp 2–3 dòng (không làm nhảy layout quá cao) | N/A |

</frozen-after-approval>

## Code Map

- `apps/backend-storefront/src/app/[countryCode]/(main)/page.tsx` -- entry homepage, dùng `FeaturedProducts`
- `apps/backend-storefront/src/modules/home/components/featured-products/index.tsx` -- map collections → `ProductRail`
- `apps/backend-storefront/src/modules/home/components/featured-products/product-rail/index.tsx` -- grid UL của homepage rail
- `apps/backend-storefront/src/modules/store/templates/paginated-products.tsx` -- grid UL của trang listing/paginated store
- `apps/backend-storefront/src/modules/products/components/product-preview/index.tsx` -- card sản phẩm đang dùng ở homepage rail & listing
- `apps/backend-storefront/src/modules/products/components/thumbnail/index.tsx` -- ảnh thumbnail trên card (container/aspect/padding)
- `apps/backend-storefront/src/app/[countryCode]/(main)/products/[handle]/page.tsx` -- entry PDP, tạo `images`
- `apps/backend-storefront/src/modules/products/templates/index.tsx` -- template PDP, render `ImageGallery`
- `apps/backend-storefront/src/modules/products/components/image-gallery/index.tsx` -- ảnh PDP (aspect + sizes)

## Tasks & Acceptance

**Execution:**
- [x] `apps/backend-storefront/src/modules/home/components/featured-products/product-rail/index.tsx` -- update Tailwind grid columns để đạt tablet 4 cột, desktop 5 cột (giữ mobile 2–3 cột như hiện tại) -- để homepage hiển thị dày hơn, cân đối hơn.
- [x] `apps/backend-storefront/src/modules/store/templates/paginated-products.tsx` -- update Tailwind grid columns để desktop 5 cột (tablet hiện đã 4 cột) -- để store listing đồng nhất với homepage.
- [x] `apps/backend-storefront/src/modules/products/components/product-preview/index.tsx` -- render thêm `description` dưới title (localized nếu đã dùng helper), áp dụng line-clamp + typography nhẹ -- để card trang chủ đủ thông tin, không làm rối layout.
- [x] `apps/backend-storefront/src/modules/products/components/thumbnail/index.tsx` -- tinh chỉnh container thumbnail (aspect ratio và/hoặc padding) để ảnh “nhỏ vừa” và hài hoà trong grid 5 cột -- giảm cảm giác ảnh quá to.
- [x] `apps/backend-storefront/src/modules/products/components/image-gallery/index.tsx` (và/hoặc `.../templates/index.tsx`) -- tinh chỉnh layout gallery (aspect ratio, max-width, spacing) để ảnh PDP cân đối hơn trên desktop/tablet -- tránh ảnh chiếm quá nhiều diện tích trên fold đầu.

## Verification Notes

- `apps/backend-storefront && npm run lint` chạy **PASS** (có warnings `react-hooks/exhaustive-deps` tồn tại sẵn).

**Acceptance Criteria:**
- Given viewport tablet, when truy cập homepage, then grid sản phẩm hiển thị **4 cột**.
- Given viewport desktop, when truy cập homepage, then grid sản phẩm hiển thị **5 cột**.
- Given viewport desktop, when truy cập trang listing store, then grid sản phẩm hiển thị **5 cột**.
- Given product có `description`, when xem card sản phẩm ở homepage, then thấy mô tả dạng **clamp** (không phá layout).
- Given product không có `description`, when xem card, then không có khoảng trống thừa/bể layout.
- Given truy cập PDP, when xem gallery ảnh chính, then ảnh hiển thị cân đối (không “quá to”), vẫn giữ tỉ lệ và không bị méo.

## Spec Change Log

## Design Notes

- Breakpoints dùng theo naming hiện có trong repo (`small`, `medium`, `large`). “Tablet” = `medium`, “Desktop” = `large` cho việc đặt 4/5 cột.
- Với ảnh card: ưu tiên chỉnh **container** (aspect/padding/max-w) thay vì giảm chất lượng ảnh; `next/image` vẫn dùng `fill` + `object-cover` để giữ tỉ lệ.
- Với `description`: dùng line-clamp (2–3 dòng) để tránh thẻ card quá cao khi grid 5 cột.

## Verification

**Commands:**
- `cd apps/backend-storefront && npm run lint` -- expected: SUCCESS
- `cd apps/backend-storefront && npm run dev` -- expected: homepage + PDP render ổn, không lỗi runtime

**Manual checks (if no CLI):**
- Home: kiểm tra 2 breakpoints (tablet/desktop) xác nhận 4/5 cột và card không bị nhảy layout.
- PDP: kiểm tra ảnh gallery không chiếm quá nhiều diện tích trên desktop, scroll feel tự nhiên.

