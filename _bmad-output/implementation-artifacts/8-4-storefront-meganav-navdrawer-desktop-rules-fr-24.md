# Story 8.4: Storefront — MegaNav + NavDrawer + quy tắc desktop (FR-24)

**Story Key:** `8-4-storefront-meganav-navdrawer-desktop-rules-fr-24`  
**Story ID:** 8.4  
**Epic:** 8 — Điều hướng & thương hiệu storefront (Wave 2)  
**Status:** done

> **Phụ thuộc:** API Store **`GET /store/custom/nav-menu?locale=`** (story **8.2**) và dữ liệu từ Admin editor (**8.3**). **Không** hoàn thiện layout “header chỉ logo” / footer branding — đó là story **8.5**. **Không** đổi contract JSON `nav_tree` / `buildResolvedNavMenu` trừ khi phát hiện bug chặn UI (ưu tiên xử lý phía storefront).

---

## Story

Là **khách**,  
tôi muốn **điều hướng hai cấp trên desktop và mobile với cùng dữ liệu từ CMS**,  
để **FR-25**, **FR-29**, **UX-DR1**, **UX-DR2** và **FR-24** (quy tắc giới hạn mục desktop được document rõ).

---

## Acceptance Criteria

1. **Nguồn dữ liệu:** Storefront **không** còn dùng `listCollections` + `topCollections.slice(0, 6)` làm menu chính (desktop strip + drawer). Thay bằng **`GET /store/custom/nav-menu?locale={countryCode}`** (segment `[countryCode]` = locale `vi` | `en`), với **`next: { tags: ["cms-nav"], revalidate: … }`** (hoặc tương đương) để khớp backend revalidate **`tag: "cms-nav"`** sau PATCH menu [Source: `apps/backend/src/utils/revalidate-storefront.ts`].
2. **Desktop (breakpoint `small:` trở lên — khớp chỗ hiện đang `hidden small:flex`):** render **MegaNav / dropdown 2 cấp**: cấp 1 = **nhóm** (`ResolvedNavGroup.label`), cấp 2 = **children** (collection hoặc link). Mở bằng **hover hoặc click** (chốt một hành vi nhất quán trong PR); **delay đóng ngắn** để tránh menu “giật” [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — mục Nav desktop]. **Esc** đóng panel đang mở; **focus** có thể quản lý tối thiểu (return focus hợp lý khi đóng nếu dùng click mở).
3. **Mobile / `< small`:** **SideMenu** (drawer) hiển thị **cùng cây** `items[]` như desktop: nhóm có thể **accordion** [Source: UX § Nav mobile]. **Touch target ≥ 44px** cho control chính (nút menu, đóng, mục nhóm/mở accordion). **Đóng** bằng **backdrop** và nút đóng rõ ràng (đã có pattern Popover + backdrop — cần đảm bảo không regress).
4. **Link ngoài:** payload child `type: "link"` có `href` là URL đầy đủ đã validate ở backend. Render bằng **`<a href>`** + `rel="noopener noreferrer"` và `target="_blank"` khi là URL tuyệt đối; **không** bọc qua `LocalizedClientLink` (component đó luôn prefix `/${countryCode}`) [Source: `apps/backend-storefront/src/modules/common/components/localized-client-link/index.tsx`].
5. **Link collection:** `href` từ API dạng `/collections/{handle}` — dùng **`LocalizedClientLink`** (hoặc `Link` + prefix locale đúng pattern hiện tại).
6. **FR-24 — Quy tắc số mục desktop:** Thay cho việc **cắt im lặng** `slice(0, 6)` collection, phải có **quy tắc nghiệp vụ document** trong code: ví dụ hằng số `MAX_DESKTOP_TOP_LEVEL_GROUPS` (hoặc tương đương), comment block hoặc file `*.ts` ngắn giải thích; nếu số **nhóm cấp 1** vượt ngưỡng thì **gom phần dư** vào một nhóm / entry **“Xem thêm”** dùng **`getStorefrontMessages(locale).nav.*`** (thêm key i18n **vi/en** nếu chưa có). Không được giữ hành vi “chỉ hiện 6 nhóm đầu mà không giải thích” trên production.
7. **Hàng rỗng / lỗi mạng:** Nếu API trả `items: []` hoặc fetch thất bại, UI **không** 500: có thể ẩn strip desktop + drawer chỉ còn shortcut (home/store/…) hoặc fallback tối thiểu — **ghi rõ** trong implementation notes sau khi chọn; không hard-code danh sách collection production làm truth [Source: `_bmad-output/project-context.md` — Critical Don't-Miss].
8. **Giữ nguyên** các phần không thuộc menu CMS trong `SideMenu`: **SIDE_LINKS**, **LanguageSelect**, **CountrySelect**, **brandName** footer trong drawer — trừ khi cần chỉnh tối thiểu cho accordion / a11y.

---

## Tasks / Subtasks

- [x] (AC: 1) Thêm **`getNavMenuPublic`** trong `apps/backend-storefront/src/lib/data/nav-menu.ts` — `sdk.client.fetch` `/store/custom/nav-menu`, **`cache: "force-cache"`**, **`next: { tags: ["cms-nav"], revalidate: 180 }`** (cùng chu kỳ ISR như `cms-settings` / banner), bọc **`cache()`** từ `react` để dedupe nhiều lần gọi trong **cùng một request** render.
- [x] (AC: 1–2) Component **`MegaNav`** — hover + delay đóng, click toggle, Esc + focus lại trigger.
- [x] (AC: 3, 8) **`SideMenu`**: prop **`navItems`**, accordion Radix, touch target ≥ 44px, backdrop giữ nguyên.
- [x] (AC: 4–5) **`isExternalOrAbsoluteHref`** + **`NavMenuChildLink`**.
- [x] (AC: 6) **`applyDesktopNavFr24`** + `MAX_DESKTOP_TOP_LEVEL_GROUPS` trong `desktop-nav-fr24.ts`.
- [x] (AC: 7) Fetch lỗi / parse → `{ items: [] }`; desktop ẩn MegaNav; drawer vẫn có SIDE_LINKS.
- [x] Cập nhật **`Nav`**: bỏ `listCollections` cho menu; một lần `getNavMenuPublic` trong `Promise.all`.
- [x] (AC: 2–3) `aria-label` MegaNav = `m.nav.collectionsAria`; nút đóng drawer có `aria-label`.
- [ ] Test Jest storefront (chưa có script) — QA thủ công; pure function FR-24 sẵn sàng test sau nếu thêm Jest.

---

## Dev Notes

### Contract API (đã resolve)

Response Store [Source: `apps/backend/src/api/store/custom/nav-menu/route.ts` + `build-resolved-nav-menu.ts`]:

- `{ locale: string; items: ResolvedNavGroup[] }`
- `ResolvedNavGroup`: `{ id, label, children: ResolvedNavChild[] }`
- `ResolvedNavChild`: `{ type: "collection", handle, label, href }` | `{ type: "link", label, href }`

### File hiện tại cần chạm

- `apps/backend-storefront/src/modules/layout/templates/nav/index.tsx` — tích hợp fetch + MegaNav + props SideMenu  
- `apps/backend-storefront/src/modules/layout/components/side-menu/index.tsx` — drawer cùng cây CMS  
- `apps/backend-storefront/src/lib/data/cms.ts` (hoặc file data mới) — fetch + cache tag **`cms-nav`**  
- `apps/backend-storefront/src/lib/i18n/storefront-messages.ts` — key **“Xem thêm”** / aria nếu cần  

### Kiến trúc & stack

- Next.js **15** App Router, Server Component + client islands [Source: `_bmad-output/project-context.md`].  
- **ADR-11** — một nguồn menu, mobile/desktop cùng payload [Source: `_bmad-output/planning-artifacts/architecture.md`].  
- `@headlessui/react` đã dùng cho Popover drawer — có thể tiếp tục hoặc bổ sung **Menu** / **Disclosure** cho mega/accordion; tránh thêm thư viện nặng nếu không cần.

### Tránh làm

- Không sửa **8.5** trong phạm vi story này (bỏ text cạnh logo, footer branding).  
- Không duplicate nguồn menu từ `listCollections` cho production nav.

---

## Intelligence từ story trước (8.3)

- Admin editor đã lưu đúng `nav_tree`; verify nhanh bằng `GET /store/custom/nav-menu?locale=vi` sau khi sửa menu.  
- **8.3** cố ý **không** làm MegaNav — giờ là phần việc của **8.4**.  
- DnD / PATCH nằm ở Admin; storefront **read-only** qua Store API.

---

## Kiểm thử gợi ý

- Manual: desktop hover/click, Esc, tab focus cơ bản; mobile tap mở/đóng, backdrop; đổi **vi/en** và so khớp nhãn với Admin.  
- Unit (optional): hàm pure nhận `items[]` + `max` → output có nhóm overflow + nhãn i18n.

---

## References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 8.4]  
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Nav desktop/mobile, bảng component MegaNav / NavDrawer]  
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR-24, FR-25, FR-29]  
- [Source: `_bmad-output/implementation-artifacts/8-2-admin-crud-menu-store-get-nav-menu-resolved.md`]  
- [Source: `_bmad-output/project-context.md`]

---

## Dev Agent Record

### Agent Model Used

Cursor Agent (bmad-dev-story)

### Debug Log References

### Completion Notes List

- Menu đọc **`GET /store/custom/nav-menu`** với **Data Cache** Next (`force-cache` + `revalidate: 180s`) và tag **`cms-nav`** (on-demand khi Admin PATCH menu).
- **`cache()` (React)** bọc fetch để nếu sau này nhiều server component gọi `getNavMenuPublic(locale)` trong cùng request thì chỉ **một** lần tới Medusa.
- Desktop: **MegaNav** + **FR-24** gom nhóm dư vào “Xem thêm”; mobile: **cùng `items`** đầy đủ, accordion.
- `tsc --noEmit` storefront pass.

### File List

- `apps/backend-storefront/src/lib/data/nav-menu.ts`
- `apps/backend-storefront/src/lib/nav/nav-types.ts`
- `apps/backend-storefront/src/lib/nav/is-external-href.ts`
- `apps/backend-storefront/src/lib/nav/desktop-nav-fr24.ts`
- `apps/backend-storefront/src/modules/layout/components/mega-nav/index.tsx`
- `apps/backend-storefront/src/modules/layout/components/nav-menu-child-link/index.tsx`
- `apps/backend-storefront/src/modules/layout/components/side-menu/index.tsx`
- `apps/backend-storefront/src/modules/layout/templates/nav/index.tsx`
- `apps/backend-storefront/src/lib/i18n/storefront-messages.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/8-4-storefront-meganav-navdrawer-desktop-rules-fr-24.md`

### Change Log

- 2026-04-06: Story context tạo bởi **bmad-create-story** — trạng thái `ready-for-dev`.
- 2026-04-06: Triển khai 8.4 + cache; sprint → `review`.
- 2026-04-06: Code review batch patch (0) — edge FR-24 + MegaNav index + drawer accordion value; sprint → `done`.

### Review Findings

_(bmad-code-review, 2026-04-06 — phạm vi file story 8.4 / nav CMS storefront)_

- [x] [Review][Patch] **Trùng `group.id` từ CMS** — đã chuyển `MegaNav` sang **`openIndex`**, key `mega-nav-${index}-${id}`; drawer dùng `value={nav-acc-${index}}` + key kết hợp index [`mega-nav/index.tsx`, `side-menu/index.tsx`].
- [x] [Review][Patch] **Nhóm “Xem thêm” rỗng** — nếu `mergedChildren.length === 0` thì trả `[...primary, ...overflowGroups]`, không thêm nhóm tổng hợp rỗng [`desktop-nav-fr24.ts`].
- [x] [Review][Patch] **Id tổng hợp FR-24** — đổi sang `__storefront_fr24_overflow__` [`desktop-nav-fr24.ts`].
- [x] [Review][Patch] **Nhóm desktop không có mục con** — `MegaNav` lọc `groups.filter(g => g.children.length > 0)` trước khi render [`mega-nav/index.tsx`].
- [x] [Review][Defer] **Language/Region trong drawer vẫn `mouseEnter`/`mouseLeave`** — FR-25 (touch) chưa đầy đủ; pattern cũ từ trước 8.4 [`side-menu/index.tsx`] — deferred, có thể gom cùng refactor touch sau.

---

**Ghi chú hoàn thành workflow:** Ultimate context engine analysis completed — comprehensive developer guide created.
