import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { IFileModuleService } from "@medusajs/types"
import { STORE_CMS_MODULE } from "../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../modules/store-cms/service"

export const AUTHENTICATE = false

/** Nền website đang bật. Trả `background: null` khi shop để nền trắng. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const active = await cms.getActiveBackground()

  if (!active) {
    return res.json({ background: null })
  }

  let image_url = active.image_url ?? null
  if (!image_url && active.image_file_id) {
    try {
      const fileModule = req.scope.resolve(Modules.FILE) as IFileModuleService
      const f = await fileModule.retrieveFile(active.image_file_id)
      image_url = f.url
    } catch {
      image_url = null
    }
  }

  // Không có ảnh thì coi như không có nền — tránh render một lớp phủ rỗng.
  if (!image_url) {
    return res.json({ background: null })
  }

  res.json({
    background: {
      id: active.id,
      name: active.name,
      image_url,
      opacity: active.opacity,
      saturate: active.saturate,
      base_color: active.base_color,
    },
  })
}
