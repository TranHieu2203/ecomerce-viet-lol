# Story 10.2: Banner draft/publish + audit (FR-18, NFR-6)

Status: done

## Summary

- `store_banner_slide.publication_status`: `draft` | `published` (mặc định DB `published` cho dữ liệu cũ). Slide mới tạo = `draft`.
- Store API chỉ trả `published` + active + lịch + A/B.
- Bảng `store_cms_publication_audit` ghi `publish` (actor, entity, metadata tối thiểu).

## Files

- Migration `Migration20260407140000.ts`, model `store-cms-publication-audit.ts`, `store-banner-slide.ts`
- `utils/cms-publication-audit.ts`, `api/store/custom/banner-slides/route.ts`, admin banner routes
