# Story 12.1: CMS tin tức — parity WordPress (phân loại, storefront, seed)

Status: ready-for-dev

## Story

Là **biên tập viên / chủ shop không rành kỹ thuật**,  
tôi muốn **quản lý tin tức giống bài viết WordPress** (tiêu đề, slug, đoạn trích, ảnh đại diện, nội dung WYSIWYG, trạng thái xuất bản, **chủ đề / nhãn**),  
để **khách xem tin trên storefront đẹp, có danh mục, tin liên quan và mục tin trên trang chủ** mà không cần biết HTML.

## Tham chiếu mô hình WordPress (chuẩn thị trường)

Tài liệu chính thức (form / sidebar bài viết):

- [Page/Post Settings sidebar — Featured image, Excerpt, Status, Slug, Categories, Tags](https://wordpress.org/documentation/article/page-post-settings-sidebar/)
- [Post Editing Screen — Title, Editor, Publish, Categories, Tags, Excerpt](https://make.wordpress.org/support/user-manual/posts/post-editing-screen/)
- [Classic: Posts Add New Screen — permalink/slug, body, categories, tags, excerpt](https://codex.wordpress.org/Posts_Add_New_Screen)
- [Block Editor overview](https://wordpress.org/documentation/article/wordpress-block-editor/) — *không* bắt chước full block editor; giữ **TipTap** một vùng như đã có (ADR-19).

**Bảng so sánh (WordPress → hiện trạng repo):**

| WordPress | Hiện trạng (sau Epic 11) | Epic 12 |
|-----------|---------------------------|---------|
| Title | `title_i18n` (vi/en tabs) | Giữ; cải thiện UX “Tạo lại slug từ tiêu đề” nếu thiếu |
| Slug / permalink | `slug` global unique | Giữ |
| Body (Visual) | TipTap → `body_html_i18n` + sanitize | Giữ |
| Excerpt | `excerpt_i18n` | Giữ; gợi ý auto từ đoạn đầu (tuỳ chọn) |
| Featured image | `featured_image_file_id` | Giữ |
| Categories (phân cấp tuỳ WP) | **Chưa có** | **Thêm** taxonomy + gán bài |
| Tags | **Chưa có** | **Thêm** |
| Published / Draft | `status` + `published_at` | Giữ; có thể bổ sung lịch xuất bản sau |
| Related posts | **Chưa có** | Theo **cùng category** (ưu tiên) hoặc fallback mới nhất |
| Blog home + archive theo category | `/news` flat | `/news`, **`/news/category/[slug]`** |
| “Latest posts” trên front page | **Chưa có** | Section trang chủ + CTA “Xem tất cả” |

## Acceptance Criteria

1. **AC1 — Dữ liệu mẫu:** Seed (idempotent theo `slug`) ít nhất **3 bài tin published** tiếng Việt + tiếng Anh, có excerpt và HTML nội dung an toàn; sau `seed:sales-kit` (hoặc tài liệu chạy seed) storefront `/news` và trang chủ không trống.
2. **AC2 — Trang chủ:** Có section **“Tin mới” / “Latest news”** (3–4 bài), card đồng bộ UX §16.1, link “Xem tất cả → `/news`”.
3. **AC3 — Danh sách tin:** `/[locale]/news` hỗ trợ **phân trang** (query `?page=` hoặc tương đương), page size 9–12, nút Trước/Sau (UX §16.1).
4. **AC4 — Chi tiết:** Cuối bài có **divider + link “← Tất cả tin tức”**; block **“Tin liên quan”** (tối đa 3 bài, loại trừ bài hiện tại) — phase 1: theo **bài mới nhất**; phase 2: theo **category chung** khi AC5 xong.
5. **AC5 — Taxonomy (WordPress-like):** Model + migration: **`store_cms_news_category`** (`slug` unique, `title_i18n` JSONB), **`store_cms_news_tag`** (`slug` unique, `title_i18n`), bảng nối **article–category** (nhiều–nhiều), **article–tag** (nhiều–nhiều). Admin: CRUD category/tag tối thiểu + gán trên form bài. Store API: lọc list theo `category_slug`, `tag_slug`; endpoint hoặc query list categories.
6. **AC6 — Admin UX:** Sidebar kiểu WordPress: nhóm **“Xuất bản”**, **“Phân loại”** (categories checkbox / tag input), **“Ảnh đại diện”**, **“Đoạn trích”** — bám `@medusajs/ui` và `ux-design-specification.md` §16.3–16.4.
7. **AC7 — Bảo mật & kiến trúc:** Store routes chỉ public published (trừ preview token như hiện tại); HTML sanitize không đổi (NFR-10); ISR tag **`cms-news`** (+ tag theo slug nếu đã có pattern); không `AUTHENTICATE=false` lộ dữ liệu nháp.

## Tasks / Subtasks

- [ ] **Migration + module:** Models, service methods, FK/junction, index `(status, published_at)` không đổi; thêm index gợi ý cho filter category.
- [ ] **Admin API:** `GET/POST/PATCH/DELETE` categories & tags; mở rộng `PATCH /admin/custom/cms-news/:id` nhận `category_ids`, `tag_ids` hoặc slug arrays (chốt một contract).
- [ ] **Store API:** Mở rộng `GET /store/custom/cms-news` với `category_slug`, `tag_slug`, `limit`, `offset`; `GET /store/custom/cms-news/categories` (public).
- [ ] **Admin UI:** Form bài tin + màn quản lý category/tag.
- [ ] **Storefront:** Trang category, cập nhật list/detail/home; `getCmsNewsList` nhận tham số phân trang + cache tag.
- [ ] **Seed:** Bài mẫu + **gán category/tag** sau khi taxonomy có.
- [ ] **Test:** Ít nhất integration module hoặc HTTP cho filter list + category list.

## Dev Notes

### Hiện trạng code (reuse)

- Model bài tin: `apps/backend/src/modules/store-cms/models/store-cms-news-article.ts`
- Admin routes: `apps/backend/src/api/admin/custom/cms-news/`
- Store routes: `apps/backend/src/api/store/custom/cms-news/`
- Admin UI: `apps/backend/src/admin/routes/cms-news/`
- SF: `apps/backend-storefront/src/app/[countryCode]/(main)/news/`, `@lib/data/cms.ts`
- Sanitize: `apps/backend/src/utils/cms-news.ts`, `cms-page.ts`
- Revision: `apps/backend/src/utils/cms-news-revision.ts`

### Kiến trúc

- ADR-20…25 trong `_bmad-output/planning-artifacts/architecture.md` — bổ sung ADR mới cho taxonomy (ghi rõ bảng + API) khi implement AC5.
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` §16.

### Gợi ý giải pháp “tốt nhất thị trường”

- **Không** nhúng WordPress; **bắt chước IA + form** (Categories/Tags/Featured/Excerpt/Publish) — quen thuộc với user phi kỹ thuật.
- Taxonomy **riêng bảng** (chuẩn CMS), không chỉ JSON trên bài — để filter, URL archive và related ổn định.

### Testing

- `apps/backend`: `npm run test:integration:http` / `test:integration:modules` theo `project-context.md`.

## Dev Agent Record

### Agent Model Used

_(điền khi dev-story chạy)_

### Debug Log References

### Completion Notes List

### File List

_(điền khi hoàn thành)_

---

**Trạng thái create-story:** đã ghi đủ ngữ cảnh WordPress + AC/Tasks.

**Đã làm sẵn một phần (2026-04-09, trước khi dev AC5–AC7):**

- Store API list trả thêm `count` phục vụ phân trang.
- Storefront: phân trang `/news`, section **Tin mới** trên trang chủ, chi tiết có **← Tất cả tin tức** + **Tin liên quan** (theo bài mới nhất, chưa theo category).
- Seed `seed-sales-kit`: 3 bài published + revision + wipe news khi reset kit; revalidate tag `cms-news`.

**Còn lại cho dev-story:** taxonomy category/tag, Admin + Store filter/archive, related theo category, test tích hợp.
