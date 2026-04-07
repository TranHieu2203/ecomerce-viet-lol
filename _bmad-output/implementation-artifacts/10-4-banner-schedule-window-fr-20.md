# Story 10.4: Lịch hiển thị banner (FR-20)

Status: done

## Summary

- Cột `display_start_at`, `display_end_at` (timestamptz UTC) trên `store_banner_slide`.
- Store filter theo `now`; Admin hiển thị nhãn ISO gọn trên list slide (có thể mở rộng datetime-local sau).

## Files

- `utils/banner-store-public.ts` (`withinWindow`)
- Model + migration, admin list (read-only display schedule)
