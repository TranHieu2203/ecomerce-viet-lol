---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-03-core-experience
  - step-04-emotional-response
  - step-05-inspiration
  - step-06-design-system
  - step-07-defining-experience
  - step-08-visual-foundation
  - step-09-design-directions
  - step-10-user-journeys
  - step-11-component-strategy
  - step-12-ux-patterns
  - step-13-responsive-accessibility
  - step-14-complete
  - ux-supplement-wave2-wave3-2026-04-06
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
workflowType: ux-design
workflowNote: >-
  MVP ban đầu. Bổ sung 2026-04-06: Wave 2 (header chỉ logo, footer thương hiệu, menu 2 cấp, drawer/touch, i18n UI)
  và Wave 3 (trang CMS, SEO, announcement, preview, người phi kỹ thuật) theo PRD + architecture.md.
document_output_language: Vietnamese
lastUxRevision: "2026-04-06"
---

# Đặc tả Thiết kế UX — ecomerce-viet-lol

**Tác giả:** HieuTV-Team-MedusaV2  
**Ngày:** 2026-03-30 · **Bổ sung UX:** 2026-04-06  
**Nguồn đầu vào:** `prd.md`, `architecture.md` (planning-artifacts)

---

## 1. Bối cảnh & phạm vi UX

Hệ thống gồm **hai bề mặt trải nghiệm**:

| Bề mặt | Mục đích | Ràng buộc |
|--------|-----------|-----------|
| **Medusa Admin** | Vận hành catalog, **banner**, **logo**, locale; **Wave 2:** menu 2 cấp; **Wave 3:** trang CMS, SEO, footer/MXH, announcement, preview, revision, trợ giúp | Tuân native Admin; form dài chia **section** + **sticky save bar** (optional); mọi lỗi **tiếng Việt** (NFR-9). |
| **Storefront Next.js** | Hero slider; **nav** (collections hoặc CMS); **Wave 2:** header chỉ logo trái, tên site ở footer; **Wave 3:** thanh thông báo, trang `p/[slug]`, metadata SEO, 404 chỉnh từ CMS | Mobile-first; LCP hero ≤ 3s; touch ≥ 44px; **một** hệ visual header/menu (tránh glass tối vs header sáng không chủ đích). |

**Ngoài phạm vi (vẫn):** checkout đầy đủ, tài khoản nâng cao. **Đã đưa vào phạm vi bổ sung:** SEO **cơ bản** (title/description/OG), trang nội dung tĩnh, announcement — không page builder kéo-thả toàn trang.

---

## 2. Người dùng mục tiêu

- **Quản trị viên vận hành:** như trên + **Wave 3:** người **phi kỹ thuật** cần **hướng dẫn trong màn**, từ vựng đơn giản (“Đường link”, “Ảnh hiển thị khi chia sẻ”), **xem trước** trước khi công khai, **hoàn tác** khi sợ sai.  
- **Khách tham quan / mua:** ưu tiên **tiếng Việt mặc định**, có thể chuyển **English**; kỳ vọng **nhất quán ngôn ngữ** toàn header/footer/menu (SC-10); thấy **thanh thông báo** rõ nhưng đóng được (nếu có nút đóng — tuỳ PM).

---

## 3. Trải nghiệm cốt lõi (Core experience)

1. **Trang chủ storefront:** hero **carousel** lấy từ Admin — ảnh full-bleed (mobile) / max-width container (desktop), chữ đọc được trên nền ảnh (tối thiểu: overlay gradient hoặc vùng chữ tách nền).  
2. **Điều hướng:** menu **hai cấp** lấy từ **CMS** (nhóm → collection / link ngoài), đồng bộ desktop + mobile drawer; có thể phản ánh seed ban đầu nhưng **truth** là cấu hình Admin — không hard-code production.  
3. **Đa ngôn ngữ thống nhất:** cùng một “truth” nội dung; storefront hiển thị theo locale; Admin nhập **cả hai** khi có thể, với chỉ báo trường còn thiếu bản **en**.  
4. **Banner/logo là nội dung vận hành:** thay đổi xuất hiện trên storefront sau chu kỳ **revalidate/cache** đã chọn (một dòng trạng thái “Đã lưu — hiển thị sau tối đa X phút” giảm lo lắng vận hành).

**Liên kết PRD:** SC-1…SC-6, SC-10, SC-12, SC-13; FR-1…FR-14, FR-22, FR-29…FR-38 (wave 2–3).

---

## 4. Cảm xúc & thương hiệu cảm nhận

- **Từ khóa:** tin cậy (hàng Việt / B2B quà tặng), ấm, rõ ràng, không “chợ mạng” rối.  
- **Giọng điệu UI:** câu ngắn; ưu tiên động từ trên CTA (Ví dụ: “Xem bộ sưu tập”, “Khám phá”).  
- **Hình ảnh:** banner **chất lượng cao** nhưng **nhẹ** trên mobile; không dùng typography quá mảnh trên nền ảnh.

---

## 5. Tham chiếu & hệ thống thiết kế

**Định hướng:** bắt đầu từ **token** (màu, spacing, radius, shadow) — có thể map sang component thư viện (ví dụ shadcn + Tailwind) khi implement; Admin custom screens dùng **component trung tính** gần với Admin (hoặc MUI/Radix tùy stack extension).

**Token khởi điểm (có thể tinh chỉnh sau):**

| Token | Gợi ý | Ghi chú |
|-------|--------|--------|
| Primary | Xanh lá đậm / vàng nghệ tự nhiên (chọn **một** primary trong architect handoff) | Đủ contrast với chữ trắng trên CTA |
| Nền | Trắng ngà (#FAFAF8) / xám nhạt section | Section hóa trang chủ |
| Chữ | Sans hệ thống + 1 font web cho heading (tải subset **vi + en**) | Tránh FOUT trên hero |
| Radius | 8px (card), 12px (banner container desktop) | Đồng nhất Admin extension |

**Biểu tượng:** dùng bộ icon một nguồn (Lucide/Heroicons) — cả storefront và Admin extension nếu khả thi.

---

## 6. Định nghĩa trải nghiệm (Information architecture)

### Storefront (IA — khớp triển khai repo)

Segment động **`[countryCode]`** mang semantic **locale** `vi` | `en` (không đổi tên folder nếu không đồng bộ toàn repo).

- `/[countryCode]/` — Trang chủ (slider + khối tùy sprint).  
- `/[countryCode]/collections/[handle]` — PLP.  
- `/[countryCode]/products/[handle]` — PDP.  
- **`/[countryCode]/p/[slug]`** (hoặc `/pages/[slug]` — chốt một URL trong dev) — **Trang nội dung CMS** (Giới thiệu, Điều khoản, …).  
- **Global:** **Announcement bar** (dưới header hoặc trên cùng — chốt một vị trí); header **logo trái** + menu **2 cấp** desktop + drawer **cùng cây** mobile; footer **tên site + tagline + cột link + MXH/hotline** từ CMS.  
- **404:** layout giống site; copy từ CMS **vi/en**; CTA về trang chủ.

**Locale:** prefix path `vi` | `en` (NFR-5).

### Medusa Admin (mở rộng UX)

Vùng menu gom nhóm **“Storefront & Nội dung”** (nhãn có thể i18n hoá sau):

1. **Cấu hình ngôn ngữ:** bật `en`, default `vi`, (tuỳ chọn sau MVP: thứ tự hiển thị trên switcher).  
2. **Banner trang chủ:** danh sách slide có **kéo thả reorder**; form từng slide.  
3. **Logo cửa hàng:** upload một file + xem trước trên nền sáng/tối (2 preview nhỏ).  
4. **Menu header (2 cấp):** editor cây — cấp 1 = nhóm; cấp 2 = link collection / URL ngoài; kéo thả sắp thứ tự; chỉ báo “Lấy tên từ catalog” khi không ghi đè nhãn.  
5. **Trang nội dung:** danh sách slug + trạng thái **Nháp / Đã xuất bản**; editor tabs **vi | en**; nút **Xem trước** + **Xuất bản**.  
6. **SEO & chia sẻ:** meta title/description mặc định (vi/en); upload **OG image** (hoặc dùng logo).  
7. **Footer & liên hệ:** form hotline, email, từng link MXH (validation URL).  
8. **Thông báo site:** toggle + textarea ngắn vi/en + (tuỳ chọn) ngày bắt đầu/kết thúc.  
9. **Trang 404:** hai ô title + body (vi/en).  
10. **Lịch sử / Hoàn tác:** drawer hoặc trang con liệt kê phiên bản gần đây + **Khôi phục** (confirm).  
11. **Trợ giúp:** icon `?` mở panel hoặc link doc — nội dung tiếng Việt ngắn theo **đúng màn** đang mở.

---

## 7. Hướng trực quan (Visual foundation)

- **Grid storefront:** mobile 4pt baseline; desktop max-width ~1200–1280px, gutter 24px.  
- **Hero slider:** tỉ lệ gợi ý **16:9** (mobile crop center) hoặc **4:3** nếu ưu tiên nhiều text; chốt một tỉ lệ trong dev để pipeline ảnh thống nhất.  
- **Độ tương phản:** chữ trên hero đạt **WCAG AA** cho phần tiêu đề/CTA (mở rộng AAA cho body nếu khả thi).  
- **Hình ảnh sản phẩm:** grid vuông hoặc 4:5; lazy-load ngoài viewport đầu tiên.

---

## 8. Hai hướng thiết kế & lựa chọn mặc định

| Hướng | Mô tả | Khi nào chọn |
|-------|--------|----------------|
| **A — “Tự nhiên / Nông sản”** | Nền ấm, nhiều khoảng trắng, ảnh hero lớn; menu dạng **drawer** mobile. | Nhấn mạnh **Nông sản Việt**, organic. |
| **B — “Doanh nghiệp / Quà tặng”** | Layout gọn, khối rõ, typography cứng hơn; menu **mega đơn giản** trên desktop. | Nhấn **B2B quà**, niềm tin hợp đồng. |

**Mặc định đề xuất cho MVP:** **A** làm chủ đạo (ảnh và CTA nổi), **bổ sung block** “Quà doanh nghiệp” với layout B trên trang collection tương ứng (hybrid nhẹ, không tách theme).

---

## 9. Hành trình người dùng — chi tiết màn hình & hành vi

### J-Admin-1: Quản lý banner

| Bước | UI | Hành vi & trạng thái |
|------|-----|----------------------|
| 1 | Danh sách slide | Số thứ tự, thumbnail, trạng thái **Bật/Tắt**, hành động: Sửa, Xoá. |
| 2 | Thêm/Sửa slide | Upload ảnh (drag-drop); progress bar; sau xử lý hiển thị **2 thumbnail** (mobile/desktop derivative). |
| 3 | Trường nội dung | Tabs **Tiếng Việt | English**: Title, Subtitle, Button label, URL. Validation URL (NFR-4). |
| 4 | Lưu | Toast thành công + dòng “Hiển thị storefront: đến ~X phút” nếu ISR. |
| 5 | Reorder | Drag handle; auto-save hoặc nút “Lưu thứ tự”. |

**Lỗi:** file quá lớn / sai MIME → inline error dưới field ảnh; không mất các field text đã nhập.

### J-Admin-2: Logo

| Bước | UI | Hành vi |
|------|-----|--------|
| 1 | Card đơn | Upload SVG/PNG; giới hạn kích thước (theo kiến trúc). |
| 2 | Preview | Header giả lập trắng/xám đậm. |
| 3 | Lưu | Cùng pattern thông báo cache như banner. |

### J-Admin-3: Ngôn ngữ & catalog song ngữ

- Màn **Cấu hình:** toggle `en`; radio default `vi`.  
- Trong **Product / Collection** (extension): block **Bản dịch** — viền cảnh báo nếu **thiếu en** (không chặn save MVP).  
- Storefront: switcher **VI | EN** trên header; persist `NEXT_LOCALE` hoặc path (theo kiến trúc).

### J-Store-1: Trang chủ

| Vùng | Mobile | Desktop |
|------|--------|---------|
| Above header | (Tuỳ bật) **Announcement bar** full width | Giống mobile |
| Header | Logo trái **chỉ logo**; **drawer** = cùng cây nav 2 cấp; switcher; (giỏ nếu có) | Logo; **mega / dropdown 2 cấp** từ API; switcher |
| Hero | Full-bleed slider; **chấm hoặc thanh tiến trình**; vuốt; (tuỳ chọn autoplay **tắt** mặc định để giảm distraction — bật sau A/B) | Nút prev/next + dots |
| Below fold | (Tùy sprint) grid collection hoặc “Mục nổi bật” | Tương tự, 2–3 cột |

**Slider:** tap CTA mở URL (same tab trừ `target` cấu hình sau); swipe không xung đột với scroll dọc (threshold rõ).

### J-Store-2: Điều hướng collections

- Menu: danh sách **theo API**; loading skeleton; empty state “Chưa có danh mục”.  
- Collection có **sub-collection** (ngân sách): hiển thị dạng **chip** hoặc **accordion** trên cùng trang collection cha (quyết định implement trong architect — UX chấp nhận cả hai nếu một URL rõ ràng).

### J-Store-3: Sản phẩm & biến thể

- PDP: chọn biến thể (VD: Hộp 2/4/6 bánh) bằng **segmented control** hoặc **select**; giá đổi rõ ràng.  
- Nếu placeholder **Quà Tết:** badge “Sắp ra mắt” hoặc ẩn khỏi menu đến khi có sản phẩm (chiến lược PM — UX ghi nhận hai lựa chọn, mặc định **ẩn trống** khỏi menu chính).

---

## 10. Chiến lược component (Storefront)

| Component | Trách nhiệm | Ghi chú PRD/NFR |
|-----------|-------------|------------------|
| `SiteHeader` | Logo trái; slot nav; locale; actions | FR-11, FR-13 |
| `MegaNav` / `NavDrawer` | Cây 2 cấp từ API; skeleton | FR-25, FR-29, SC-6 |
| `AnnouncementBar` | Copy site-wide; dismiss tùy cấu hình | FR-33 |
| `SiteFooter` | Tên site, tagline, link, MXH/hotline CMS | FR-11b, FR-23, FR-32 |
| `LocaleSwitcher` | Đổi `vi/en`, giữ path | FR-5, NFR-5 |
| `HeroSlider` | Ảnh responsive, dots, CTA, link | FR-10, NFR-1,2 |
| `CmsContentPage` / `NotFoundCMS` | Trang `p/[slug]`; 404 copy CMS | FR-30, FR-38 |
| `ProductCard` | Ảnh, title theo locale | FR-4 |
| `VariantPicker` | Biến thể rõ ràng trên mobile | Appendix A — bánh Trung Thu |

**Admin extension:** `BannerList`, `BannerEditor`, `LogoSettings`, `LocaleSettings`, `TranslationFields`; bổ sung xem **§15.5**.

---

## 11. UX patterns (nhất quán)

- **Phân cấp nút:** một primary mỗi khối (Lưu / Xuất bản); huỷ = secondary text hoặc outline.  
- **Form validation:** lỗi hiển thị **inline** + focus field đầu tiên lỗi; không chỉ toast.  
- **Async:** skeleton cho nav và slider; **không** nhấp nháy layout (giữ chiều cao hero cố định hoặc aspect-ratio box).  
- **Modal:** dùng cho xác nhận xoá banner; trap focus; đóng ESC.  
- **Empty states:** Admin chưa có banner — CTA “Thêm slide đầu tiên”; storefront API lỗi — thông báo ngắn + thử lại.

---

## 12. Responsive & accessibility

**Breakpoints gợi ý:** 0–639 (mobile), 640–1023 (tablet), 1024+ (desktop).  
**Touch:** mục tiêu **44×44px** tối thiểu (PRD SC-5).  

**WCAG (mục tiêu):**

- Focus ring nhìn thấy trên mọi control tương tác.  
- Slider: nút prev/next có `aria-label`; slide có `aria-roledescription="carousel"`.  
- Ảnh mang `alt` từ Title (locale hiện tại).  
- Switcher ngôn ngữ: lang attribute cập nhật (`html lang="vi"` / `en`).

**Motion:** tôn trọng `prefers-reduced-motion` — giảm autoplay/chuyển cảnh.

---

## 13. Kiểm thử UX chấp nhận được (chốt nhanh)

| ID | Tiêu chí | Cách kiểm |
|----|-----------|-----------|
| UX-AC-1 | Đổi locale trên PDP và collection cập nhật title | Manual 2 ngôn ngữ |
| UX-AC-2 | Thêm slide mới → hiển thị sau TTL cache | Staging + đồng hồ |
| UX-AC-3 | Reorder banner → đúng thứ tự trên storefront | So sánh với Admin |
| UX-AC-4 | Mobile 360px không scroll ngang trên Home | DevTools + device |
| UX-AC-5 | Delete slide có confirm | Một lần yes/no |

---

## 14. Traceability tới PRD

| Mục UX | FR/SC tham chiếu |
|--------|-------------------|
| Slider + performance | FR-10, NFR-1,2, SC-3 |
| Menu collections | FR-13, SC-6 |
| i18n + switcher | FR-1…6, SC-1,2, NFR-5 |
| Banner/Logo Admin | FR-7…9, FR-11, J1 PRD |
| Responsive / touch | FR-12, SC-5 |
| Seed / structure | Phụ lục A PRD (IA menu) |

**Wave 2–3 (header CMS, trang tĩnh, SEO, announcement, v.v.):** xem bảng **§15.7**.

---

## 15. Bổ sung UX — Wave 2 & 3 (2026-04-06)

### 15.1 Nguyên tắc layout storefront (PRD FR-11…FR-29)

| Vùng | Hành vi UX |
|------|------------|
| Header | **Chỉ logo** (căn **trái**), không kèm text tên shop cạnh logo; chiều cao header gọn; logo `alt` = tên thương hiệu. |
| Nav desktop | **Mega / dropdown 2 cấp:** hover hoặc click mở cấp 2; **delay đóng** ngắn để không “giật”; keyboard: Esc đóng, mũi tên trong menu nếu khả thi. |
| Nav mobile | **Drawer** chứa **cùng cây** với desktop; nhóm có thể **accordion**; nút đóng ≥ 44px; **language/region** không chỉ hover — tap mở rõ. |
| Visual | **Chốt một tông:** nếu drawer tối thì có **lý do thương hiệu** hoặc chuyển drawer **nền sáng** để khớp header (NFR-8). |
| Footer | **Tên site + tagline** nổi bật; cột **Danh mục / Collections** (tên đã localize); **Khách hàng**; block **Liên hệ & MXH** từ CMS. |
| Announcement | Một dải full width, chữ ngắn; nút đóng (×) optional; contrast đạt AA. |

### 15.2 Trang CMS (`/p/[slug]`)

- Typography đọc lâu: max-width ~680–720px body; heading rõ cấp.  
- Không full-bleed text quá rộng trên desktop.  
- Breadcrumb: Trang chủ → Tên trang.

### 15.3 Hành trình Admin bổ sung

**J-Admin-4 — Menu 2 cấp**

| Bước | UI | Ghi chú |
|------|-----|--------|
| 1 | Cây + nút “Thêm nhóm” / “Thêm mục” | Validate tối đa độ sâu **2** (PRD). |
| 2 | Chọn loại mục: Collection (search handle) / Liên kết ngoài | Autocomplete collection. |
| 3 | Tabs vi \| en cho nhãn nhóm và nhãn override | Để trống override = dùng catalog. |
| 4 | Lưu | Toast + revalidate message; ghi **revision** (nếu bật). |

**J-Admin-5 — Trang nội dung & preview**

- Danh sách: cột slug, trạng thái, cập nhật lần cuối.  
- Editor: tabs vi/en; thanh công cụ rich text **tối thiểu** (bold, list, link) — tránh toolbar quá tải cho user phi kỹ thuật.  
- **Xem trước:** mở tab mới hoặc iframe có watermark “Bản nháp”; **Xuất bản** confirm một bước nếu trang đã public trước đó.

**J-Admin-6 — SEO / OG / Footer / Announcement / 404**

- Mỗi nhóm = **một card** trong cùng trang “Cài đặt hiển thị” hoặc sub-nav dọc.  
- Trường URL: placeholder `https://` + lỗi “Link chưa đúng định dạng” (NFR-9).

**J-Admin-7 — Hoàn tác**

- Sau **Lưu thành công**, toast có link “Xem lịch sử”.  
- Màn lịch sử: timestamp + user + **Khôi phục** → modal xác nhận.

### 15.4 Component bổ sung (storefront)

| Component | Trách nhiệm | PRD |
|-----------|-------------|-----|
| `AnnouncementBar` | Đọc settings; dismiss localStorage optional | FR-33 |
| `MegaNav` / `NavDesktop` | 2 cấp từ API `nav-menu` | FR-29 |
| `NavDrawer` | Cùng data; accordion | FR-25, FR-29 |
| `SiteFooter` | Brand + collections + contact + legal links | FR-11b, FR-23, FR-32 |
| `CmsContentPage` | Render body sanitized; metadata SEO | FR-30, FR-31 |
| `NotFoundCMS` | Copy từ API settings | FR-38 |

### 15.5 Component Admin bổ sung

`NavTreeEditor`, `CmsPageList`, `CmsPageEditor`, `SeoSettingsCard`, `FooterContactForm`, `AnnouncementForm`, `NotFoundCopyForm`, `RevisionDrawer`, `HelpSheet`, `MediaPickerField` (chọn file đã có).

### 15.6 Kiểm thử UX bổ sung

| ID | Tiêu chí | Cách kiểm |
|----|-----------|-----------|
| UX-AC-6 | Checklist SC-13 (5 thao tác) không cần dev | UAT script |
| UX-AC-7 | Lỗi lưu CMS = tiếng Việt, không stack | Cố tình URL sai |
| UX-AC-8 | Menu mobile = cùng mục desktop | So sánh checklist handle |
| UX-AC-9 | Preview không lộ draft trên tab ẩn danh không token | Security smoke |
| UX-AC-10 | 404 hiển thị copy CMS đúng locale | Đổi vi/en |

### 15.7 Traceability PRD (bổ sung)

| Mục UX | FR / SC |
|--------|---------|
| Header/footer thương hiệu | FR-11, FR-11b, SC-12 |
| Menu CMS 2 cấp | FR-29, SC-6 |
| i18n UI | FR-22, SC-10 |
| Trang tĩnh, preview | FR-30, FR-34 |
| SEO, OG | FR-31 |
| Footer MXH | FR-32 |
| Announcement | FR-33 |
| Media picker | FR-35 |
| Help | FR-36 |
| Undo | FR-37 |
| 404 | FR-38 |
| Lỗi Admin | NFR-9, SC-14 |

---

## Bước BMad tiếp theo

- **`bmad-create-epics-and-stories`** — tách epic Wave 2 (nav + layout SF) và Wave 3 (CMS pages + settings).  
- **`bmad-check-implementation-readiness`** — đối chiếu PRD + `architecture.md` + đặc tả này.  
- **`bmad-dev-story` / implement** — ưu tiên migration settings + `nav-menu` API + layout header/footer.
