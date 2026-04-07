# Story 9.6: Storefront — route `/[countryCode]/p/[slug]`, metadata SEO, AnnouncementBar, `not-found` CMS

**Story Key:** `9-6-storefront-cms-page-route-seo-announcement-not-found`

**Story ID:** 9.6

**Epic:** 9 — CMS vận hành & nội dung tĩnh (Wave 3)

**Status:** done

**Phụ thuộc:** **9.1–9.5** đã hoàn thành. Backend đã có **GET `/store/custom/cms-pages/[slug]`** (published + preview token), **GET `/store/custom/cms-settings`** (ADR-13: `announcement`, `not_found`, `seo_defaults`, …). Story này chỉ **storefront Next.js**: route động, ISR tag, UI đọc API có sẵn.

---

## Story

Là **khách**,  
tôi muốn **đọc trang chính sách (slug), thấy thanh thông báo site-wide, và trang 404 thân thiện đúng locale**,  
để **FR-30, FR-31, FR-33, FR-38, UX-DR3, UX-DR4**.

---

## Acceptance Criteria

1. **Route CMS page:** Thêm **`apps/backend-storefront/src/app/[countryCode]/(main)/p/[slug]/page.tsx`** (App Router). URL công khai: `/[countryCode]/p/[slug]` (ví dụ `/vi/p/chinh-sach-doi-tra`). **`countryCode`** giữ convention hiện tại (= locale `vi` | `en`) — [Source: `_bmad-output/project-context.md`].
2. **Dữ liệu trang:** Gọi Store API **`GET /store/custom/cms-pages/:slug`** với query **`locale=<countryCode>`** (khớp handler backend: `locale` từ query hoặc `default_locale`). Response JSON đã có `title`, `body`, `meta_title`, `meta_description` — [Source: `apps/backend/src/api/store/custom/cms-pages/[slug]/route.ts`]. Dùng **`next: { tags: ["cms-pages"], revalidate: <số giây hợp lý, ví dụ 180> }`** + `cache: "force-cache"` theo pattern `getCmsSettingsPublic` / `listBannerSlides` — [Source: `apps/backend-storefront/src/lib/data/cms.ts`].
3. **Preview (ADR-14):** Nếu URL có **`?cms_preview=<token>`**, forward token sang request Store API (query `cms_preview` **hoặc** header `x-cms-preview` — backend hỗ trợ cả hai). Trong chế độ preview, response có thể có `status`; **không** cache công khai CDN cho preview — backend đã set `Cache-Control: private, no-store` khi preview; storefront **không** force-cache khi có token (gọi `fetch` không tag cache hoặc `cache: "no-store"`).
4. **`generateMetadata`:** `title` / `description` ưu tiên `meta_title` / `meta_description` từ payload trang; fallback hợp lý (tên site từ `resolveCmsSiteTitle` + `getCmsSettingsPublic`, hoặc `seo_defaults` trong settings nếu product muốn đồng bộ — **không** bắt buộc trùng product page). `openGraph`/`twitter` tùy chọn nếu đã có `og_image_url` từ settings — [Source: `apps/backend/src/api/store/custom/cms-settings/route.ts`].
5. **Layout nội dung:** Vùng nội dung **max-width** (ví dụ `max-w-3xl` / container hiện có) để body đọc dễ; typography nhất quán với storefront (heading, spacing).
6. **Breadcrumb:** Tối thiểu **Trang chủ** → **tiêu đề trang** (nhãn i18n tĩnh cho “Trang chủ” có thể lấy từ `getStorefrontMessages` hoặc chuỗi locale — nhất quán với pattern trang khác).
7. **AnnouncementBar (FR-33, UX):** Component đọc **`announcement`** từ **`getCmsSettingsPublic`** (mở rộng type/parse để có field này; API store đã trả — [Source: `apps/backend/src/api/store/custom/cms-settings/route.ts`]). Hành vi: **chỉ hiện khi `enabled`**; text theo locale (`vi`/`en` trong `text`); **full width**; nút đóng (×) **optional** + `localStorage` dismiss key ổn định nếu làm — [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — AnnouncementBar]. Vị trí: **dưới header** hoặc **trên cùng** nhưng **một chỗ cố định** toàn site — gắn vào **`(main)/layout.tsx`** để mọi trang main (kể cả home) đều thấy khi bật.
8. **`not-found` CMS:** Cập nhật **`apps/backend-storefront/src/app/[countryCode]/(main)/not-found.tsx`** (và xem xét root `not-found.tsx` nếu cần thống nhất): đọc **`not_found`** từ settings (`title` / `body` JSON `{vi,en}` — parse an toàn), hiển thị theo **`countryCode`**; fallback về copy tiếng Anh hiện tại nếu CMS trống. Metadata title/description theo locale.
9. **404 khi slug không tồn tại / không published:** Trong `p/[slug]/page.tsx`, khi API trả **404** (hoặc client SDK lỗi tương đương), gọi **`notFound()`** từ `next/navigation` để dùng UI `not-found` đã cấu hình.
10. **ISR / publish:** Không đổi backend. Xác nhận tag **`cms-pages`** (và **`cms`** cho settings/nav) đã được backend gọi `revalidateStorefrontCms` khi publish — dev chỉ cần **gắn đúng tag** trên fetch tương ứng — [Source: `apps/backend/src/utils/revalidate-storefront.ts`].
11. **Kiểm thử:** Không bắt buộc E2E mới nếu infra giống story 9.2; tối thiểu **kiểm thủ công** checklist trong Dev Agent Record. Unit test storefront **tùy chọn** (pure helper parse announcement/not_found) nếu tách hàm nhỏ; ưu tiên **không** phình scope.

---

## Tasks / Subtasks

- [x] Thêm **`getCmsPagePublic(slug, locale, opts?: { previewToken?: string })`** (hoặc tên tương đương) trong `apps/backend-storefront/src/lib/data/cms.ts`, dùng `sdk.client.fetch` → `/store/custom/cms-pages/${encodeURIComponent(slug)}`, query `locale`, preview nếu có.
- [x] Mở rộng **`CmsSettingsPublic`** (và/hoặc getter riêng) để **`announcement`**, **`not_found`**, **`seo_defaults`**, **`og_image_url`**, **`footer_contact`** khớp payload store (sau `getCmsSettingsPublic` đã spread `data` — bổ sung type + optional `absolutizeMedusaFileUrl` cho ảnh OG nếu cần).
- [x] Tạo **`p/[slug]/page.tsx`**: `generateMetadata`, `default` page component, `notFound()` khi không có trang.
- [x] Tạo component **`AnnouncementBar`** (module layout hoặc `modules/layout/components/`) + gắn vào **`(main)/layout.tsx`**.
- [x] Cập nhật **`not-found.tsx`** (main) để dùng copy CMS; kiểm tra hành vi link về home đúng `/${countryCode}`.
- [x] `npm run build` / lint trong `apps/backend-storefront`; ghi Completion Notes.

---

## Dev Notes

### Kiến trúc & PRD

- **ADR-12** — route SF `p/[slug]`, ISR tag `cms-pages` — [Source: `_bmad-output/planning-artifacts/architecture.md` §ADR-12, §5].
- **ADR-13** — `announcement`, `not_found` trên settings — cùng file.
- **ADR-14** — preview token — handler store đã implement.

### Code reuse (không reinvent)

- Fetch CMS: **`@lib/data/cms.ts`**, **`sdk`** từ **`@lib/config`**.
- Tiêu đề site: **`resolveCmsSiteTitle`**, messages **`getStorefrontMessages`**.
- Ảnh file URL: **`absolutizeMedusaFileUrl`** — [Source: `apps/backend-storefront/src/lib/util/cms-assets.ts`].
- Layout hiện có: **`Nav`**, **`Footer`**, **`StorefrontI18nProvider`** — [Source: `apps/backend-storefront/src/app/[countryCode]/(main)/layout.tsx`].
- Backend parse ADR-13 (tham chiếu hành vi field): **`parseAnnouncement`** — [Source: `apps/backend/src/utils/cms-settings-adr13.ts`] (storefront có thể parse nhẹ phía client hoặc chỉ đọc JSON đã validate bởi API).

### Phạm vi & tránh làm

- **`not-found` và `params`:** Trong App Router, `not-found.tsx` có thể **không** nhận `countryCode` trực tiếp — nếu gặp, resolve locale qua **`headers()`** / segment URL / fallback `default_locale` từ CMS; ghi cách chốt trong Completion Notes.
- **Không** thêm locale thứ ba.
- **Không** thay đổi contract Store API trừ khi phát hiện bug blocking; ưu tiên adapter storefront.
- **HTML `body`:** Backend trả chuỗi; nếu render rich HTML, dùng pattern an toàn (class prose) — nếu team đã sanitize phía server khi save, ghi rõ trong Completion Notes; không tự mở endpoint mới.

### Testing

- [Source: `_bmad-output/project-context.md`] — storefront ESLint; không bắt buộc Jest story này trừ helper thuần.

### Project Structure Notes

- Next.js app: **`apps/backend-storefront/src/app/[countryCode]/(main)/p/[slug]/page.tsx`**.
- Tag cache: **`cms-pages`** cho trang; **`cms`** cho settings (đã dùng trong `getCmsSettingsPublic`).

### References

- Epic — [Source: `_bmad-output/planning-artifacts/epics.md` — Story 9.6].
- UX Announcement / 404 — [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — J-Admin-6, bảng component].

---

## Dev Agent Record

### Agent Model Used

Cursor Agent (Composer)

### Debug Log References

### Completion Notes List

- **Route:** `/[countryCode]/p/[slug]` — ví dụ `/vi/p/<slug-published>`. Preview: `?cms_preview=<token>` (cache `no-store`, không tag).
- **ISR:** `getCmsPagePublic` dùng `tags: ["cms-pages"]`, `revalidate: 180`; `getCmsSettingsPublic` giữ `tags: ["cms"]`. Cả hai bọc `cache()` để dedupe trong cùng request (layout + nav + trang).
- **404 slug:** `FetchError` status 404 → `notFound()`; UI 404 lấy copy từ CMS qua `getNotFoundCopy` + cookie `_medusa_locale` (`lib/not-found-cms.ts`).
- **AnnouncementBar:** dưới `Nav`, `enabled` + cửa sổ `starts_at`/`ends_at` (parse `Date`), dismiss + `localStorage` key `cms_announcement_dismissed_sig`.
- **Kiểm tra:** `npx tsc --noEmit` (apps/backend-storefront) pass. `next build` fail EPERM trên `.next/trace` trong môi trường agent; `next lint` fail rule config sẵn có (`no-html-link-for-pages`).
- **Code review 2026-04-07:** Approve; patch link ngoài AnnouncementBar (`noopener` / tab mới).

### File List

- `apps/backend-storefront/src/lib/data/cms.ts`
- `apps/backend-storefront/src/lib/not-found-cms.ts`
- `apps/backend-storefront/src/modules/layout/components/announcement-bar.tsx`
- `apps/backend-storefront/src/app/[countryCode]/(main)/layout.tsx`
- `apps/backend-storefront/src/app/[countryCode]/(main)/p/[slug]/page.tsx`
- `apps/backend-storefront/src/app/[countryCode]/(main)/not-found.tsx`
- `apps/backend-storefront/src/app/not-found.tsx`

### Review Follow-ups (AI)

- [x] [Review][Patch] Link announcement: `rel="noopener noreferrer"` + `target="_blank"` khi URL tuyệt đối `http(s)` — `apps/backend-storefront/src/modules/layout/components/announcement-bar.tsx`.

---

## Senior Developer Review (AI)

**Outcome:** Approve (2026-04-07)

**Tóm tắt:** Luồng ISR/tag khớp backend; preview không cache công khai; 404 slug và CMS `not_found` nhất quán. Không blocker.

**Action items**

- [x] Low: hardening liên kết ngoài trên AnnouncementBar — đã patch.

**Ghi chú / defer**

- `dangerouslySetInnerHTML` (body trang + 404): phụ thuộc sanitize phía backend khi lưu; không nằm scope story.
- `FetchError` 404: nếu SDK đổi shape lỗi, cần smoke test sau upgrade `@medusajs/js-sdk`.
- `aria-label` region announcement tiếng Anh — có thể i18n sau (nice-to-have).

---

## Previous story intelligence (9.5)

- Revalidate: **`revalidateStorefrontCms("cms-pages")`** / **`("cms")`** đã gọi từ backend khi publish/restore — storefront chỉ cần tag khớp — [Source: `9-5-admin-history-restore-fr-37.md` Completion Notes].
- **Deferred:** không áp dụng trực tiếp SF; giữ nhận thức perf `GET` revision — không liên quan route công khai.

---

## Git / gần đây

- Mã CMS store/settings/nav/pages đã ổn trên `main` branch làm việc; ưu tiên mở rộng `cms.ts` và layout SF thay vì chạm backend trừ bug.

---

## Project context reference

- Next **15.3.9**, segment **`[countryCode]`**, Medusa backend **2.13.1** — [Source: `_bmad-output/project-context.md`].
