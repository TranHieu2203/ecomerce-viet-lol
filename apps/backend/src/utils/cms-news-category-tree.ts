import type StoreCmsModuleService from "../modules/store-cms/service"
import { CmsNewsValidationError } from "./cms-news"

type CatRow = { id: string; parent_id: string | null }

/** Không gán parent là chính nó hoặc hậu duệ (tránh vòng lặp). */
export function assertValidCategoryParentAssignment(
  all: CatRow[],
  categoryId: string | null,
  newParentId: string | null
): void {
  if (newParentId === null || newParentId === "") {
    return
  }
  if (categoryId !== null && newParentId === categoryId) {
    throw new CmsNewsValidationError("Chủ đề cha không được trùng chính bản thân")
  }
  const byId = new Map(all.map((c) => [c.id, c]))
  if (!byId.has(newParentId)) {
    throw new CmsNewsValidationError("Chủ đề cha không tồn tại")
  }
  if (categoryId === null) {
    return
  }
  let cur: string | null = newParentId
  const seen = new Set<string>()
  while (cur) {
    if (cur === categoryId) {
      throw new CmsNewsValidationError(
        "Không thể đặt cha là con của chính chủ đề này (vòng lặp)"
      )
    }
    if (seen.has(cur)) {
      break
    }
    seen.add(cur)
    cur = byId.get(cur)?.parent_id ?? null
  }
}

export async function listChildCategoryIds(
  cms: StoreCmsModuleService,
  parentId: string
): Promise<string[]> {
  const rows = await cms.listStoreCmsNewsCategories({ parent_id: parentId })
  return rows.map((r) => r.id)
}
