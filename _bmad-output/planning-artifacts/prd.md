---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
inputDocuments: []
documentCounts:
  briefCount: 0
  researchCount: 0
  brainstormingCount: 0
  projectDocsCount: 0
lastEdited: "2026-04-07"
editNote: >-
  Wave 2 storefront + validate/edit. Wave 3 CMS phi kỹ thuật — FR-30…38, J8, SC-13…14, NFR-9.
  Wave 4 (2026-04-07): Tin tức + editor: bắt buộc ADR chọn **một** — block **hoặc** WYSIWYG một vùng; bài báo + copy/paste Word/web — FR-39…FR-46, J9, SC-15…SC-16, NFR-10.
workflowType: prd
workflowNote: >-
  PRD được hoàn thiện từ yêu cầu chi tiết do stakeholder cung cấp trong phiên làm việc
  (greenfield, Medusa + Next.js). Không có brief/research đính kèm trong repo.
classification:
  projectContext: greenfield
  productType: web_storefront_plus_headless_cms_admin
  domain: e-commerce
  domainComplexity: medium
---

# Tài liệu Yêu cầu Sản phẩm (PRD) — CMS & Thương mại điện tử trên Medusa

**Dự án:** ecomerce-viet-lol  
**Tác giả:** HieuTV-Team-MedusaV2  
**Ngày ban đầu:** 2026-03-30 · **Sửa đổi lần cuối:** 2026-04-07  

## Tóm tắt điều hành

Cần xây bộ **headless commerce + quản trị nội dung** dựa trên **Medusa (mã nguồn mở)**: back-office quản lý đa ngôn ngữ (vi/en), module banner/logo, dữ liệu danh mục/sản phẩm seed có cấu trúc, và **storefront Next.js** hiển thị slider, menu theo collection, tối ưu hình ảnh và mobile. **Mặc định thị trường Việt Nam:** ngôn ngữ giao diện và nội dung ưu tiên **`vi`**, **vùng (region) Medusa gắn quốc gia `vn`**, **tiền tệ mặc định VND**; cấu hình CMS/API và biến môi trường storefront phản ánh các mặc định này.

**Người dùng mục tiêu:** quản trị viên vận hành (Admin), khách mua hàng (storefront).  

**Khác biệt trong phạm vi MVP:** đa ngôn ngữ gắn với Medusa Admin, CMS banner/logo first-party trong Admin (không chỉ dựa vào file tĩnh), seed dữ liệu phản ánh đúng danh mục hàng Việt / quà tặng doanh nghiệp.

**Growth (đã chi tiết hóa trong PRD):** locale thứ ba+, workflow duyệt nội dung, RBAC Admin, banner theo lịch và A/B — kèm SC-7…SC-9 và FR-17…FR-21.

**Wave 2 (2026-04-06):** hoàn thiện **storefront** — nhất quán ngôn ngữ UI, i18n footer/collection, drawer/touch, a11y và visual system; **header chỉ logo (trái)**, **tên site từ thiết lập ở footer**, **menu 2 cấp từ CMS**; SC-10…SC-12 và FR-22…FR-29.

**Wave 3 (2026-04-06):** **CMS vận hành cho người phi kỹ thuật** — trang nội dung tĩnh, SEO cơ bản, liên hệ & mạng xã hội, thanh thông báo, preview/xuất bản an toàn, thư viện ảnh, trợ giúp trong Admin, lịch sử/hoàn tác tối thiểu, trang 404 có thể chỉnh; **SC-13…SC-14**, **FR-30…FR-38**, **NFR-9**.

**Wave 4 (2026-04-07):** **Tin tức trên storefront** — mục menu **Tin tức**; Admin tạo bài **đủ năng lực bài báo**, đa ngôn ngữ; **kiến trúc bắt buộc chọn một** mô hình soạn thảo: **block editor** *hoặc* **một vùng WYSIWYG** (không triển khai song song hai UI editor cho cùng thân bài); trong mô hình đã chọn phải có **ảnh trong luồng bài** (inline hoặc khối ảnh tùy ADR) và **copy/paste** từ Word/trình duyệt; SEO theo bài; **FR-39…FR-46**, **J9**, **SC-15…SC-16**, **NFR-10**.

## Tiêu chí thành công (SMART)

| ID | Tiêu chí | Đo lường |
|----|-----------|----------|
| SC-1 | Ngôn ngữ storefront & nội dung catalog | Người dùng cuối xem được UI và nội dung sản phẩm/collection ở **vi** và **en**; mặc định **vi** (URL, cookie, CMS `default_locale`, định dạng số/tiền ưu tiên `vi-VN` khi không có lựa chọn khác). |
| SC-1b | Giá & vùng mặc định | Storefront và giỏ hàng dùng **region Medusa** tương ứng quốc gia **`vn`**; giá catalog và seed thể hiện bằng **VND** (đồng bộ `supported_currencies` store). |
| SC-2 | Cấu hình ngôn ngữ từ Admin | 100% thay đổi ngôn ngữ được hỗ trợ (bật/tắt, mặc định) thực hiện qua **Medusa Admin** mà không cần deploy lại storefront. |
| SC-3 | Banner có thể vận hành | ≥1 banner có đủ ảnh, tiêu đề, phụ đề, URL, text nút; slider hiển thị trên trang chủ storefront ≤ **3 giây** (LCP chỉ báo từ thiết bị mid-tier 4G, trung bình 3 lần đo manual). |
| SC-4 | Seed & migration | Chạy một lệnh migration/seed chuẩn hóa (document cụ thể trong kiến trúc) tạo đủ **collection, product type, sản phẩm, biến thể** theo mục Phụ lục A; không lỗi idempotent khi chạy lại trên DB sạch. |
| SC-5 | Storefront responsive | Layout **không tràn ngang** và nút/CTA **chạm tối thiểu 44×44px** trên viewport 360px và 390×844. |
| SC-6 | Menu điều hướng | **Trước FR-29:** menu load **động** từ collections (seed/Admin); mục mới xuất hiện sau refresh/revalidate. **Sau khi FR-29 triển khai:** cây menu **hai cấp** lấy từ **cấu hình CMS**; collections có thể chỉ là **đích/đồng bộ tên** (metadata i18n), không nhất thiết là nguồn duy nhất của toàn bộ cây — kiểm tra acceptance theo **J7** và **SC-11**. |
| SC-7 | Locale bổ sung (Growth) | Ít nhất **một locale thứ ba** (mã chuẩn hóa trong kiến trúc) được bật từ Admin; storefront hiển thị UI + nội dung catalog/banner cho locale đó khi đã nhập; fallback theo quy tắc đã chọn. |
| SC-8 | Duyệt nội dung & phân quyền (Growth) | Thay đổi trạng thái nội dung (draft → xuất bản) theo **workflow** định nghĩa; ít nhất **hai vai** Admin có quyền khác nhau (ví dụ chỉnh sửa vs phê duyệt/xuất bản); 100% thao tát xuất bản ghi nhận được actor (audit tối thiểu trong kiến trúc). |
| SC-9 | Banner theo thời gian hoặc A/B (Growth) | Banner có thể **lên lịch** (có hiệu lực trong khoảng thời gian) và/hoặc tham gia **thử nghiệm A/B** (chia nhóm hiển thị theo quy tắc document trong kiến trúc); storefront chỉ render slide hợp lệ theo thời gian và nhóm thử nghiệm. |
| SC-10 | Nhất quán ngôn ngữ UI (wave 2) | Xem bảng “Tiêu chí thành công bổ sung (wave 2)”. |
| SC-11 | Footer/header đồng bộ tên collection (wave 2) | Xem bảng “Tiêu chí thành công bổ sung (wave 2)”. |
| SC-12 | Header / footer thương hiệu (wave 2) | Header chỉ **logo** (căn **trái**); **tên site** (CMS) hiển thị ở **footer**, không trùng lặp tiêu đề cạnh logo trên header (audit layout + snapshot vi/en). |
| SC-13 | Self-service CMS (wave 3) | Người vận hành **không chuyên IT** hoàn thành **checklist 5 thao tác** trong Admin (đổi logo hoặc 1 slide banner; sửa tagline/footer; bật/tắt **thanh thông báo**; sửa **một** liên kết footer/MXH; xem trước hoặc xuất bản an toàn theo **FR-34**) **không cần hỗ trợ dev** — UAT có script + quan sát. |
| SC-14 | Form thân thiện (wave 3) | **100%** màn CMS wave 3 có **thông báo lỗi/success** bằng **tiếng Việt** dễ hiểu khi lưu thất bại; không hiển thị **stack trace** hay mã lỗi thô cho user Admin (theo **NFR-9**). |
| SC-15 | Tin tức end-to-end (wave 4) | Biên tập viên tạo **một** bài tin có **≥2 locale** (ví dụ `vi`+`en`), gồm **ít nhất một ảnh trong thân bài** và **văn bản định dạng** (theo **FR-45**); **copy/paste** từ **Word hoặc trang web** mẫu (đoạn có heading/list/đậm + link) → nội dung hiển thị ổn trong Admin và sau **publish** trên storefront (định dạng được **giữ hoặc chuẩn hoá** có kiểm chứng — không mất toàn bộ nội dung, không HTML nguy hiểm — **NFR-10**); **preview** (hoặc draft) rồi **publish**; **không cần deploy code**. |
| SC-16 | Đọc bài trên mobile (wave 4) | Trang chi tiết tin trên viewport **360px**: độ rộng dòng đọc và cỡ chữ body đạt ngưỡng **UX đã chốt** (không tràn ngang; ảnh responsive; chữ không nhỏ hơn mức tối thiểu trong spec); kiểm tra **2** bài mẫu UAT. |

## Phạm vi sản phẩm

### MVP (phát hành đầu)

- Đa ngôn ngữ **vi/en** cho UI storefront và **nội dung sản phẩm/collection** (hai trường song ngữ).
- Admin: quản lý **banner (slider)**, **logo toàn site**, cấu hình ngôn ngữ.
- Seed toàn bộ cấu trúc ở Phụ lục A (bao gồm placeholder **Quà Tết**).
- Storefront Next.js: trang chủ slider, điều hướng theo collections, responsive, ưu tiên hình nét và tải nhanh.

### Growth (sau MVP)

**Mục tiêu:** mở rộng vận hành và marketing mà không phá vỡ mô hình headless hiện có.

1. **Đa ngôn ngữ mở rộng**  
   - Thêm **tối thiểu một locale thứ ba** (ngoài `vi`, `en`), cấu hình bật/tắt và mặc định trong Admin.  
   - Mở rộng **metadata / trường i18n** cho product, collection và trường text banner theo cùng pattern với MVP (chi tiết schema trong kiến trúc).

2. **Workflow duyệt nội dung**  
   - Trạng thái tối thiểu gợi ý: **draft**, **chờ duyệt**, **đã xuất bản** (tên chính xác và số trạng thái có thể tinh chỉnh khi thiết kế).  
   - Chỉ nội dung **đã xuất bản** được Store API / storefront hiển thị công khai (trừ preview có auth — tùy chọn trong kiến trúc).

3. **Phân quyền chi tiết trong Admin**  
   - Ít nhất hai vai: ví dụ **Biên tập** (tạo/sửa draft) và **Xuất bản** (phê duyệt / publish).  
   - Tùy chọn vai **Chỉ xem** cho audit.  
   - Mapping vai ↔ thao tác CMS và catalog Growth do kiến trúc chốt (Medusa user / custom policy).

4. **Banner theo thời gian và/hoặc A/B**  
   - **Lên lịch:** mỗi slide (hoặc nhóm slide) có **start_at / end_at** (timezone document hóa).  
   - **A/B:** định nghĩa **variant** hoặc **chiến dịch** gán tỷ lệ hoặc cohort (chi tiết thuật toán trong kiến trúc — không bắt buộc tích hợp công cụ bên thứ ba ở bản Growth đầu).

### Wave 3 — CMS hiện đại cho người vận hành phi kỹ thuật

**Mục tiêu:** người **không hiểu công nghệ** vẫn **tự chỉnh nội dung cơ bản** của storefront (text, link, ảnh, SEO tối thiểu) qua Medusa Admin / module CMS — **không** cần sửa code hay deploy storefront cho mỗi lần đổi copy.

- **Trang nội dung** (Giới thiệu, Điều khoản, Bảo mật, Liên hệ, …) chỉnh **vi/en** trong Admin.  
- **SEO cơ bản** (title/description mặc định, OG mặc định).  
- **Footer:** hotline, email, link MXH, cột link pháp lý — cấu hình CMS.  
- **Thanh thông báo** site-wide; **preview / xuất bản** an toàn cho thay đổi CMS.  
- **Thư viện ảnh** hoặc chọn lại asset đã có; **trợ giúp** ngay trong Admin (tiếng Việt).  
- **Lịch sử / hoàn tác** tối thiểu; **trang 404** có copy chỉnh được.

Chi tiết năng lực: **FR-30…FR-38**; tiêu chí **SC-13, SC-14**; **NFR-9**.

### Wave 4 — Tin tức (blog / newsroom)

**Mục tiêu:** khách thấy **Tin tức** trên storefront; Admin soạn **bài viết dạng báo** (ảnh + chữ linh hoạt), **đa ngôn ngữ**, không phụ thuộc dev mỗi lần đăng bài.

- **Điều hướng:** thêm mục menu **Tin tức** (cùng nguồn CMS/nav với **FR-29** hoặc endpoint tương đương — kiến trúc chốt).  
- **Storefront:** danh sách bài đã xuất bản + trang chi tiết theo **slug** (và locale).  
- **Admin:** CRUD bài tin; **draft / publish / preview** thống nhất **FR-34** và (khi bật) **FR-18** / **FR-19**.  
- **Soạn thảo:** **architecture.md / ADR** ghi rõ **một** lựa chọn duy nhất: **block editor** *hoặc* **một ô WYSIWYG** cho thân bài (cả hai đều được phép về mặt sản phẩm — nhưng **chỉ một** được triển khai). Yêu cầu nghiệp vụ: soạn được **bài báo** (heading, đoạn, list, đậm/nghiêng, link, trích dẫn/callout tối thiểu) và **chèn ảnh** (upload hoặc thư viện **FR-35**, inline hoặc khối — theo ADR). **Copy/paste** từ Word/browser: hỗ trợ **dán nội dung có cấu trúc**; nội dung dán qua **sanitize** (**NFR-10**); ảnh dán có thể **upload lên media** hoặc **strip** có thông báo — hành vi cụ thể do ADR + story, miễn không gây lỗi im lặng hoặc XSS.  
- **SEO:** meta title/description (**vi** / **en** / locale bật) và OG ảnh **theo bài** khi có cấu hình.

**Ngoài phạm vi wave 4 (có thể phase sau):** bình luận, đăng ký newsletter, RSS, phân quyền tác giả đa người, workflow phê duyệt nhiều cấp riêng cho tin tức (nếu chưa dùng chung FR-18).

**Ngoài phạm vi Growth (giữ cho Vision hoặc phase sau):** personalization theo hành vi, marketing automation đa kênh, ERP, thử nghiệm đa biến phức tạp ngoài banner.

### Vision (dài hạn)

- Personalization theo locale, tích hợp marketing automation, ERP.

## Hành trình người dùng

### J1 — Quản trị viên: cập nhật banner và logo

1. Đăng nhập Medusa Admin.  
2. Mở module **Quản lý Banner**: thêm/xóa/reorder slide; upload ảnh; nhập tiêu đề, phụ đề, URL, text nút (vi/en nếu áp dụng theo thiết kế dữ liệu).  
3. Lưu; ảnh được tối ưu (web/mobile).  
4. Mở **Logo**: upload logo mới; logo hiển thị trên storefront sau khi cache/revalidate.

**Traceability:** FR-1 → FR-4, FR-7.

### J2 — Quản trị viên: quản lý ngôn ngữ catalog

1. Bật **en** và đặt **vi** làm mặc định trong cấu hình Admin.  
2. Sửa sản phẩm/collection: điền nội dung **cả hai ngôn ngữ**.  
3. Lưu; storefront hiển thị đúng locale theo lựa chọn người dùng hoặc mặc định.

**Traceability:** FR-5, FR-6.

### J3 — Khách: xem trang chủ và điều hướng

1. Mở storefront trên mobile.  
2. Thấy **slider banner** tải mượt, ảnh sắc nét.  
3. Mở menu: **trước wave 2 / FR-29** — thấy **collections** khớp dữ liệu catalog (ví dụ Saffron, Mỹ Phẩm, …). **Sau FR-29** — cây menu **hai cấp** khớp **thiết lập CMS**; tên mục gắn collection đồng bộ i18n như **J7**.  
4. Chuyển locale **vi/en** (theo cơ chế UI); nội dung sản phẩm đổi tương ứng khi đã nhập.

**Traceability:** FR-8 → FR-14; **J7** (wave 2: FR-22…FR-29, SC-10…SC-12).

### J4 — Kỹ sư triển khai: khởi tạo DB

1. Chạy migration + seed.  
2. Kiểm tra DB có đủ entities theo Phụ lục A.  
3. Storefront/API đọc được collections/products.

**Traceability:** FR-13, FR-14.

### J5 — Biên tập / Xuất bản: locale mới và duyệt nội dung (Growth)

1. Quản trị viên có quyền **Biên tập** cập nhật nội dung song ngữ/đa ngữ và đặt trạng thái **draft** hoặc gửi **chờ duyệt**.  
2. Quản trị viên có quyền **Xuất bản** xem diff/tóm tắt thay đổi (mức tối thiểu do kiến trúc) và **phê duyệt** → trạng thái published.  
3. Storefront chỉ thấy bản đã xuất bản; locale thứ ba hiển thị đúng khi đã cấu hình và có dữ liệu.

**Traceability:** FR-17, FR-18, FR-19, SC-7, SC-8.

### J6 — Marketing: lịch banner và thử nghiệm (Growth)

1. Tạo hoặc chỉnh slide với **khung thời gian hiển thị**; xác minh preview trong Admin (nếu có).  
2. (Tuỳ chọn) Gắn slide vào **chiến dịch A/B** với tỷ lệ hoặc nhóm đích theo thiết kế.  
3. Storefront/API trả về tập slide hợp lệ theo thời gian và quy tắc thử nghiệm.

**Traceability:** FR-20, FR-21, SC-9.

### J7 — Khách: storefront “đẹp, dễ dùng”, nhất quán (wave 2)

1. Mở storefront trên **mobile**: menu (drawer) dễ đọc, đóng rõ ràng; chuyển ngôn ngữ/vùng **không chỉ phụ thuộc hover** (touch-friendly).  
2. **Header:** chỉ thấy **logo** (căn **trái**), không thấy tên shop lặp lại cạnh logo; **tên site** từ thiết lập xuất hiện rõ ở **footer**. So sánh **header, menu, footer**: cùng locale thì nhãn điều hướng **cùng ngôn ngữ** (vi/en), không xen kẽ tùy hứng.  
3. **Desktop:** menu điều hướng **hai cấp** (cấp 1 + cấp 2) khớp **cấu hình CMS**; mục con mở bằng hover/click/keyboard theo UX spec.  
4. Danh sách **collections/categories** (và mục menu gắn collection) hiển thị **tên đã localize** (metadata i18n) thống nhất với trang danh mục.  
5. Logo có `alt` mô tả thương hiệu; trạng thái focus/hover đủ tương phản (NFR-7).

**Traceability:** FR-11 (bổ sung layout), FR-22 → FR-29, SC-10…SC-12, NFR-7.

### J8 — Vận hành viên phi kỹ thuật: tự chỉnh website cửa hàng

1. Đăng nhập Admin bằng tài khoản được cấp (vai **Biên tập nội dung** hoặc tương đương — không cần quyền dev).  
2. Mở **Hướng dẫn / Trợ giúp** (FR-36) để xem các bước ngắn bằng tiếng Việt.  
3. Sửa **trang nội dung** (ví dụ Chính sách giao hàng) **vi/en**; **xem trước** (FR-34) rồi **xuất bản** (hoặc lưu bản nháp nếu có workflow).  
4. Cập nhật **SEO mặc định** (title/description) và kiểm tra storefront sau vài phút (cache/revalidate).  
5. Bật **thanh thông báo** khuyến mãi; chỉnh **hotline + link Zalo/Facebook** ở footer; nếu sai, dùng **hoàn tác / phiên bản trước** (FR-37) hoặc sửa lại theo thông báo lỗi rõ ràng (NFR-9).

**Traceability:** FR-30 → FR-38, SC-13, SC-14, NFR-9; bổ sung cho **FR-18** nếu dùng draft/publish cho trang CMS.

### J9 — Biên tập & khách: tin tức (wave 4)

1. **Admin:** Mở màn **Quản lý tin tức** (hoặc tên tương đương); tạo bài mới; nhập **tiêu đề**, (tuỳ chọn) **mô tả ngắn** / **ảnh đại diện** cho từng **locale** đang bật.  
2. Trong thân bài (theo **một** mô hình editor đã chọn — **FR-44**): soạn **như bài báo** hoặc **dán** từ Word/web; chèn **ảnh** (upload/thư viện hoặc qua paste nếu ADR hỗ trợ); kiểm tra hiển thị trong Admin.  
3. Lưu **nháp**; dùng **xem trước** (**FR-34**); khi sẵn sàng, **xuất bản** (theo quyền **FR-19** nếu áp dụng).  
4. **Khách:** Từ header/menu chọn **Tin tức**; xem **danh sách** bài mới nhất; mở **chi tiết**; chuyển locale → thấy bản dịch hoặc fallback theo quy tắc CMS hiện có.

**Traceability:** FR-39 → FR-46, SC-15, SC-16, NFR-10; liên quan **FR-29** (menu), **FR-34**, **FR-35**, **FR-31** (SEO mặc định).

## Yêu cầu theo lĩnh vực (Thương mại điện tử)

- Nếu **thu thập thanh toán thẻ** qua Medusa/PSP: tuân **PCI-DSS** theo hướng dẫn của nhà cung cấp (không lưu PAN thô trên hệ thống tự phát triển).  
- Độ chính xác **giá và biến thể** trong Admin phải đồng bộ với storefront.  
- **Thuế / vận chuyển:** ngoài phạm vi PRD chi tiết — ghi nhận là quyết định kiến trúc/bổ sung sprint sau (không chặn MVP nếu chỉ bán catalog + liên hệ).

## Yêu cầu theo loại dự án & ràng buộc kỹ thuật (do stakeholder chỉ định)

| Thành phần | Công nghệ | Ghi chú |
|------------|-----------|---------|
| Nền tảng commerce & Admin | Medusa Open Source | API Admin/Store; mở rộng bằng custom API/entities/workflow phù hợp phiên bản đang dùng. Seed/dev: **region Vietnam (`vn`), currency mặc định VND**. |
| Storefront | Next.js | SSR/ISR theo NFR; tích hợp slider và menu động. **`NEXT_PUBLIC_DEFAULT_REGION=vn`** (map region theo country `vn`), i18n path **`/vi` mặc định**. |
| Media | Theo kiến trúc (S3/local + processor) | Banner cần resize/optimization; hỗ trợ mobile + desktop. |

Các FR dưới đây mô tả **khả năng**; mapping chi tiết entity Medusa (product metadata vs translation plugin vs bảng tùy chỉnh) thuộc **tài liệu kiến trúc** sau PRD.

## Yêu cầu chức năng

### Đa ngôn ngữ & Admin

- **FR-1:** Hệ thống hỗ trợ đúng **hai ngôn ngữ locale: `vi` và `en`**.  
- **FR-2:** Locale mặc định của storefront là **`vi`**.  
- **FR-2b:** Vùng bán hàng / định giá mặc định cho storefront là **Việt Nam** (Medusa **region** chứa quốc gia **`vn`**); **tiền tệ mặc định của store là VND**; biến môi trường storefront (ví dụ `NEXT_PUBLIC_DEFAULT_REGION`) và seed dữ liệu **mặc định khớp `vn` + VND** trên môi trường dev.  
- **FR-3:** Quản trị viên cấu hình ngôn ngữ (bật `en`, đổi mặc định nếu được phép thiết kế) **trong Medusa Admin**; thay đổi có hiệu lực không yêu cầu sửa mã storefront (trừ khi bổ sung locale mới không có trong MVP).  
- **FR-4:** **Mỗi sản phẩm và collection** có cấu trúc nội dung cho **cả hai ngôn ngữ** (tối thiểu: tên; khuyến nghị: mô tả ngắn/dài nếu có trên storefront).  
- **FR-5:** Storefront chọn hiển thị nội dung theo **locale đang active**; fallback: **vi** nếu thiếu bản dịch (hành vi fallback ghi rõ trong kiến trúc).  
- **FR-6:** Medusa Admin hiển thị/truy cập được trường song ngữ cho sản phẩm/collection (qua metadata UI tùy chỉnh hoặc extension tương đương).

### Quản lý Banner (CMS trong Admin)

- **FR-7:** Quản trị viên tạo **nhiều banner** thuộc một **slider** trang chủ; thứ tự slide **có thể sắp xếp**.  
- **FR-8:** Mỗi banner có: **hình** (upload), **tiêu đề**, **phụ đề**, **hyperlink (URL)**, **text nút tùy chỉnh**; các trường text hỗ trợ **song ngữ** nếu cùng pattern với catalog (khuyến nghị để nhất quán với SC-1).  
- **FR-9:** Hệ thống **tự tạo phiên bản tối ưu** ảnh banner cho **web và mobile** (ít nhất hai breakpoint width định nghĩa trong kiến trúc; ví dụ desktop ≥1280px và mobile ≤430px).  
- **FR-10:** Storefront **đọc cấu hình banner** qua API (custom hoặc mở rộng Medusa) và render slider trên **trang chủ**.

### Logo & thương hiệu header/footer

- **FR-11:** Quản trị viên cập nhật **logo toàn site** từ Admin; storefront **header** hiển thị **chỉ logo** (không kèm block tiêu đề shop bên cạnh logo), **căn trái** theo layout wave 2; logo mới có hiệu lực sau pipeline revalidate/cache bust.  
- **FR-11b:** **Tên site** (`site_title` từ thiết lập CMS, với fallback env nếu được phép thiết kế) **không** hiển thị trên header; **bắt buộc** hiển thị ở **footer** (khu vực thương hiệu / cột giới thiệu), đồng bộ **locale** và tuân **FR-22** / **FR-27** (không hard-code một ngôn ngữ khi `en` active). **Giai đoạn chuyển tiếp:** nếu CMS chỉ có một trường `site_title` đơn ngôn ngữ, bản `en` có thể tạm lấy từ env/copy cố định đã document cho đến khi schema **i18n** (kiến trúc) sẵn sàng — không coi là vi phạm FR-11b nếu đã ghi rõ trong story triển khai.

### Storefront Next.js

- **FR-12:** Giao diện **responsive** toàn trang ưu tiên mobile-first.  
- **FR-13:** **Thanh điều hướng** phục vụ người dùng cuối: dữ liệu **không hard-code** danh sách tĩnh trùng seed trong mã production (cho phép fallback dev-only nếu document hóa). **Wave 2:** cấu trúc menu **hai cấp** do **FR-29**; trước khi có cấu hình CMS đầy đủ, có thể **tạm** lấy collections từ API theo quy tắc kiến trúc — khi FR-29 đã triển khai, **ưu tiên** cấu hình CMS.  
- **FR-14:** Trang chủ hiển thị **slider banner** lấy từ CMS; hỗ trợ **lazy-load / srcset / format hiện đại** để cân bằng chất lượng và LCP (chi tiết kỹ thuật trong NFR).

### Dữ liệu & seed

- **FR-15:** Một quy trình **migration/tự động hóa seed** tạo cấu trúc dữ liệu trong **Phụ lục A** (collections, product types, sản phẩm, biến thể, sub-category được mô hình hóa như collection con hoặc metadata — quyết định trong kiến trúc).  
- **FR-16:** Seed **idempotent** trên môi trường dev: chạy lại không tạo bản trùng lặp gây lỗi unique constraint (chiến lược upsert ghi trong kiến trúc).

### Growth — Đa ngôn ngữ, workflow, phân quyền, banner nâng cao

- **FR-17:** Hệ thống hỗ trợ **thêm ít nhất một mã locale thứ ba** ngoài `vi` và `en`; Admin cho phép **bật/tắt** locale và (tùy chọn) đặt **mặc định** trong giới hạn business rule; storefront và trường i18n catalog/banner **mở rộng** theo cùng nguyên tắc fallback như MVP.  
- **FR-18:** Nội dung thuộc phạm vi Growth (tối thiểu: **banner slides** và **trường i18n catalog** tùy quyết định kiến trúc) có **trạng thái vòng đời** (draft / chờ duyệt / published hoặc tương đương); chỉ trạng thái **published** được phục vụ qua Store API công khai.  
- **FR-19:** **Phân quyền trong Admin** cho Growth: ít nhất **hai vai** với quyền khác biệt (tạo/sửa draft **không** đồng nghĩa publish); có thể mở rộng vai chỉ đọc; mapping cụ thể vào Medusa auth/custom policy trong kiến trúc.  
- **FR-20:** **Lên lịch banner:** mỗi slide có thể có **thời điểm bắt đầu và kết thúc** hiển thị (timezone và độ chính xác theo kiến trúc).  
- **FR-21:** **A/B banner (Growth):** hỗ trợ gán slide hoặc nhóm slide vào **chiến dịch** với luật chia nhóm (ví dụ tỷ lệ ngẫu nhiên hoặc theo session) — chi tiết thuật toán và giới hạn số chiến dịch đồng thời do kiến trúc; storefront nhận đúng variant theo luật đã cấu hình.

### Storefront — trải nghiệm, thẩm mỹ, nhất quán (wave 2)

_Phần này bổ sung sau khi storefront MVP đã chạy; đồng thuận đa vai ghi tóm tắt bên dưới._

**Đồng thuận đa vai (PM · BA · Tech Lead · Designer)**

- **Minh (PM):** Ưu tiên **niềm tin và độ hoàn chỉnh cảm nhận**: khách không được thấy menu tiếng Anh ở header nhưng footer tiếng Việt — trông như sản phẩm dở dang. Mục tiêu wave 2 là **một lớp hoàn thiện UX** trước khi mở rộng tính năng mua hàng phức tạp.  
- **Lan (BA):** Chuẩn hóa **bảng thuật ngữ** (Menu / Trang chủ / Cửa hàng / Giỏ / Tài khoản / Danh mục / Bộ sưu tập) theo **locale đang xem**; mọi nhãn UI cố định phải map qua i18n (hoặc bộ string) — không hard-code lẫn hai ngôn ngữ trên cùng màn.  
- **Khoa (Tech Lead):** Tái sử dụng **`displayCollection` / helper i18n catalog** cho footer và mọi list collection; giới hạn `slice(0, 6)` trên desktop nav cần **quy tắc sản phẩm** (sort, featured, hoặc “xem thêm”) thay vì cắt im lặng. Drawer menu: **backdrop**, **z-index**, **touch** (language/region) phải hoạt động trên mobile không cần hover.  
- **Hương (Designer):** **Mood header sáng** vs **panel menu tối glass** tạo cảm giác không cùng hệ; chọn **một hướng palette** (ví dụ light + border rõ, hoặc dark header có chủ đích) và **typography scale** nhất quán (tránh `text-2xl`/`text-3xl` lẫn lộn không có hierarchy). Logo: luôn có **alt text**; trạng thái hover không được làm mờ nhãn dưới ngưỡng đọc được.

- **FR-22:** Toàn bộ **nhãn điều hướng cố định** trên storefront (ví dụ: Menu, Home, Store, Account, Cart, Categories, Collections và các nhóm footer) hiển thị theo **locale hiện tại** (`vi` | `en`) qua cơ chế i18n thống nhất; không hiển thị song song hai ngôn ngữ cho cùng một vai trò UI trừ khi là nội dung song ngữ có chủ đích (ví dụ song song title/subtitle).  
- **FR-23:** **Footer** dùng cùng logic **tên collection đã localize** như header/menu (metadata `i18n` / helper đã chốt trong kiến trúc), không chỉ `collection.title` thô.  
- **FR-24:** **Điều hướng desktop**: số lượng collection hiển thị trên thanh ngang có **quy tắc nghiệp vụ** document hóa (thứ tự, giới hạn, entry “Xem thêm” hoặc nhóm) — không chỉ cắt tĩnh N mục không giải thích.  
- **FR-25:** **Side menu / drawer**: điều khiển chọn **ngôn ngữ và vùng** usable trên **touch** (không chỉ `mouseenter`/`mouseleave`); đảm bảo đóng menu bằng backdrop/nút rõ ràng và **focus trap** hợp lý cho bàn phím (mức tối thiểu: đóng và trả focus).  
- **FR-26:** **Logo** trong header có **thuộc tính `alt`** mô tả thương hiệu (hoặc `alt` rỗng chỉ khi có `aria-label` tương đương trên link — một phương án duy nhất, document trong UX).  
- **FR-27:** **Nội dung marketing footer** (tagline mô tả shop) hỗ trợ **hai ngôn ngữ** hoặc lấy từ CMS/settings (nếu đã có trường); không hard-code một ngôn ngữ khi locale đang `en`.  
- **FR-28:** **CTA / branding nhà phát triển** (ví dụ “Powered by…”) chỉ hiển thị **môi trường dev/staging** hoặc có **cờ cấu hình** tắt trên production — tránh làm giảm cảm nhận thương hiệu trên site thật (chi tiết triển khai trong story).  
- **FR-29:** **Menu điều hướng header hai cấp** (cấp 1 = nhóm; cấp 2 = mục con) được **định nghĩa và sắp xếp trong Medusa Admin / module CMS** (thiết lập lưu trong DB hoặc JSON schema do kiến trúc chốt), phục vụ qua **Store API** (mở rộng `cms-settings` hoặc endpoint riêng `nav-menu`); storefront đọc cấu hình và render **desktop + mobile** (drawer tương đương hai cấp). Mỗi nhãn hỗ trợ **vi/en**; mục trỏ tới **handle collection/product category** hoặc **URL ngoài** theo quy tắc **NFR-4**. Không nhân đôi nguồn sự thật: nếu mục gắn collection, **tên hiển thị** lấy theo **metadata i18n** catalog khi kiến trúc quy định “đồng bộ từ catalog”, trừ khi Admin ghi đè nhãn tùy chỉnh (hành vi ghi trong kiến trúc/UX).

### CMS — vận hành & self-service (wave 3, người phi kỹ thuật)

- **FR-30:** **Trang nội dung CMS** (tối thiểu các loại: Giới thiệu, Điều khoản sử dụng, Chính sách bảo mật, Liên hệ — danh mục có thể mở rộng) có thể **tạo/sửa** trong Admin với nội dung **vi** và **en** (rich text hoặc markdown do kiến trúc chốt); storefront render theo **slug** cố định hoặc cấu hình; **không** yêu cầu deploy code khi đổi nội dung.  
- **FR-31:** **SEO cơ bản:** cấu hình **meta title / meta description mặc định** toàn site (**vi/en**); tuỳ chọn **override** theo trang CMS; **OG image** mặc định (logo hoặc ảnh upload riêng) phục vụ chia sẻ mạng xã hội.  
- **FR-32:** **Thông tin liên hệ & mạng xã hội** (hotline, email hiển thị, link Facebook/Zalo/YouTube/…) cấu hình trong CMS, hỗ trợ **vi/en** nếu nhãn hiển thị khác nhau; hiển thị ở **footer** và/hoặc trang Liên hệ theo UX.  
- **FR-33:** **Thanh thông báo (announcement bar)** toàn site: bật/tắt, nội dung ngắn **vi/en**, tuỳ chọn **ngày bắt đầu / kết thúc**; tuân **NFR-4** nếu có link.  
- **FR-34:** **Xem trước và xuất bản an toàn:** thay đổi đối với **trang CMS**, **cấu hình SEO**, **footer liên hệ**, **announcement** có chế độ **nháp / xuất bản** hoặc **preview URL** (auth) trước khi public — mức tối thiểu do kiến trúc; có thể **thống nhất** với **FR-18** khi Growth đã bật.  
- **FR-35:** **Thư viện media / chọn lại ảnh:** khi gắn ảnh (logo, banner, OG, …) Admin có thể **chọn** từ ảnh đã upload trước đó, không bắt buộc upload trùng file mỗi lần (triển khai có thể đơn giản hóa danh sách file gần đây).  
- **FR-36:** **Trợ giúp trong Admin:** mỗi màn CMS quan trọng (banner, menu, trang tĩnh, **tin tức** khi có wave 4, SEO, footer) có **hướng dẫn ngắn tiếng Việt** (tooltip, panel hoặc link doc nội bộ).  
- **FR-37:** **Lịch sử / hoàn tác:** ít nhất **một** trong hai — (a) lưu **N phiên bản** gần nhất cho `cms_settings` / menu / trang CMS quan trọng, hoặc (b) nút **khôi phục bản trước** cho thao tác lưu gần nhất — chi tiết entity do kiến trúc.  
- **FR-38:** **Trang lỗi 404 (storefront):** tiêu đề và đoạn mô tả thân thiện **vi/en** có thể chỉnh từ CMS; CTA về trang chủ (có thể cố định trong code nhưng copy từ CMS).

### Tin tức — storefront & Admin (wave 4)

- **FR-39:** Storefront có **mục điều hướng “Tin tức”** (nhãn theo **locale** đang xem, cùng pattern i18n **FR-22**); trỏ tới **trang danh sách tin** trên path chuẩn hóa trong kiến trúc (ví dụ dưới segment locale hiện tại).  
- **FR-40:** **Trang danh sách tin:** hiển thị các bài **đã xuất bản**, sắp xếp theo **ngày xuất bản** (giảm dần); mỗi thẻ có **tiêu đề**, (tuỳ chọn) **Ảnh đại diện**, **đoạn trích**; **phân trang** hoặc “xem thêm” — một phương án do kiến trúc; chỉ bài **published** trên Store API công khai.  
- **FR-41:** **Trang chi tiết bài tin:** một URL **ổn định** theo **slug** (và locale); render **tiêu đề**, (tuỳ chọn) ngày đăng / tác giả, **nội dung** gồm **khối ảnh** và **rich text** đúng thứ tự soạn; typography **ưu tiên đọc** (mobile + desktop) theo UX spec.  
- **FR-42:** **Admin — quản lý bài tin:** tạo, sửa, (tuỳ chọn) ẩn/archive hoặc xóa mềm; **trạng thái vòng đời** thống nhất **FR-34** / **FR-18** (draft → published); **ISR/revalidate** hoặc cơ chế cache khi publish do kiến trúc (cùng tinh thần banner/CMS).  
- **FR-43:** **Đa ngôn ngữ theo bài:** cho mỗi locale **được bật** trong hệ thống (**FR-17**): **tiêu đề** bắt buộc khi xuất bản locale đó; **slug** có thể theo locale hoặc một slug chính + bản dịch — **một** quy tắc duy nhất trong kiến trúc (tránh trùng URL); **thân bài** và **ảnh đại diện** (nếu có) **theo locale**; fallback **vi** → locale khác khi thiếu bản dịch (đồng bộ policy CMS hiện có).  
- **FR-44:** **Mô hình editor (bắt buộc chốt một):** tài liệu kiến trúc **chọn duy nhất** một trong hai: **(A) block editor** (lưu JSON/block tree) hoặc **(B) một vùng WYSIWYG** (một trường rich HTML/markdown tương đương). **Không** yêu cầu sản phẩm cung cấp đồng thời hai UI editor khác nhau cho thân bài. Dù chọn A hay B, phải đạt **năng lực bài báo** trong cùng luồng soạn: **heading**, **đoạn**, **danh sách**, **in đậm/nghiêng**, **liên kết** (validate **NFR-4**), **trích dẫn** hoặc callout (mức tối thiểu ghi trong ADR). **Copy/paste:** từ **Microsoft Word** và từ **trình duyệt** (HTML): định dạng cơ bản được **giữ lại** sau khi qua pipeline **sanitize** (**NFR-10**) hoặc được **chuẩn hoá** có kiểm chứng (không làm mất văn bản, không chèn script); hành vi ảnh khi paste do ADR (upload tự động / bắt chèn lại / cảnh báo).  
- **FR-45:** **Ảnh + chữ trong một bài (tương thích FR-44):** với **block editor**: xen kẽ **khối ảnh** (upload hoặc **FR-35**) và khối văn bản. Với **một ô WYSIWYG**: **chèn ảnh inline** trong cùng vùng soạn (upload/thư viện), xen kẽ với đoạn/heading như soạn **Word**. Mọi ảnh: responsive trên storefront, **caption**/alt theo locale nếu có; đủ để dựng bài **giống trang báo / bài blog chuyên nghiệp**.  
- **FR-46:** **SEO theo bài tin:** **meta title**, **meta description** (theo locale); **OG image** (mặc định ảnh đại diện bài hoặc ảnh đầu tiên trong thân — quy tắc document); không làm suy giảm **FR-31** (vẫn có default toàn site).

## Yêu cầu phi chức năng

- **NFR-1 (Hiệu năng ảnh):** Ảnh banner phục vụ storefront dùng **định dạng tối ưu** (ví dụ WebP/AVIF khi client hỗ trợ) và **srcset**; kích thước file banner mobile ≤ **250KB** mục tiêu cho mỗi slide sau xử lý (ngoại lệ ghi lại trong test báo cáo).  
- **NFR-2 (LCP trang chủ):** Trên mạng 4G lab, LCP vùng hero ≤ **3.0s** trung bình 3 lần đo (theo SC-3).  
- **NFR-3 (Khả dụng Admin):** Thao tác lưu banner/logo hoàn tất ≤ **5s** p95 khi file ≤ **10MB** gốc (trước nén).  
- **NFR-4 (Bảo mật):** URL banner và hyperlink phải qua **allowlist/validation** cơ bản (chặn `javascript:`); upload file giới hạn **MIME/type** và kích thước (chi tiết trong kiến trúc).  
- **NFR-5 (i18n URL):** Locale có thể chọn qua **prefix path hoặc cookie/subdomain** — một phương án duy nhất được chọn trong kiến trúc và nhất quán trên toàn site.
- **NFR-6 (Growth — Audit):** Mọi chuyển trạng thái sang **published** (và tùy chọn reject) đối với nội dung trong phạm vi FR-18 ghi lại **actor, timestamp, entity** (tối thiểu); retention log theo chính sách vận hành.
- **NFR-7 (Khả năng tiếp cận — wave 2):** Các control điều hướng chính (menu, đóng drawer, chuyển locale) có **trạng thái focus visible**; tương phản chữ/nền đạt **WCAG 2.1 AA** cho text thông thường trên các nhãn menu và footer (đo bằng checklist hoặc công cụ trong pipeline QA).  
- **NFR-8 (Nhất quán visual):** Token màu / elevation (header vs overlay menu) document trong **UX spec** hoặc design tokens; không thay đổi ad-hoc làm lệch **design system** Medusa UI đang dùng mà không ghi lại.
- **NFR-9 (Admin — người phi kỹ thuật, wave 3):** Thông báo khi **lưu thất bại** hoặc **validation** (URL, độ dài text, file) phải bằng **tiếng Việt** dễ hiểu; **không** để lộ stack trace, SQL hay exception raw cho user Admin; log kỹ thuật chỉ server-side.
- **NFR-10 (Nội dung rich — wave 4 tin tức):** HTML/JSON thân bài (kể cả sau **paste** từ Word/browser) phải qua **sanitize / allowlist** tag & thuộc tính trước khi lưu và khi render storefront; chặn script, `on*` handlers, `javascript:`; loại bỏ style/event nguy hiểm; **không** tin tưởng HTML thô từ clipboard. Upload ảnh trong bài (kể cả sau paste nếu hỗ trợ) tuân **MIME/size** như kiến trúc media hiện có.

## Tiêu chí thành công bổ sung (wave 2)

| ID | Tiêu chí | Đo lường |
|----|-----------|----------|
| SC-10 | Nhất quán ngôn ngữ UI | Với mỗi locale `vi` và `en`, **100%** nhãn điều hướng cố định trong PRD wave 2 (checklist FR-22) hiển thị đúng ngôn ngữ; không còn xen kẽ EN/VN trên cùng viewport (audit manual + snapshot). |
| SC-11 | Collection/footer đồng bộ i18n | Footer và header dùng **cùng** tên hiển thị cho cùng một `collection_id`/`handle` ở cùng locale (lấy mẫu tối thiểu **5** collection seed). |
| SC-12 | Header chỉ logo, tên site ở footer | Đúng **FR-11**, **FR-11b**; kiểm tra **vi** và **en**. |

_Wave 3:_ **SC-13**, **SC-14** nằm cùng bảng SMART phía trên (không lặp bảng).

_Wave 4:_ **SC-15**, **SC-16** nằm cùng bảng SMART phía trên.

## Ghi chú kiểm tra PRD (`bmad-validate-prd`)

- **Đã chỉnh trong PRD (edit workflow, 2026-04-06):** **SC-6** đồng bộ **FR-29**; **J3** trỏ **J7**; metadata ngày; **FR-11b** giai đoạn chuyển tiếp `site_title`.  
- **Còn lại = triển khai/code:** header có thể vẫn lệch **FR-11/11b/SC-12** cho tới khi story wave 2; cần **architecture.md** + Store API khi thêm menu **FR-29**.  
- **Phụ thuộc:** FR-29 phụ thuộc mở rộng backend CMS; nên tách epic/story “CMS nav 2 cấp + Store API”.  
- **Rủi ro:** Mobile drawer phải phản ánh **cùng cây** với desktop (một nguồn CMS).  
- **Rà soát 2026-04-06 (CMS hiện đại / phi kỹ thuật):** đã bổ sung **Wave 3** — **FR-30…38**, **J8**, **SC-13…14**, **NFR-9** (trang tĩnh, SEO, footer/MXH, announcement, preview/publish, media reuse, help, history/undo, 404, thông báo lỗi tiếng Việt).
- **Bổ sung 2026-04-07 (Wave 4 — Tin tức):** **FR-39…FR-46**, **J9**, **SC-15…SC-16**, **NFR-10** — menu Tin tức, list/detail, **một** editor (block *hoặc* WYSIWYG), bài báo + copy/paste, sanitize.

## Phụ lục A — Cấu trúc seed bắt buộc

Các tên hiển thị có thể lưu song ngữ (`vi` bắt buộc đầy đủ theo bảng; `en` có thể điền trong seed hoặc để trống với fallback).

| Collection | Nội dung |
|------------|----------|
| **Saffron** | Sản phẩm: **Saffron Cao Cấp** — một biến thể mặc định. |
| **Mỹ Phẩm (Cosmetics)** | **Kem chống nắng**, **Serum B5**, **Bột rửa mặt**, **Mash**, **Xịt khoáng 3in1** (mỗi mục là product; biến thể mặc định trừ khi có chỉ định khác). |
| **Quà doanh nghiệp (Corporate Gifts)** | Product type: **Quà Trung Thu** → Sản phẩm **Gia công bánh Trung Thu** với biến thể: **Hộp 2 bánh**, **Hộp 4 bánh**, **Hộp 6 bánh**. Product type: **Quà Tết** — **placeholder** (sản phẩm/concrete variants có thể trống nhưng entity type tồn tại). |
| **Quà theo nhu cầu (Custom Gifts)** | Sub-categories (mô hình hóa như collection con hoặc tag/collection): **Ngân sách dưới 500k**, **Ngân sách 500-1000k**, **Ngân sách trên 1000k**. |
| **Nông sản Việt (Vietnamese Agricultural)** | **Mật Ong Rừng**, **Hạt Điều**, **Hạt Macca**, **Dừa sấy**, **Xoài Sấy Dẻo**, **Mít Sấy**, **Đu Đủ Sấy Dẻo**. |

## Phụ lục B — Ma trận truy vết (rút gọn)

| FR | J1 | J2 | J3 | J4 | J5 | J6 | J7 | J8 | J9 |
|----|----|----|----|-----|----|-----|-----|-----|-----|
| FR-1…FR-6, FR-2b | | ✓ | ✓ | ✓ | | | ✓ | | |
| FR-7…FR-11b | ✓ | | ✓ | | | | ✓ | | |
| FR-12…FR-14 | | | ✓ | | | | ✓ | | |
| FR-15…FR-16 | | | | ✓ | | | | | |
| FR-17, FR-18, FR-19 | | | | | ✓ | | | ✓ | ✓ |
| FR-20, FR-21 | ✓ | | ✓ | | | ✓ | | | |
| FR-22…FR-29 | | | | | | | ✓ | | ✓ |
| FR-30…FR-38 | | | | | | | | ✓ | |
| FR-39…FR-46 | | | | | | | ✓ | | ✓ |

---

**Bước BMad tiếp theo (khuyến nghị):** `bmad-validate-prd` ([VP]) trên `prd.md`. **`bmad-create-architecture` ([CA])** — entity **bài tin**, editor schema (block/HTML), slug/locale, Store API list/detail, sanitize. **`bmad-create-ux-design` ([CU])** — màn Admin soạn tin + storefront list/detail. `bmad-create-epics-and-stories` ([CE]) epic **Wave 4 Tin tức**; `bmad-sprint-planning` ([SP]); `bmad-check-implementation-readiness` ([IR]).
