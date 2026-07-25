import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { IFileModuleService } from "@medusajs/types"
import { STORE_CMS_MODULE } from "../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../modules/store-cms/service"

/** Ghép URL ảnh cho từng nền để Admin xem trước được ngay. */
async function withImageUrls(
  req: AuthenticatedMedusaRequest,
  rows: {
    id: string
    image_url: string | null
    image_file_id: string | null
    [k: string]: unknown
  }[]
) {
  const needsFile = rows.filter((r) => !r.image_url && r.image_file_id)
  const urlByFileId = new Map<string, string>()

  if (needsFile.length) {
    const fileModule = req.scope.resolve(Modules.FILE) as IFileModuleService
    await Promise.all(
      needsFile.map(async (r) => {
        try {
          const f = await fileModule.retrieveFile(r.image_file_id as string)
          urlByFileId.set(r.image_file_id as string, f.url)
        } catch {
          /* ảnh đã bị xoá khỏi thư viện — bỏ qua, Admin sẽ thấy ô trống */
        }
      })
    )
  }

  return rows.map((r) => ({
    ...r,
    resolved_image_url:
      r.image_url ??
      (r.image_file_id ? urlByFileId.get(r.image_file_id) ?? null : null),
  }))
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const rows = await cms.listStoreBackgrounds(
    {},
    { order: { sort_order: "ASC" } }
  )
  res.json({ backgrounds: await withImageUrls(req, rows as never) })
}

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const body = (req.body ?? {}) as Record<string, unknown>

  const name = String(body.name ?? "").trim()
  const image_url = body.image_url ? String(body.image_url).trim() : null
  const image_file_id = body.image_file_id
    ? String(body.image_file_id).trim()
    : null

  if (!name) {
    return res.status(400).json({ message: "Cần nhập tên nền" })
  }
  if (!image_url && !image_file_id) {
    return res
      .status(400)
      .json({ message: "Cần chọn ảnh hoặc nhập đường dẫn ảnh" })
  }

  const clamp = (v: unknown, min: number, max: number, fallback: number) => {
    const n = Number(v)
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback
  }

  const [created] = await cms.createStoreBackgrounds([
    {
      name,
      theme:
        typeof body.theme === "string" && body.theme.trim()
          ? body.theme.trim()
          : "khac",
      image_url,
      image_file_id,
      opacity: clamp(body.opacity, 0, 100, 30),
      saturate: clamp(body.saturate, 0, 200, 100),
      base_color:
        typeof body.base_color === "string" && body.base_color.trim()
          ? body.base_color.trim()
          : "#FAF7F2",
      sort_order: clamp(body.sort_order, 0, 9999, 100),
      is_active: false,
      is_preset: false,
    },
  ])

  res.status(201).json({ background: created })
}
