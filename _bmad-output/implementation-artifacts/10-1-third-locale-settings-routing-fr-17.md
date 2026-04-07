# Story 10.1: Locale thứ ba + routing (FR-17)

Status: done

## Summary

- Catalog locale cố định trong code: `vi`, `en`, `ja`. Admin bật/tắt `ja` (và `en`) qua `enabled_locales`; luôn giữ `vi`.
- Storefront: middleware đọc `/store/custom/cms-settings`, redirect locale nếu không enabled; nhãn UI `ja` dùng clone `en` tạm thời.
- Switcher + Side Menu dùng danh sách từ CMS.

## Files chính

- `apps/backend/src/utils/banner-i18n.ts` — `LOCALE_KEY_CATALOG`
- `apps/backend/src/api/admin/custom/cms-settings/route.ts` — validate catalog
- `apps/backend-storefront/src/lib/util/locales.ts`, `middleware.ts`, `middleware-cms-locales.ts`
- `apps/backend-storefront/src/modules/layout/.../locale-switcher`, `nav/index.tsx`
- `apps/backend-storefront/src/lib/i18n/storefront-messages.ts` — `ja`
