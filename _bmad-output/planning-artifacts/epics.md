---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
  - epics-refresh-wave2-wave3-growth-2026-04-06
  - epics-supplement-wave4-news-2026-04-07
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
workflowType: epics
project_name: ecomerce-viet-lol
user_name: HieuTV-Team-MedusaV2
date: 2026-04-06
document_output_language: Vietnamese
lastEpicsRevision: "2026-04-07"
---

# ecomerce-viet-lol — Phân rã Epic & User Story

## Tổng quan

Tài liệu phân rã **PRD**, **Đặc tả UX** và **Kiến trúc** thành epic và user story (Given/When/Then). **Làm mới 2026-04-06:** Wave 2–3 + Growth + **FR-2b**. **Bổ sung 2026-04-07:** **Epic 11 — Wave 4 tin tức** (**FR-39…FR-46**, **NFR-10**, **SC-15…16**; ADR-19…25; UX §16).

---

## Tồn kho yêu cầu

### Yêu cầu chức năng (từ PRD)

| ID | Mô tả ngắn |
|----|-------------|
| FR-1 | Hai locale `vi`, `en`. |
| FR-2 | Storefront mặc định `vi`. |
| FR-2b | Region VN + VND mặc định; env/seed dev khớp. |
| FR-3 | Cấu hình ngôn ngữ trong Admin; không redeploy SF (MVP). |
| FR-4 | Product & collection có nội dung hai ngôn ngữ (tối thiểu tên). |
| FR-5 | SF theo locale; fallback `vi`. |
| FR-6 | Admin sửa song ngữ product/collection. |
| FR-7 | Nhiều banner, slider, reorder. |
| FR-8 | Banner: ảnh, title, subtitle, URL, CTA; text song ngữ. |
| FR-9 | Derivative ảnh web + mobile (≥2 breakpoint). |
| FR-10 | SF đọc banner qua API, slider trang chủ. |
| FR-11 | Logo từ Admin; header **chỉ logo**, căn trái (wave 2). |
| FR-11b | `site_title` ở **footer**, không header; i18n / giai đoạn chuyển tiếp document. |
| FR-12 | Responsive, mobile-first. |
| FR-13 | Nav không hard-code seed production; ưu tiên CMS khi có FR-29. |
| FR-14 | Slider + lazy-load/srcset/format hiện đại. |
| FR-15 | Migration/seed cấu trúc Phụ lục A. |
| FR-16 | Seed idempotent. |
| FR-17 | Locale thứ ba+; bật/tắt trong Admin (Growth). |
| FR-18 | Draft/publish (Growth) — banner + i18n catalog tối thiểu. |
| FR-19 | RBAC Admin Growth (≥2 vai). |
| FR-20 | Lên lịch hiển thị banner (Growth). |
| FR-21 | A/B banner / chiến dịch (Growth). |
| FR-22 | Nhãn điều hướng cố định SF theo locale (i18n thống nhất). |
| FR-23 | Footer: tên collection đã localize (metadata i18n). |
| FR-24 | Quy tắc nghiệp vụ số mục desktop / “Xem thêm” (document). |
| FR-25 | Drawer: touch locale/region, đóng rõ, focus trap tối thiểu. |
| FR-26 | Logo `alt` thương hiệu (hoặc `aria-label` một phương án). |
| FR-27 | Tagline footer song ngữ / CMS. |
| FR-28 | “Powered by…” chỉ dev/staging hoặc cờ tắt production. |
| FR-29 | Menu header **hai cấp** cấu hình Admin; Store API `nav-menu`; desktop + drawer. |
| FR-30 | Trang nội dung CMS vi/en; slug; không deploy khi sửa copy. |
| FR-31 | SEO: meta title/description mặc định + override trang; OG image. |
| FR-32 | Hotline, email, link MXH CMS; footer / Liên hệ. |
| FR-33 | Announcement bar vi/en; optional schedule; NFR-4 nếu có link. |
| FR-34 | Preview / nháp–xuất bản an toàn (trang CMS, SEO, footer, announcement). |
| FR-35 | Chọn ảnh đã upload (media reuse) trong Admin. |
| FR-36 | Trợ giúp tiếng Việt trên màn CMS chính. |
| FR-37 | Lịch sử / hoàn tác tối thiểu (settings, menu, trang quan trọng). |
| FR-38 | 404 SF: copy vi/en từ CMS; CTA về chủ. |
| FR-39 | Menu storefront **Tin tức** → `/news` (i18n). |
| FR-40 | Trang danh sách tin published; phân trang. |
| FR-41 | Trang chi tiết `/news/[slug]`; layout đọc bài. |
| FR-42 | Admin CRUD bài tin; draft/publish; revalidate. |
| FR-43 | Đa ngôn ngữ theo locale bật (title/body/SEO). |
| FR-44 | Editor một vùng (TipTap); bài báo + paste Word/web. |
| FR-45 | Ảnh inline + rich text trong cùng luồng. |
| FR-46 | SEO theo bài (meta + OG). |

### Yêu cầu phi chức năng (từ PRD)

| ID | Mô tả ngắn |
|----|-------------|
| NFR-1 | Ảnh WebP/AVIF + srcset; mobile ~≤250KB/slide. |
| NFR-2 | LCP hero ≤ 3s (lab 4G). |
| NFR-3 | Lưu banner/logo p95 ≤ 5s, file ≤10MB. |
| NFR-4 | URL allowlist; MIME/size upload. |
| NFR-5 | Một chiến lược i18n URL (prefix `[countryCode]` / tương đương). |
| NFR-6 | Audit publish Growth: actor, timestamp, entity. |
| NFR-7 | Focus visible; contrast AA menu/footer (wave 2). |
| NFR-8 | Token visual header vs overlay; không lệch ad-hoc. |
| NFR-9 | Lỗi Admin tiếng Việt; không stack trace cho user (wave 3). |
| NFR-10 | Sanitize HTML/JSON tin (paste); allowlist tag; ảnh an toàn (wave 4). |

### Yêu cầu thiết kế UX (UX-DR, từ UX spec)

| ID | Phạm vi |
|----|--------|
| UX-DR1 | Mega menu 2 cấp: delay đóng, Esc, keyboard khi khả thi. |
| UX-DR2 | Drawer = cùng cây CMS; accordion; touch ≥44px; backdrop + nút đóng. |
| UX-DR3 | Announcement full width; contrast AA; dismiss tuỳ cấu hình. |
| UX-DR4 | Trang CMS: body max-width ~680–720px; breadcrumb. |
| UX-DR5 | Form Admin: validation inline; toast/alert tiếng Việt (NFR-9). |
| UX-DR6 | Icon `?` / panel trợ giúp theo đúng màn (FR-36). |
| UX-DR7 | Preview nháp: token/auth hoặc watermark; không lộ public. |
| UX-DR8 | `prefers-reduced-motion` cho hero/slider. |
| UX-DR9 | Đồng bộ checklist SC-10 (audit nhãn cố định vi/en). |
| UX-DR10 | Tin SF: card grid list + prose chi tiết; SC-16 (§16.1–16.2). |
| UX-DR11 | Admin tin: `@medusajs/ui`, sticky actions, toolbar TipTap (§16.3–16.4). |
| UX-DR12 | Paste ảnh/word: toast phản hồi; lỗi tiếng Việt (UX-AC-11…14). |
| UX-DR13 | Help `?` màn tin (FR-36). |
| UX-DR14 | Preview bài tin token/watermark; không cache public draft (ADR-14). |

### Yêu cầu bổ sung (Kiến trúc)

- Module `store-cms`: settings singleton, banner slides, **nav tree**, **cms pages**, **revisions**, **`store_cms_news_article`** (theo ADR-11…18, **ADR-19…25** trong `architecture.md`).  
- Store API: `cms-settings`, **`nav-menu`**, **`cms-pages`**, **`cms-news`**, public slices cho SEO/footer/announcement/404.  
- ISR + `revalidateTag` (`cms`, `cms-nav`, `cms-pages`, **`cms-news`**, …).  
- File module / derivatives; monorepo `apps/backend` + `apps/backend-storefront`. **Editor tin:** TipTap, sanitize server (NFR-10).

### Bản đồ phủ FR → Epic (rút gọn)

| FR | E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9 | E10 | E11 |
|----|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---:|:---:|
| FR-1…2 | ● | | | | | ● | | | | | |
| FR-2b | ● | | | | | | ● | | | | |
| FR-3 | | | ● | | ● | ● | | | | | |
| FR-4…6 | | | | ● | ● | ● | ● | | | | |
| FR-7…11 | | ● | ● | | ● | ● | | ● | | | |
| FR-11b,22…29 | | | ● | | ● | ● | | ● | | | |
| FR-12…14,26,28 | | | | | | ● | | ● | | | |
| FR-15…16 | ● | | | | | | ● | | | | |
| FR-30…38 | | | ● | | | ● | | | ● | | |
| FR-17…21 | | | ● | | ● | ● | | | | ● | |
| **FR-39…FR-46** | | | ● | | | ● | | ● | ● | | **●** |
| **NFR-10** | | | ● | | | | | | | | **●** |

(Giải thích: **E8** = wave 2 nav (mục Tin tức gắn **nav_tree**); **E9** = pattern preview/revision/media tái dùng; **E11** = **Wave 4 tin tức** trọn cụm backend+Admin+SF.)

---

## Danh sách Epic

| ID | Tên | Mục tiêu |
|----|-----|----------|
| E1 | Nền tảng & tích hợp | Monorepo, Medusa 2.x, env, CORS, DB. |
| E2 | Mô hình CMS & xử lý ảnh | Banner/settings; pipeline ảnh. |
| E3 | API CMS & an toàn | CRUD Admin, Store public, validation, revalidate. |
| E4 | i18n catalog | Metadata, helper, Admin fields. |
| E5 | Admin UI mở rộng (banner/logo/locale) | UX J-Admin 1–3. |
| E6 | Storefront Next.js (MVP) | `[countryCode]`, header/nav/slider, PLP/PDP, ISR. |
| E7 | Seed Phụ lục A | Idempotent + FR-2b khớp VN/VND. |
| **E8** | **Điều hướng & thương hiệu storefront (Wave 2)** | Menu 2 cấp CMS, header chỉ logo, footer đầy đủ, nhãn i18n, drawer/touch, SC-10…12. |
| **E9** | **CMS vận hành & nội dung tĩnh (Wave 3)** | Trang CMS, SEO, footer/MXH, announcement, preview/publish, media picker, help, undo, 404, NFR-9. |
| **E10** | **Growth — locale+, workflow banner, RBAC, lịch, A/B** | FR-17…21, NFR-6. |
| **E11** | **Tin tức storefront & Admin (Wave 4)** | FR-39…FR-46, NFR-10, SC-15…16; TipTap, `cms-news`, `/news`, sanitize, nav, UX §16. |

---

## Epic 1: Nền tảng & tích hợp

**Mục tiêu:** Có workspace triển khai chuẩn (backend Medusa + app storefront), cấu hình môi trường và CORS để dev end-to-end.

### Story 1.1: Khởi tạo monorepo và Medusa backend

Là **kỹ sư**,  
Tôi muốn **khởi tạo monorepo với app Medusa 2.x và PostgreSQL**,  
Để **có API Admin/Store chạy local và sẵn sàng mở rộng module**.

**Acceptance Criteria:**

**Given** máy dev đã cài Node và Docker (hoặc PostgreSQL có sẵn)  
**When** clone repo và chạy lệnh cài đặt/khởi chạy backend theo README nội bộ  
**Then** Medusa lắng ngHE port đã document và truy cập Admin UI được  
**And** biến `DATABASE_URL`, `ADMIN_CORS`, `STORE_CORS` tồn tại mẫu `.env.example`

### Story 1.2: Kết nối storefront dev tới Store API

Là **kỹ sư**,  
Tôi muốn **app Next.js gọi thử Store API bằng publishable key**,  
Để **xác nhận luồng mạng và khóa công khai hợp lệ**.

**Given** backend chạy và có sales channel / publishable API key  
**When** storefront gọi một endpoint store chuẩn (vd: regions hoặc products)  
**Then** nhận HTTP 200 và parse JSON thành công  
**And** khóa bí mật không commit vào git

---

## Epic 2: Mô hình CMS & xử lý ảnh

**Mục tiêu:** Lưu trữ banner/settings trong DB và sinh ảnh derivative đáp ứng FR-9, NFR-1.

### Story 2.1: Migration `store_banner_slide` và `store_cms_settings`

Là **kỹ sư backend**,  
Tôi muốn **migration tạo bảng/entity theo kiến trúc**,  
Để **lưu slide, thứ tự, trạng thái và cấu hình logo/locale**.

**Given** codebase Medusa có module custom  
**When** chạy migration  
**Then** schema tồn tại các trường logic: ảnh, JSON vi/en cho text, `target_url`, `sort_order`, `is_active`, settings singleton  
**And** có thể rollback hoặc tái chạy an toàn theo quy ước team

### Story 2.2: Pipeline derivative ảnh banner sau upload

Là **kỹ sư backend**,  
Tôi muốn **sau khi upload ảnh banner gốc hệ thống sinh ≥2 bản WebP (mobile ~430 / desktop ~1280 width)**  
Để **đáp ứng NFR-1 và FR-9**.

**Given** file ảnh hợp lệ đã lưu qua file module  
**When** subscriber/workflow xử lý xong  
**Then** entity slide chứa URL (hoặc file id) cho mobile và desktop derivative  
**And** kích thước mobile mục tiêu ≤ 250KB hoặc ngoại lệ được ghi trong log test

---

## Epic 3: API CMS & an toàn

**Mục tiêu:** CRUD Admin, GET Store public, validation NFR-4, chuẩn bị hook revalidate.

### Story 3.1: Admin API — CRUD banner & reorder

Là **quản trị viên**,  
Tôi muốn **tạo/sửa/xóa slide và đổi thứ tự qua API**  
Để **vận hành slider không cần DB tay**.

**Given** session Admin hợp lệ  
**When** gọi các route custom CRUD + batch reorder  
**Then** dữ liệu lưu đúng và thứ tự phản ánh sau GET  
**And** xóa có xác nhận phía UI (epic 5) hoặc soft-delete nếu thiết kế chọn

### Story 3.2: Admin API — cập nhật `cms-settings` (logo, locale)

Là **quản trị viên**,  
Tôi muốn **PATCH logo và `enabled_locales` / `default_locale`**  
Để **đáp ứng FR-3, FR-11**.

**Given** file logo hợp lệ  
**When** PATCH settings  
**Then** `default_locale` luôn nằm trong `enabled_locales`  
**And** lỗi validation trả về 400 có message rõ

### Story 3.3: Store API — public đọc banner & settings

Là **khách**,  
Tôi muốn **GET banner đã resolve text theo `?locale=` và GET settings public**  
Để **storefront render trang chủ**.

**Given** không cần đăng nhập  
**When** gọi endpoint store custom  
**Then** chỉ trả slide `is_active`; text theo locale với fallback `vi`  
**And** không lộ thông tin nội bộ (đường dẫn disk, v.v.)

### Story 3.4: Validation URL & upload (NFR-4)

Là **hệ thống**,  
Tôi muốn **chặn `javascript:` / scheme nguy hiểm và giới hạn MIME + dung lượng upload**  
Để **giảm XSS/phishing qua CTA banner**.

**Given** Admin lưu slide với `target_url` bất thường hoặc file sai loại  
**When** submit  
**Then** API từ chối với lỗi cụ thể  
**And** test đơn vị cover các case `http`, `https`, relative (nếu bật), và chặn `javascript:`

### Story 3.5: Hook revalidate storefront (ISR)

Là **quản trị viên**,  
Tôi muốn **sau khi lưu banner/logo/settings storefront được làm mới trong TTL hợp lý**  
Để **đồng bộ với UX “hiển thị sau tối đa X phút”**.

**Given** biến `REVALIDATE_SECRET` và URL SF  
**When** lưu thành công từ backend  
**Then** gọi route revalidate Next (tag `cms`) hoặc ghi log retry nếu fail  
**And** tài liệu vận hành mô tả TTL ISR mặc định

---

## Epic 4: i18n catalog

**Mục tiêu:** FR-4…FR-6, FR-5 trên layer hiển thị; đồng bộ kiến trúc metadata.

### Story 4.1: Schema & helper `resolveI18n` cho Product/Collection

Là **kỹ sư**,  
Tôi muốn **chuẩn hóa `metadata.i18n` và hàm resolve locale + fallback `vi`**  
Để **mọi layer dùng một luật**.

**Given** entity có `metadata.i18n` đúng schema  
**When** gọi helper với `en` nhưng thiếu key  
**Then** kết quả fallback `vi` cho field đó  
**And** unit test cover thiếu đầy đủ bản dịch

### Story 4.2: Mở rộng Admin — trường song ngữ product/collection

Là **quản trị viên**,  
Tôi muốn **tab Tiếng Việt / English khi sửa product và collection**  
Để **nhập FR-6**.

**Given** màn product/collection trong Admin  
**When** lưu  
**Then** metadata được ghi đúng và không phá `title`/`handle` nội địa  
**And** cảnh báo UI khi thiếu bản `en` (không chặn save MVP)

---

## Epic 5: Admin UI mở rộng (CMS)

**Mục tiêu:** Thực hiện luồng UX J-Admin banner/logo/locale.

### Story 5.1: UI danh sách & chỉnh sửa banner (kéo thả reorder)

Là **quản trị viên**,  
Tôi muốn **xem danh sách slide, bật/tắt, reorder, thêm/sửa với tabs vi/en**  
Để **đáp ứng FR-7, FR-8**.

**Given** API epic 3 sẵn sàng  
**When** thao tác reorder và lưu  
**Then** thứ tự sync với backend  
**And** upload hiển thị progress và preview 2 derivative

### Story 5.2: UI logo & cấu hình ngôn ngữ

Là **quản trị viên**,  
Tôi muốn **upload logo + bật `en` + giữ mặc định `vi`**  
Để **FR-3, FR-11**.

**Given** màn settings  
**When** lưu cấu hình không hợp lệ (vd: tắt cả locale)  
**Then** hiện lỗi inline theo pattern UX  
**And** preview logo trên nền sáng/tối

---

## Epic 6: Storefront Next.js

**Mục tiêu:** FR-10, FR-12…FR-14, NFR-2, UX-AC; prefix locale NFR-5.

### Story 6.1: Định tuyến `[countryCode]` và redirect mặc định

Là **khách**,  
Tôi muốn **vào `/` được chuyển tới segment locale (vd. `/vi`) theo NFR-5**  
Để **FR-2, NFR-5**.

**Given** trình duyệt mở site  
**When** truy cập `/`  
**Then** redirect tới prefix mặc định (`vi`) khớp kiến trúc repo  
**And** `html lang` khớp locale

### Story 6.2: Header — logo động, điều hướng động, chuyển ngữ (MVP → Wave 2)

Là **khách**,  
Tôi muốn **thấy logo và điều hướng từ backend (collections tạm hoặc CMS sau E8), đổi VI/EN**  
Để **FR-11, FR-13, FR-1**; sau **Epic 8** đáp ứng **FR-29, FR-22…FR-27, FR-11b**.

**Given** Store API trả collections và/hoặc (sau E8) `nav-menu`  
**When** load trang  
**Then** menu production không hard-code danh sách seed cố định  
**And** switcher đổi path locale giữ nguyên phần path sau segment  
**And** (sau E8) header chỉ logo trái; tên site + tagline ở footer theo **FR-11b**, **FR-27**

### Story 6.3: Trang chủ — Hero slider với `next/image` và ISR

Là **khách**,  
Tôi muốn **xem slider banner với ảnh sắc nét, srcset, lazy slide ngoài viewport đầu**  
Để **FR-10, FR-14, NFR-1, NFR-2 hướng tới**.

**Given** API banner trả dữ liệu derivatives  
**When** mở `/vi`  
**Then** LCP có skeleton/aspect-ratio ổn định  
**And** carousel có nút/dots, `aria-*` cơ bản theo UX

### Story 6.4: Trang collection & product (variants)

Là **khách**,  
Tôi muốn **xem danh sách sản phẩm trong collection và PDP có biến thể**  
Để **mua/xem đúng catalog seed (vd bánh Trung Thu)**.

**Given** handle collection/product tồn tại  
**When** mở PLP/PDP  
**Then** title/mô tả theo locale + fallback  
**And** PDP chọn biến thể hiển thị giá/trạng thái nhất quán backend

### Story 6.5: Responsive & touch target

Là **khách mobile**,  
Tôi muốn **không scroll ngang 360px và CTA/chạm ≥ 44×44px**  
Để **FR-12, SC-5**.

**Given** viewport 360–390  
**When** duyệt Home và mở menu  
**Then** không overflow ngang không mong muốn  
**And** kiểm tra checklist devtools ghi nhận pass/fail

---

## Epic 7: Seed dữ liệu Phụ lục A

**Mục tiêu:** FR-15, FR-16; đúng cây collection/product type/variant trong PRD.

### Story 7.1: Seed idempotent collections & products

Là **kỹ sư**,  
Tôi muốn **script seed tạo đủ collection, product type “Quà Trung Thu/Quà Tết”, sản phẩm và variant**  
Để **FR-15 và Phụ lục A**.

**Given** DB sạch hoặc đã chạy seed trước  
**When** chạy lệnh seed hai lần  
**Then** không lỗi unique; bản ghi cập nhật/ bỏ qua đúng upsert  
**And** “Quà Tết” là placeholder type đúng quy ước kiến trúc

### Story 7.2: Seed collection con ngân sách & metadata parent

Là **kỹ sư**,  
Tôi muốn **ba collection ngân sách gắn metadata parent “Quà theo nhu cầu”**  
Để **menu/plp lọc đúng thiết kế kiến trúc**.

**Given** collection cha đã tạo  
**When** seed con  
**Then** `parent_collection_handle` (hoặc tương đương) đúng  
**And** handles cố định document trong README seed

### Story 7.3: Seed `metadata.i18n` tối thiểu (vi + en một phần)

Là **quản trị vận hành**,  
Tôi muốn **dữ liệu mẫu có tiếng Việt đầy đủ và English tùy mục**  
Để **demo FR-5**.

**Given** seed chạy xong  
**When** storefront đổi `en`  
**Then** ít nhất vài sản phẩm hiển thị bản `en`; phần còn lại fallback `vi`  
**And** danh sách handle/minh chứng seed nằm trong doc

### Story 7.4: Seed & env mặc định region VN + VND (FR-2b)

Là **kỹ sư**,  
Tôi muốn **seed và biến môi trường storefront mặc định khớp region `vn` và tiền tệ VND**  
Để **FR-2b**.

**Given** README / `.env.example` document `NEXT_PUBLIC_DEFAULT_REGION` (hoặc tương đương)  
**When** chạy seed trên DB sạch  
**Then** sales channel / region mặc định phù hợp bán hàng VN + VND  
**And** storefront dev không cần chỉnh tay từng máy để có cùng default

---

## Epic 8: Điều hướng & thương hiệu storefront (Wave 2)

**Mục tiêu:** Menu **hai cấp** từ CMS, header **chỉ logo**, footer có **site_title**, tagline, collection đã localize, drawer **cùng cây** với desktop; **SC-10…SC-12**, **NFR-7**, **NFR-8**.

### Story 8.1: Migration & entity lưu cây menu + mở rộng settings (site_title, tagline i18n)

Là **kỹ sư backend**,  
Tôi muốn **migration lưu nav tree (tối đa 2 cấp) và trường thương hiệu footer theo kiến trúc**  
Để **FR-29**, **FR-11b**, **FR-27**.

**Given** module `store-cms` đã tồn tại  
**When** chạy migration mới  
**Then** schema hỗ trợ nhóm/mục, loại đích (collection handle / external URL), nhãn override vi/en  
**And** `site_title` / tagline có hướng i18n hoặc giai đoạn chuyển tiếp được ghi trong story kiến trúc

### Story 8.2: Admin API — CRUD menu + Store API — `GET nav-menu` đã resolve

Là **quản trị viên**,  
Tôi muốn **lưu cây menu và để khách đọc cấu hình đã gắn tên collection theo locale**  
Để **FR-29**, **FR-13**, **FR-23** (đồng bộ tên).

**Given** session Admin  
**When** PUT/PATCH nav và GET Store `nav-menu?locale=`  
**Then** độ sâu tối đa 2; URL ngoài qua **NFR-4**  
**And** mục gắn collection hiển thị tên từ metadata i18n khi không override  
**And** revalidate tag `cms-nav` (hoặc tương đương) sau lưu

### Story 8.3: Admin UI — editor cây menu (kéo thả, tabs vi/en)

Là **quản trị viên**,  
Tôi muốn **chỉnh menu hai cấp trực quan**  
Để **FR-29**, **UX-DR6** (trợ giúp menu).

**Given** API 8.2 sẵn sàng  
**When** thêm nhóm/mục, chọn collection autocomplete, sắp thứ tự  
**Then** validation độ sâu và URL hiển thị lỗi **tiếng Việt** (chuẩn bị **NFR-9**)  
**And** có đoạn trợ giúp ngắn trên màn

### Story 8.4: Storefront — MegaNav + NavDrawer + quy tắc desktop (FR-24)

Là **khách**,  
Tôi muốn **điều hướng hai cấp trên desktop và mobile với cùng dữ liệu**  
Để **FR-25**, **FR-29**, **UX-DR1**, **UX-DR2**.

**Given** API `nav-menu`  
**When** hover/click (desktop) và mở drawer (mobile)  
**Then** cây menu trùng khớp; touch target ≥ 44px; đóng bằng backdrop/nút; Esc/return focus hợp lý  
**And** quy tắc giới hạn mục ngang / “Xem thêm” được document trong code hoặc CMS

### Story 8.5: Storefront — header chỉ logo, footer thương hiệu + collection localize

Là **khách**,  
Tôi muốn **header gọn với logo trái; footer có tên shop, tagline và link collection đúng ngôn ngữ**  
Để **FR-11**, **FR-11b**, **FR-23**, **FR-26**, **FR-28**, **SC-11**, **SC-12**.

**Given** settings + catalog  
**When** xem `vi` và `en`  
**Then** không có block tên shop cạnh logo trên header  
**And** footer dùng helper i18n cho tên collection  
**And** logo có `alt` hoặc `aria-label` thống nhất  
**And** branding dev chỉ hiện non-prod hoặc theo cờ

### Story 8.6: i18n nhãn cố định storefront (FR-22) + audit SC-10

Là **kỹ sư frontend**,  
Tôi muốn **đưa mọi nhãn UI cố định (Menu, Cart, Categories, …) vào một nguồn message theo locale**  
Để **FR-22**, **UX-DR9**.

**Given** checklist nhãn trong PRD/UX  
**When** đổi locale  
**Then** không còn xen kẽ EN/VN trên cùng viewport cho cùng vai trò UI  
**And** có cách kiểm chứng (snapshot hoặc script) ghi trong story

---

## Epic 9: CMS vận hành & nội dung tĩnh (Wave 3)

**Mục tiêu:** Trang CMS, SEO, liên hệ/MXH, announcement, preview/publish, media picker, trợ giúp, hoàn tác, 404 — **FR-30…FR-38**, **SC-13**, **SC-14**, **NFR-9**.

### Story 9.1: Migration `cms_pages` + revision / snapshot (FR-37)

Là **kỹ sư backend**,  
Tôi muốn **bảng (hoặc JSON có version) cho trang tĩnh và cơ chế lưu N bản gần nhất**  
Để **FR-30**, **FR-37**.

**Given** kiến trúc đã chốt entity  
**When** migration chạy  
**Then** slug duy nhất; trạng thái draft/published; nội dung vi/en  
**And** có bảng hoặc cột phục vụ khôi phục phiên bản trước

### Story 9.2: Admin + Store API — CRUD trang CMS, draft/publish, preview token

Là **quản trị viên**,  
Tôi muốn **tạo/sửa trang, xem trước bản nháp an toàn, xuất bản**  
Để **FR-30**, **FR-34**, **UX-DR7**.

**Given** quyền Admin  
**When** lưu nháp / publish / mở preview URL có auth  
**Then** Store public chỉ thấy published; preview không lộ trên tab ẩn danh không token  
**And** lỗi validation message tiếng Việt (**NFR-9**)

### Story 9.3: Admin UI — danh sách + editor trang (rich text tối thiểu), SEO, footer/MXH, announcement, 404

Là **vận hành viên**,  
Tôi muốn **một khu vực Admin chỉnh nội dung site mà không cần dev**  
Để **FR-31**, **FR-32**, **FR-33**, **FR-38**, **FR-36**, **SC-13**.

**Given** API settings/pages  
**When** sửa meta mặc định, OG, hotline, link MXH, announcement, copy 404  
**Then** mỗi màn có trợ giúp tiếng Việt ngắn (**FR-36**)  
**And** mọi lỗi lưu hiển thị tiếng Việt, không stack (**NFR-9**, **SC-14**)

### Story 9.4: Media picker — chọn file đã upload (FR-35)

Là **quản trị viên**,  
Tôi muốn **gắn lại ảnh đã có cho logo/banner/OG mà không upload trùng**  
Để **FR-35**.

**Given** file module có danh sách gần đây hoặc search đơn giản  
**When** chọn ảnh cũ  
**Then** entity cập nhật tham chiếu đúng  
**And** UX không yêu cầu dev can thiệp

### Story 9.5: Admin UI — lịch sử & khôi phục (FR-37)

Là **quản trị viên**,  
Tôi muốn **xem phiên bản gần đây và khôi phục sau khi lưu nhầm**  
Để **FR-37**, **UX-DR5**.

**Given** đã có snapshot từ 9.1  
**When** mở drawer lịch sử và bấm Khôi phục  
**Then** có xác nhận; sau khôi phục GET Store phản ánh sau publish/revalidate

### Story 9.6: Storefront — route `/[countryCode]/p/[slug]`, metadata SEO, AnnouncementBar, `not-found` CMS

Là **khách**,  
Tôi muốn **đọc trang chính sách, thấy thanh thông báo, và 404 thân thiện đúng locale**  
Để **FR-30**, **FR-31**, **FR-33**, **FR-38**, **UX-DR3**, **UX-DR4**.

**Given** trang published và settings  
**When** mở slug và gõ URL sai  
**Then** layout đọc dễ (max-width body); breadcrumb; `generateMetadata` dùng SEO  
**And** announcement hiển thị theo cấu hình; 404 lấy copy từ CMS  
**And** tag revalidate `cms-pages` / settings khi publish

---

## Epic 10: Growth — locale thứ ba, workflow nội dung, RBAC, lịch & A/B banner

**Mục tiêu:** **FR-17…FR-21**, **NFR-6** — có thể lên sprint sau khi Wave 2–3 ổn định.

### Story 10.1: Hỗ trợ locale thứ ba trong settings + routing storefront (FR-17)

Là **quản trị viên**,  
Tôi muốn **bật thêm một mã locale và để SF render theo cùng luật fallback**  
Để **FR-17**.

**Given** danh sách locale mở rộng trong settings  
**When** bật locale mới  
**Then** storefront có segment path hoặc chiến lược NFR-5 mở rộng nhất quán  
**And** banner/catalog fields mở rộng theo kiến trúc

### Story 10.2: Trạng thái draft/publish cho banner (và tối thiểu i18n catalog) + audit (FR-18, NFR-6)

Là **quản trị nội dung**,  
Tôi muốn **chỉ banner published mới ra Store API; có log chuyển trạng thái**  
Để **FR-18**, **NFR-6**.

**Given** slide có trạng thái  
**When** chuyển sang published  
**Then** GET store chỉ trả published  
**And** ghi nhận actor + timestamp

### Story 10.3: RBAC — vai draft vs publish (FR-19)

Là **admin**,  
Tôi muốn **một vai chỉ sửa nháp và một vai được publish**  
Để **FR-19**.

**Given** policy Medusa/custom  
**When** user thiếu quyền publish  
**Then** API từ chối với thông báo phù hợp

### Story 10.4: Lên lịch hiển thị banner theo khoảng thời gian (FR-20)

Là **quản trị viên**,  
Tôi muốn **slide chỉ hiện trong window thời gian**  
Để **FR-20**.

**Given** trường start/end (timezone document)  
**When** storefront resolve slides  
**Then** slide ngoài window không trả về

### Story 10.5: Chiến dịch A/B banner — MVP thuật toán (FR-21)

Là **marketing**,  
Tôi muốn **gán slide vào chiến dịch và storefront nhận variant theo luật**  
Để **FR-21**.

**Given** entity campaign theo kiến trúc  
**When** load trang chủ  
**Then** variant nhất quán trong session (hoặc luật document)  
**And** giới hạn số chiến dịch đồng thời được tôn trọng

---

## Epic 11: Tin tức — dữ liệu, API, Admin TipTap, storefront `/news`

**Mục tiêu:** **FR-39…FR-46**, **NFR-10**, **SC-15…16** — đăng và đọc bài tin đa ngôn ngữ; editor **một vùng TipTap** (ADR-19); sanitize paste (ADR-23); Store **`cms-news`** (ADR-25); menu **Tin tức** qua **nav_tree** (ADR-22). UX: **`ux-design-specification.md` §16**.

### Story 11.1: Migration & model `store_cms_news_article` + revision `news_article` (ADR-20, ADR-21)

Là **kỹ sư backend**,  
Tôi muốn **bảng bài tin và mở rộng revision**  
Để **lưu slug, i18n title/body/seo, trạng thái draft/published** theo kiến trúc.

**Given** module `store-cms`  
**When** chạy migration  
**Then** tồn tại entity `store_cms_news_article` với các cột ADR-20 (index `status+published_at`, unique `slug`)  
**And** `store_cms_revision` chấp nhận `entity_type = news_article`  
**And** seed không bắt buộc (có thể 0 bài)

### Story 11.2: Admin API `cms-news` — CRUD, sanitize, publish (FR-42, FR-43, FR-44, FR-45, NFR-10)

Là **quản trị nội dung**,  
Tôi muốn **tạo/sửa bài với nội dung HTML được làm sạch khi lưu**  
Để **không XSS** và khớp **NFR-10**.

**Given** bài tin trong DB  
**When** POST/PATCH body chứa HTML từ editor  
**Then** server chạy allowlist/sanitize (ADR-23); từ chối `script`, `on*`, `javascript:`  
**And** có endpoint publish/unpublish; lỗi trả message **tiếng Việt** (NFR-9)  
**And** ảnh trong HTML chỉ `src` hợp lệ (uploaded URL) sau khi qua flow upload

### Story 11.3: Store API `cms-news` — list + detail + preview (FR-40, FR-41, FR-34)

Là **khách / biên tập preview**,  
Tôi muốn **xem danh sách bài đã publish và chi tiết theo slug; xem nháp với token**  
Để **FR-40**, **FR-41**, tái dùng **ADR-14**.

**Given** bài published và bài draft  
**When** GET list public không có token  
**Then** chỉ trả published, sort `published_at desc`, phân trang/cursor theo ADR-25  
**When** GET `/:slug` với locale  
**Then** trả `title/excerpt/body/seo` resolve theo locale + fallback PRD  
**When** GET kèm preview token hợp lệ  
**Then** có thể xem draft; response không đi ISR cache công khai như UX-DR14

### Story 11.4: Revalidate storefront khi lưu / publish tin (FR-42)

Là **vận hành**,  
Tôi muốn **bài mới hoặc sửa hiện trên storefront trong chu kỳ đã chọn**  
Để **đồng bộ với banner/CMS**.

**Given** publish hoặc PATCH quan trọng  
**When** transaction thành công  
**Then** backend gọi hook revalidate với tag **`cms-news`** (và tuỳ chọn theo `slug`)  
**And** document trong `.env.example` nếu cần thêm tag

### Story 11.5: Admin UI — danh sách + editor TipTap, locale tabs, SEO, help, paste ảnh (FR-36, FR-44, FR-45, FR-46)

Là **biên tập viên phi kỹ thuật**,  
Tôi muốn **màn hình giống các màn CMS khác, soạn như Word, chèn ảnh, xem trước**  
Để **SC-15**, **UX-DR11…UX-DR13**.

**Given** route zone Storefront & Nội dung  
**When** mở **Tin tức**  
**Then** DataTable/list + nút **Tạo bài mới** (`@medusajs/ui`)  
**When** sửa bài  
**Then** tabs theo `enabled_locales`; TipTap toolbar (heading, list, link, quote, **chèn ảnh** + MediaPicker FR-35); **sticky** Lưu nháp / Xem trước / Xuất bản  
**And** paste Word: toast xác nhận; paste ảnh → upload File API (ADR-24) hoặc hướng dẫn rõ  
**And** accordion SEO (FR-46); panel **?** tiếng Việt (FR-36)  
**And** mở preview tab mới với watermark nháp khi có token

### Story 11.6: Storefront — `/news`, `/news/[slug]`, metadata, mục nav Tin tức (FR-39, FR-40, FR-41, FR-46, SC-16)

Là **khách**,  
Tôi muốn **vào Tin tức từ menu, xem lưới bài đẹp và đọc bài dễ trên điện thoại**  
Để **FR-39…FR-41**, **SC-16**, **UX-DR10**.

**Given** nav có mục link `/news` (seed hoặc hướng dẫn Admin — ADR-22)  
**When** mở `/[countryCode]/news`  
**Then** card grid responsive, skeleton, empty state, phân trang đủ touch target  
**When** mở `/[countryCode]/news/[slug]`  
**Then** hero featured + prose max-width ~65–72ch; body HTML **chỉ** từ API đã sanitize  
**And** `generateMetadata` + OG theo **FR-46**  
**And** breadcrumb Trang chủ → Tin tức → tiêu đề

---

## Kiểm tra phủ tổng hợp

- **FR-1…FR-46** và **FR-2b** có story hoặc hàng bảng phủ epic (E1–E11).  
- **NFR-1…NFR-10** được gán (NFR-10 qua **11.2**, **11.3**, **11.6**); đo thủ công NFR-2, NFR-7, **SC-15 paste**.  
- **UX-DR** chính: mega/drawer (E8), announcement & trang CMS (E9), nhãn i18n (E8.6), preview/help/errors (E9), **tin tức §16 (E11)**.  
- **Growth (E10)** tách biệt; **Wave 4 (E11)** có thể chạy sau E9 (tái dùng preview/media/revalidate).

---

## Gợi ý thứ tự sprint (tham khảo)

1. E1 → E2 → E3 (API nền)  
2. E7 sớm (dữ liệu) + **7.4 (FR-2b)**  
3. E4, E5 song song  
4. E6 vòng 1  
5. **E8 (Wave 2)** — sau khi 8.1–8.2 xong có thể song song 8.3–8.6  
6. **E9 (Wave 3)** — ưu tiên 9.1–9.3 rồi 9.6 SF, xen 9.4–9.5  
7. **E10** khi product yêu cầu Growth  
8. **E11 (Wave 4 tin)** — thứ tự gợi ý: **11.1 → 11.2 → 11.3 → 11.4**, xen **11.5** / **11.6** sau khi API ổn (hoặc 11.5 song song 11.3 nếu có contract mock)

---

## Bước BMad tiếp theo

- **`bmad-create-story`** — tách **11.x** thành file story chi tiết nếu team dùng template dev.  
- **`bmad-sprint-planning`** ([SP]) — thêm **epic-11** và story **11.1…11.6** vào `sprint-status.yaml`.  
- **`bmad-check-implementation-readiness`** ([IR]) — trước khi dev **E11**.
