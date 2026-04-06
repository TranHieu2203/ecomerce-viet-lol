import type { ResolvedNavChild, ResolvedNavGroup } from "@lib/nav/nav-types"

/**
 * FR-24 (PRD): thanh nav desktop cần quy tắc rõ ràng — không được “cắt im lặng” N mục.
 *
 * Cách làm: giới hạn số **nhóm cấp 1** hiển thị dạng trigger riêng; phần nhóm vượt ngưỡng
 * gom vào một nhóm cuối có nhãn i18n “Xem thêm”, `children` = gộp phẳng mọi mục con
 * của các nhóm bị ẩn (thứ tự giữ nguyên).
 */
export const MAX_DESKTOP_TOP_LEVEL_GROUPS = 6

/** Id tổng hợp storefront — tránh trùng id nhóm do Admin nhập tay. */
export const FR24_OVERFLOW_GROUP_ID = "__storefront_fr24_overflow__"

export function applyDesktopNavFr24(
  items: ResolvedNavGroup[],
  moreLabel: string,
  maxTopLevel: number = MAX_DESKTOP_TOP_LEVEL_GROUPS
): ResolvedNavGroup[] {
  if (items.length <= maxTopLevel) {
    return items
  }

  const visibleCount = maxTopLevel - 1
  const primary = items.slice(0, visibleCount)
  const overflowGroups = items.slice(visibleCount)

  const mergedChildren: ResolvedNavChild[] = []
  for (const g of overflowGroups) {
    for (const c of g.children) {
      mergedChildren.push(c)
    }
  }

  if (mergedChildren.length === 0) {
    return [...primary, ...overflowGroups]
  }

  return [
    ...primary,
    {
      id: FR24_OVERFLOW_GROUP_ID,
      label: moreLabel,
      children: mergedChildren,
    },
  ]
}
