# Story 10.5: A/B banner MVP (FR-21)

Status: done

## Summary

- Bảng `store_banner_campaign`: `name`, `split_a_percent`, `is_active`. Chỉ một campaign active (POST/PATCH deactivate others).
- Slide: `campaign_id`, `variant_label` (`A`|`B`). Store chọn variant cố định theo hash(`visitor_id`, `campaign_id`); `visitor_id` từ cookie `_medusa_cache_id` / query.

## Files

- `models/store-banner-campaign.ts`, admin `banner-campaigns/*`, `utils/banner-store-public.ts`
- Storefront `listBannerSlides` gửi `visitor_id` + header `x-medusa-cache-id`
