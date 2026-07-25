import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { STORE_CMS_MODULE } from "../../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../../modules/store-cms/service"

const clamp = (v: unknown, min: number, max: number) => {
  const n = Number(v)
  if (!Number.isFinite(n)) {
    return null
  }
  return Math.min(max, Math.max(min, Math.round(n)))
}

/**
 * Cập nhật một nền. Gửi `is_active: true` để bật nền này (các nền khác tự
 * tắt); gửi `is_active: false` để tắt hết, web trở lại nền trắng.
 */
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const { id } = req.params
  const body = (req.body ?? {}) as Record<string, unknown>

  const [existing] = await cms.listStoreBackgrounds({ id })
  if (!existing) {
    return res.status(404).json({ message: "Không tìm thấy nền này" })
  }

  if (typeof body.is_active === "boolean") {
    await cms.activateBackgroundExclusively(body.is_active ? id : null)
  }

  const update: Record<string, unknown> = { id }
  if (typeof body.name === "string" && body.name.trim()) {
    update.name = body.name.trim()
  }
  const opacity = clamp(body.opacity, 0, 100)
  if (opacity !== null) {
    update.opacity = opacity
  }
  const saturate = clamp(body.saturate, 0, 200)
  if (saturate !== null) {
    update.saturate = saturate
  }
  const sortOrder = clamp(body.sort_order, 0, 9999)
  if (sortOrder !== null) {
    update.sort_order = sortOrder
  }
  if (typeof body.base_color === "string" && body.base_color.trim()) {
    update.base_color = body.base_color.trim()
  }
  if (typeof body.theme === "string" && body.theme.trim()) {
    update.theme = body.theme.trim()
  }

  if (Object.keys(update).length > 1) {
    await cms.updateStoreBackgrounds([update as never])
  }

  const [fresh] = await cms.listStoreBackgrounds({ id })
  res.json({ background: fresh })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const { id } = req.params

  const [existing] = await cms.listStoreBackgrounds({ id })
  if (!existing) {
    return res.status(404).json({ message: "Không tìm thấy nền này" })
  }

  // Xoá được cả nền dựng sẵn — bộ nền khá nhiều nên cần dọn cho gọn. Chạy lại
  // script seed-backgrounds là các nền dựng sẵn quay về đầy đủ.
  await cms.deleteStoreBackgrounds([id])
  res.json({ id, deleted: true })
}
