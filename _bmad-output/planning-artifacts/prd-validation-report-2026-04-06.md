---
validationTarget: "{project-root}/_bmad-output/planning-artifacts/prd.md"
validationDate: "2026-04-06"
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
validationStepsCompleted:
  - step-v-01-discovery
  - step-v-02-format-detection
  - step-v-03-density-validation
  - step-v-04-brief-coverage-validation
  - step-v-05-measurability-validation
  - step-v-06-traceability-validation
  - step-v-07-implementation-leakage-validation
  - step-v-08-domain-compliance-validation
  - step-v-09-project-type-validation
  - step-v-10-smart-validation
  - step-v-11-holistic-quality-validation
  - step-v-12-completeness-validation
validationStatus: COMPLETE
holisticQualityRating: "4/5"
overallStatus: Warning
---

# Báo cáo kiểm tra PRD (BMAD)

**PRD:** `_bmad-output/planning-artifacts/prd.md`  
**Ngày kiểm tra:** 2026-04-06  
**Chuẩn tham chiếu:** `prd-purpose.md` (mật độ thông tin, SMART, traceability, FR/NFR đo được).

## Khám phá tài liệu

| Mục | Kết quả |
|-----|---------|
| PRD tìm thấy | Một file: `planning-artifacts/prd.md` |
| `inputDocuments` (frontmatter) | `[]` — chỉ validate trên PRD |
| Tài liệu bổ sung | Không (theo phiên làm việc hiện tại) |

## Nhận dạng cấu trúc

- Định dạng **BMAD hợp lệ**: tóm tắt điều hành, SC (SMART), phạm vi MVP/Growth/Vision, hành trình (J1–J7), miền e-commerce, bảng công nghệ, FR/NFR có ID, phụ lục A/B, ma trận truy vết.
- Frontmatter: workflow PRD `step-12-complete`; có `lastEdited` / `editNote` wave 2.

### Format Detection (step-v-02 — sau [C])

**Cấu trúc `##` trong PRD (theo thứ tự):**  
Tóm tắt điều hành → Tiêu chí thành công (SMART) → Phạm vi sản phẩm → Hành trình người dùng → Yêu cầu theo lĩnh vực → Yêu cầu theo loại dự án & ràng buộc kỹ thuật → Yêu cầu chức năng → Yêu cầu phi chức năng → Tiêu chí thành công bổ sung (wave 2) → Ghi chú kiểm tra PRD → Phụ lục A → Phụ lục B.

**Ánh xạ mục lõi BMAD (tiếng Việt = tương đương):**

| Mục lõi BMAD | Trạng thái |
|--------------|------------|
| Executive Summary | Có — *Tóm tắt điều hành* |
| Success Criteria | Có — *Tiêu chí thành công* + bổ sung wave 2 |
| Product Scope | Có — *Phạm vi sản phẩm* |
| User Journeys | Có — *Hành trình người dùng* |
| Functional Requirements | Có — *Yêu cầu chức năng* |
| Non-Functional Requirements | Có — *Yêu cầu phi chức năng* |

**Phân loại:** **BMAD Standard** — **6/6** mục lõi.  
**Phân loại dự án (frontmatter):** `e-commerce`, `web_storefront_plus_headless_cms_admin`.

### Information Density (step-v-03)

- Quét các cụm filler/wordy/redundant tiêu chuẩn BMAD trên `prd.md`: **0** trùng khớp.  
- **Tổng vi phạm:** 0 — **Pass**.  
- **Khuyến nghị:** Giữ văn phong súc tích như hiện tại.

### Product Brief Coverage (step-v-04)

**Trạng thái:** N/A — không có Product Brief trong `inputDocuments`.

### Measurability (step-v-05)

- Đa số FR/NFR/SC có ngưỡng hoặc phương pháp kiểm tra (LCP, kích thước ảnh, p95, WCAG checklist, audit manual).  
- **Cảnh báo nhẹ:** J7 tiêu đề mang tính định tính nhưng đã có SC-10…12 và NFR-7 bù.

### Traceability (step-v-06)

- Mỗi J có *Traceability*; Phụ lục B có J7 và FR-22…29 — **tốt**.

### Implementation Leakage (step-v-07)

- Bảng công nghệ và Growth ghi Medusa/Next.js — **chấp nhận** (đúng vai trò ràng buộc stack). FR/NFR vẫn chủ yếu mô tả năng lực, không lệ thuộc thư viện cụ thể.

### Domain Compliance (step-v-08)

- E-commerce: PCI (khi có thanh toán), đồng bộ giá, phạm vi thuế/vận chuyển — **đủ mức PRD**.

### Project-Type Compliance (step-v-09)

- Khớp `productType` storefront + headless CMS + Admin — **khớp** nội dung PRD.

### SMART Quality (step-v-10)

- Bảng SC có cột đo lường; Growth có SC-7…9 — **tốt**.

### Holistic Quality (step-v-11)

- **Điểm:** **4/5** — mạnh về traceability và đo lường; trừ điểm nhỏ vì SC-6/J3 vs FR-29 và ngày trong thân PRD.

### Completeness (step-v-12)

- Wave 2, J7, FR-29, ghi chú validate — **đủ** cho giai đoạn hiện tại; nên chỉnh PRD nhỏ theo mục “Phát hiện” bên dưới.

## Đối chiếu tiêu chuẩn BMAD

| Tiêu chí | Đánh giá |
|----------|----------|
| Mật độ thông tin | Tốt — FR/NFR/SC có ID; ít filler. |
| FR là năng lực + có thể kiểm tra | Tốt — đa số có tiêu chí hoặc gửi thẳng SC/NFR; wave 2 có SC-10…12. |
| NFR đo được | Tốt — LCP, kích thước ảnh, p95 Admin; NFR-7 gắn WCAG + checklist. |
| Traceability | Tốt — J có Traceability; Phụ lục B có J7 và FR-22…29. |
| Tránh subjective thuần túy | Một phần wave 2 còn từ “đẹp, dễ dùng” trong tên J7 — đã bù bằng SC/NFR cụ thể; **chấp nhận được**. |
| Miền e-commerce | Có — PCI, đồng bộ giá, thuế/ship ghi ngoài phạm vi. |

## Phát hiện — cần làm rõ hoặc chỉnh PRD (ưu tiên)

### 1. Mâu thuẫn tiềm ẩn SC-6 vs FR-13 / FR-29 (trung bình)

- **SC-6** vẫn nói menu load **động từ collections đã seed**.  
- **FR-29** yêu cầu menu **hai cấp từ cấu hình CMS**; **FR-13** ưu tiên CMS khi FR-29 đủ dữ liệu.

**Khuyến nghị:** Bổ sung dòng vào SC-6 (hoặc SC-6b wave 2): *“Khi FR-29 đã triển khai, cấu trúc menu hiển thị theo cấu hình CMS; collections chỉ là nguồn liên kết/tên đồng bộ, không nhất thiết là nguồn duy nhất của cây menu.”* — tránh QA đo SC-6 theo cách cũ trong khi sản phẩm đã chuyển CMS.

### 2. J3 chưa đồng bộ J7 (thấp–trung bình)

- **J3** bước 3 vẫn mô tả menu = **collections khớp seed**.  
- **J7** mô tả header chỉ logo, menu 2 cấp CMS.

**Khuyến nghị:** Thêm bước hoặc ghi chú trong J3: *“Sau wave 2, cây menu theo FR-29 (CMS).”* hoặc trỏ chéo J7.

### 3. FR-11b vs mô hình dữ liệu CMS hiện tại (trung bình)

- **FR-11b** + **FR-27** kỳ vọng **tên site / tagline** theo locale.  
- Kiểu `CmsSettingsPublic` hiện có `site_title: string | null` **đơn ngôn ngữ** — gap thiết kế.

**Khuyến nghị:** `bmad-create-architecture` / story: mở rộng schema (`site_title_i18n` hoặc tương đương) hoặc ghi rõ trong PRD *“giai đoạn 1 chỉ vi, en copy env”* để tránh hiểu nhầm FR.

### 4. Metadata PRD vs phần thân (thấp)

- Dòng **Ngày:** 2026-03-30 trong thân tài liệu; **lastEdited** 2026-04-06.  
**Khuyến nghị:** Cập nhật dòng ngày trong header PRD hoặc thêm “Sửa đổi lần cuối” cho khớp.

## Ghi nhận triển khai (không chặn “PRD hợp lệ”)

So với code tham chiếu (`nav`, `footer`, `side-menu`):

- Header có thể vẫn hiển thị **site title cạnh logo** — lệch **FR-11 / FR-11b / SC-12** cho đến khi story wave 2 hoàn tất.  
- **Menu 2 cấp CMS + Store API** — chưa có trong snippet CMS hiện tại; đúng với ghi chú PRD về epic/story backend.

Đây là **khoảng cách implementation**, không phải lỗi cú pháp PRD.

## Kết luận

PRD **đạt** ngưỡng BMAD để tiếp tục chuỗi **UX → Kiến trúc → Epic/Story → Sprint**, với **điều kiện:** xử lý các mục **ưu tiên 1–2** (SC-6/J3 vs FR-29) trong một lần chỉnh sửa PRD nhỏ để tránh hai tiêu chí acceptance xung đột.

**Trạng thái:** `COMPLETE` — chuỗi step-v-01 → v-12 đã ghi nhận sau lựa chọn **[C] Continue** (format detection → completeness).

## Bước tiếp theo (khuyến nghị)

1. Chỉnh PRD theo mục 1–2 (và tùy chọn 4).  
2. `bmad-create-architecture` — schema + API **FR-29**, i18n **site_title** nếu chốt.  
3. `bmad-create-ux-design` — header/footer/menu 2 cấp + mobile.  
4. `bmad-check-implementation-readiness` ([IR]) trước dev lớn.

---

## Phụ lục — Rà soát CMS hiện đại (phiên bản PRD sau chỉnh sửa)

**Ngày ghi nhận:** 2026-04-06 (sau yêu cầu validate + bổ sung tính năng cho người phi kỹ thuật).

Đã thêm vào PRD **Wave 3**: **FR-30…FR-38**, **J8**, **SC-13…SC-14**, **NFR-9** (trang CMS tĩnh, SEO cơ bản, footer/MXH, announcement bar, preview/publish, thư viện ảnh, trợ giúp trong Admin, lịch sử/hoàn tác, 404 chỉnh từ CMS, thông báo lỗi tiếng Việt).

**Gợi ý chưa đưa vào PRD (Vision / phase sau, tùy ưu tiên):** page builder kéo-thả toàn trang; A/B toàn site; tích hợp CRM/email marketing; multi-site; workflow phê duyệt đa cấp ngoài FR-18.
