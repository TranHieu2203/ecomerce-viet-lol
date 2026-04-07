# Story 10.3: RBAC draft vs publish (FR-19)

Status: done

## Summary

- Biến môi trường `CMS_PUBLISHER_ADMIN_IDS` (comma-separated Medusa admin user ids). Khi set: chỉ user trong danh sách được gọi publish (POST published hoặc PATCH → published).
- Không set: mọi admin publish được (tương thích ngược).

## Files

- `apps/backend/src/utils/cms-publisher-guard.ts`
- `apps/backend/src/api/admin/custom/banner-slides/route.ts` và `[id]/route.ts`
- `apps/backend/.env.template`
