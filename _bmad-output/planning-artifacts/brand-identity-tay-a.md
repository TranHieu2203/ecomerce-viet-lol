# Nhận diện thương hiệu — Tây Á

_Tài liệu gốc theo brief nội bộ; dùng cho design, storefront và seed CMS._

## 1. Thông tin cơ bản

| Hạng mục | Nội dung |
|----------|----------|
| **Tên công ty** | Tây Á |
| **Lĩnh vực** | Quà tặng & thương mại |
| **Định hướng** | Sang trọng, tinh tế, chuyên nghiệp, dễ nhận diện |
| **Khách hàng mục tiêu** | Doanh nghiệp; khách hàng trung cấp – cao cấp |

## 2. Màu sắc

- **Chủ đạo:** Vàng kim champagne / ép kim (không vàng tươi). Tham chiếu token: `--brand-gold` `#b8944f`, hover `#9a7a3f`.
- **Phụ:** Trắng, kem nhẹ (`--brand-cream` `#faf7f2`).
- **Nhấn:** Đỏ đậm dùng **rất ít** (`--brand-accent-red` `#a52a2a`) — CTA phụ, badge, gạch chân nhẹ, không lấn vàng.
- **Cảm giác tổng thể:** Premium, nhiều khoảng trắng, contrast rõ nhưng không gắt.

## 3. Phong cách logo

- Tối giản, sang trọng, hiện đại; ít chi tiết.
- Ổn định khi **in ép kim / dập nổi** và khi **thu nhỏ** (favicon, tem).

## 4. Ứng dụng logo

Bao bì quà tặng, hộp cao cấp, tem nhãn, danh thiếp, website & fanpage.

### File trong repo

| File | Mô tả |
|------|--------|
| `docs/logo.png` | Bản gốc (thường nền đen + vàng kim). |
| `docs/logo-header.png` | **Sinh khi chạy seed Sales Kit:** PNG nền trong suốt (nền gần đen đã knock-out) dùng web/header. Không chỉnh tay nếu đổi `logo.png` — chạy lại seed để tái tạo. |
| `apps/backend-storefront/public/tay-a-logo.png` | Copy từ `logo-header.png` sau seed — favicon / OG tĩnh. |

## 5. Đánh giá — storefront đã / nên chỉnh

### Đã áp dụng (token & layout)

- `src/styles/tay-a-brand.css` — ghi đè biến Medusa UI (interactive, border, nền subtle/kem, chữ ink ấm); **`--button-inverted*`** map nút **primary** `@medusajs/ui` → vàng kim; secondary hover kem.
- `tailwind.config.js` — `colors.brand.*`, font ưu tiên Montserrat (`next/font` trong `layout.tsx`).
- **Header:** nền **kem đậm** (`--brand-header-surface*`) gradient dọc — tách rõ khỏi body trắng; **viền trên 3px vàng kim** + viền dưới vàng; không dùng `via-white` (dễ nhìn như không có màu).
- **Giỏ / locale:** pill viền vàng, active locale nền vàng.
- Mega-nav dropdown & panel giỏ: nền kem, viền/shadow vàng nhẹ.
- Announcement: nền kem.
- Nút CTA hero: vàng thương hiệu + viền đỏ rất nhẹ.
- Footer: nền kem, viền vàng nhẹ (thay xám mặc định).
- Logo nav: `drop-shadow` vàng nhẹ để nổi trên nền trắng khi file trong suốt.

### Nên cân nhắc sau (không bắt buộc MVP)

- **Banner CMS:** ảnh slide nên chừa vùng an toàn; tone ảnh xám / warm để khớp vàng kim.
- **Admin:** không đổi theme Medusa Admin (tách biệt storefront).
- **In ấn:** xuất PDF/namecard từ file vector (AI/SVG) — web chỉ dùng PNG/WebP.
- **Knock-out tự động:** ngưỡng RGB ~40–45; logo phức tạp nên có bản **PNG trong suốt chỉnh tay** từ designer và thay `docs/logo.png` hoặc bỏ bước xử lý trong seed nếu file đã sẵn alpha.

## 6. Seed & CMS

- `seed-sales-kit` upload logo đã xử lý (PNG RGBA) lên file module → `logo_file_id` trong CMS settings.
- Storefront header lấy `logo_url` từ API — sau seed, logo hiển thị đúng trên nền trắng.

_Cập nhật: theo brief thương hiệu Tây Á (quà tặng & thương mại, premium)._
