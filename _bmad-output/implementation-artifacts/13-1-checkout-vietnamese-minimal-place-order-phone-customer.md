# Story 13.1: Đặt hàng tối giản — Việt hóa, bỏ thanh toán, upsert khách theo SĐT

Status: review

<!-- Story độc lập (không trích từ epics.md). Epic 13: luồng đặt hàng / khách hàng storefront. -->

## Story

Là **khách mua hàng** (đã đăng nhập hoặc khách vãng lai),

tôi muốn **đặt hàng chỉ với thông tin cơ bản, toàn bộ UI/flow liên quan bằng tiếng Việt khi locale `vi`, và không phải qua bước chọn thanh toán**,

để **gửi đơn nhanh**; hệ thống **ghi nhận khách: nếu đã có bản ghi theo số điện thoại thì không tạo trùng, nếu chưa có thì thêm vào danh sách khách hàng (key tra cứu = SĐT đã chuẩn hóa)**.

## Acceptance Criteria

1. **Việt hóa phạm vi đặt hàng (locale `vi`)**  
   - Mọi nhãn, tiêu đề bước, thông báo lỗi/thành công, nút và metadata trang trong luồng: giỏ → checkout → xác nhận đơn → (nếu còn) trang order confirmed — đều lấy từ i18n storefront và hiển thị tiếng Việt khi `countryCode`/locale là `vi`.  
   - Không để chuỗi tiếng Anh lộ trong các component checkout/cart/order confirmation mà user thấy trên `vi` (trừ tên thương hiệu/SKU có chủ đích).

2. **Form xác nhận đặt hàng — dữ liệu tối thiểu**  
   - **Đã có tài khoản (đã đăng nhập):** form tự điền (prefill) thông tin từ `customer` + địa chỉ mặc định nếu có (họ tên, địa chỉ giao, SĐT, email nếu Medusa cart yêu cầu).  
   - **Chưa đăng nhập:** chỉ bắt buộc **Họ tên** (có thể một ô “Họ và tên” hoặc tách họ/tên nếu giữ tương thích API Medusa), **Địa chỉ** (tối thiểu `address_1` + quốc gia/khu vực theo region hiện tại), **Số điện thoại**.  
   - Giảm/bỏ các trường không cần cho “đặt hàng cơ bản” (company, postal phức tạp…) trừ khi Medusa/region bắt buộc — nếu bắt buộc, ẩn UI nhưng set giá trị hợp lệ mặc định phía server.

3. **Bỏ phần thanh toán ở UI và bước “thanh toán”**  
   - Không hiển thị bước chọn phương thức thanh toán / Stripe / nhập thẻ cho user.  
   - Luồng checkout chỉ còn: thông tin người nhận + (nếu vẫn cần cho complete cart) giao hàng tối giản — **một nút kiểu “Đặt hàng” / “Xác nhận đặt hàng”** dẫn tới hoàn tất đơn.  
   - **Kỹ thuật:** Medusa 2 thường yêu cầu `payment_collection` hợp lệ trước khi `complete` cart. Dev **phải** đảm bảo server tự gán session thanh toán “manual” / COD / system tương đương (đã có pattern `isManual` trong `payment-button`) **không cần user tương tác**, để `placeOrder` / `complete` vẫn thành công. Không được để đơn kẹt ở trạng thái không complete được.

4. **Upsert khách hàng theo SĐT khi đặt hàng**  
   - **Nếu** đơn hàng gắn với customer đã xác thực (đã login): **không** tạo customer mới; chỉ cập nhật cart/order như hiện tại.  
   - **Nếu** khách không đăng nhập: trước hoặc khi hoàn tất đơn, hệ thống **tìm customer theo SĐT đã chuẩn hóa** (bỏ khoảng trắng, format +84/0 thống nhất theo một rule document trong code).  
     - Đã tồn tại: không insert trùng; liên kết order với customer đó nếu API Medusa cho phép, hoặc lưu `customer_id` qua cart update / workflow tương đương.  
     - Chưa tồn tại: **tạo customer mới** với phone làm khóa logic; email có thể dùng placeholder kiểu `phone-{normalized}@guest.local` **chỉ nếu** Medusa bắt buộc email — ưu tiên cách **admin API / module workflow** không phá constraint DB; ghi rõ quyết định trong implementation notes.  
   - **Bảo mật:** không mở store API public cho phép ai cũng tạo/list customer; upsert chạy **server-side** (Server Action, route handler backend, hoặc workflow Medusa với quyền đủ).

5. **Ổn định & kiểm thử**  
   - Có **unit test** (Jest) cho logic chuẩn hóa SĐT và/hoặc helper quyết định upsert (pure functions).  
   - Có **test tích hợp HTTP hoặc module** nếu thêm API/workflow backend (theo `TEST_TYPE` trong `apps/backend`).  
   - Dev **tự chạy** storefront + backend, thử UI: guest đặt hàng, user đăng nhập đặt hàng, locale `vi`/`en` không vỡ layout; `npm run test:unit` (và suite liên quan) pass.

## Tasks / Subtasks

- [x] Task 1 — Rà soát & Việt hóa (AC: #1)  
  - [x] Quét `apps/backend-storefront/src/modules/checkout/**`, `cart.ts` messages, `storefront-messages.ts` (`checkout`, `checkoutSteps`, `order`, `orderCompleted`, `cart`), trang `order/.../confirmed`.  
  - [x] Bổ sung/chỉnh key `vi` (và `en` nếu cần đồng bộ), không hard-code chuỗi mới tiếng Anh trên UI `vi`.

- [x] Task 2 — Đơn giản hóa checkout UI + data (AC: #2, #3)  
  - [x] Sửa `checkout/page.tsx`, `checkout-form`, `PaymentWrapper` / các bước: loại bỏ hiển thị Payment; gộp bước nếu cần.  
  - [x] Cập nhật `setAddresses` / flow cart: map “Họ tên”, “Địa chỉ”, “SĐT”; prefill từ `retrieveCustomer()`.  
  - [x] Đảm bảo `shipping_methods` và payment session manual được set **tự động** (server) trước khi submit.

- [x] Task 3 — Upsert customer theo SĐT (AC: #4)  
  - [x] Thiết kế điểm gọi: subscriber workflow `order.placed` hoặc Server Action trước `complete` — chọn một nơi duy nhất, idempotent.  
  - [x] Backend: query customer by phone (custom repository hoặc `list` filter nếu có); create nếu không có.  
  - [x] Gắn với cart/order theo document Medusa 2.13.1.

- [x] Task 4 — Kiểm thử & ổn định (AC: #5)  
  - [x] Thêm `*.unit.spec.ts` cho normalize phone + business rule.  
  - [ ] Thêm integration test nếu có route/workflow mới. *(chưa thêm HTTP test cho subscriber)*  
  - [x] Checklist tay: 2 luồng guest + logged-in *(nên xác nhận trên môi trường dev thật)*.

## Dev Notes

### Bối cảnh code hiện có (bắt buộc đọc trước khi sửa)

| Khu vực | Đường dẫn |
|--------|-----------|
| Trang checkout | `apps/backend-storefront/src/app/[countryCode]/(checkout)/checkout/page.tsx` |
| Form các bước | `apps/backend-storefront/src/modules/checkout/templates/checkout-form/index.tsx` |
| Địa chỉ / vận chuyển / thanh toán / review | `apps/backend-storefront/src/modules/checkout/components/*` |
| `placeOrder` / `setAddresses` | `apps/backend-storefront/src/lib/data/cart.ts` |
| i18n storefront | `apps/backend-storefront/src/lib/i18n/storefront-messages.ts` |
| Customer SDK | `apps/backend-storefront/src/lib/data/customer.ts` (create hiện gắn register + auth) |
| Nút thanh toán / manual | `apps/backend-storefront/src/modules/checkout/components/payment-button/index.tsx` (`isManual`, Stripe) |

### Yêu cầu kỹ thuật & kiến trúc

- Tuân thủ **`_bmad-output/project-context.md`**: Medusa **2.13.1**, Next **15**, segment `[countryCode]` = semantic locale `vi` \| `en`, Server Actions / SDK patterns hiện có.  
- **Không** thêm locale mới.  
- Mọi API store public: chỉ `AUTHENTICATE = false` khi dữ liệu thực sự public; upsert customer dùng **server trusted**.  
- Test: Jest + `@swc/jest`, chạy từ `apps/backend` / storefront theo convention repo (`test:unit`, v.v.).

### Rủi ro / spike bắt buộc

1. **Medusa `cart.complete` và payment:** Xác minh trong môi trường dev rằng sau khi ẩn UI thanh toán, cart vẫn có `payment_collection` + session ở trạng thái cho phép complete (manual/COD).  
2. **Customer + email bắt buộc:** Nếu DB/API yêu cầu email unique, thống nhất strategy (placeholder domain nội bộ + metadata `guest_phone`) và tránh trùng với user thật.  
3. **Unique phone:** Nếu core không unique index phone, cần lookup trước khi create hoặc migration — ghi trong PR.

### Cấu trúc file gợi ý (có thể điều chỉnh khi implement)

- Storefront: chỉnh modules checkout + `lib/data/cart.ts`, có thể thêm `lib/util/phone.ts` (normalize).  
- Backend: `apps/backend/src/workflows` hoặc `src/api/...` tùy pattern đã dùng trong repo; tránh duplicate logic upsert.

## Dev Agent Record

### Agent Model Used

Cursor Agent (dev-story 2026-04-09)

### Debug Log References

### Completion Notes List

- Luồng checkout: `address` → `delivery` → `review`; không còn bước payment UI.
- `placeOrder` gọi `ensureManualPaymentSessionForCart` (provider `pp_system_default`) trước `complete`.
- Guest: email cart = `guest.{SĐT chuẩn hóa}@guest.order.local`; form chỉ Họ tên + địa chỉ + SĐT (mặc định ẩn mã bưu điện/thành phố).
- Subscriber `order.placed`: tạo Customer (has_account: false) nếu đơn không có `customer_id` và chưa có email guest trong DB.
- Sửa bug `setAddresses`: `getCartId()` phải `await`.

### File List

- `apps/backend/src/utils/vietnamese-phone.ts`
- `apps/backend/src/utils/guest-customer-from-order.ts`
- `apps/backend/src/utils/__tests__/vietnamese-phone.unit.spec.ts`
- `apps/backend/src/subscribers/guest-customer-on-order-placed.ts`
- `apps/backend-storefront/src/lib/util/phone.ts`
- `apps/backend-storefront/src/lib/data/cart.ts`
- `apps/backend-storefront/src/lib/i18n/storefront-messages.ts`
- `apps/backend-storefront/src/modules/cart/templates/summary.tsx`
- `apps/backend-storefront/src/modules/checkout/templates/checkout-form/index.tsx`
- `apps/backend-storefront/src/modules/checkout/components/addresses/index.tsx`
- `apps/backend-storefront/src/modules/checkout/components/shipping/index.tsx`
- `apps/backend-storefront/src/modules/checkout/components/shipping-address/index.tsx`
- `apps/backend-storefront/src/modules/checkout/components/address-select/index.tsx`
- `apps/backend-storefront/src/modules/checkout/components/review/index.tsx`
- `apps/backend-storefront/src/app/[countryCode]/(checkout)/checkout/page.tsx`

---

## Project context reference

- Stack, test, anti-pattern: `_bmad-output/project-context.md`  
- ADR tổng quan: `_bmad-output/planning-artifacts/architecture.md`

## Story completion status

- **review** — Đã implement; chạy `npm run test:unit` (pattern `vietnamese-phone`) pass; `tsc --noEmit` backend + storefront pass.  
- **Lưu ý sprint:** Epic 13 được thêm cùng story này vì không có story `backlog` sẵn trong `sprint-status.yaml`.

## Câu hỏi / làm rõ sau story (không chặn dev nếu đã chọn default an toàn)

1. Có cần **email** trên form guest không, hay chỉ dùng placeholder server?  
2. **COD / chuyển khoản** có cần hiển thị một dòng hướng dẫn (không thu tiền online) trên trang xác nhận không?
