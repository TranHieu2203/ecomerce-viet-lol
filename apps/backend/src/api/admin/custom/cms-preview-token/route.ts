import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { STORE_CMS_MODULE } from "../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../modules/store-cms/service"
import { signCmsPreviewToken } from "../../../../utils/cms-preview-token"

const DEFAULT_TTL_SEC = 30 * 60

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const secret = process.env.CMS_PREVIEW_SECRET?.trim()
  if (!secret) {
    return res.status(503).json({
      message:
        "CMS_PREVIEW_SECRET chưa cấu hình; không thể tạo token xem trước",
    })
  }

  const body = (req.body ?? {}) as Record<string, unknown>
  const page_id =
    typeof body.page_id === "string"
      ? body.page_id.trim()
      : typeof body.pageId === "string"
        ? body.pageId.trim()
        : ""
  if (!page_id) {
    return res.status(400).json({ message: "page_id là bắt buộc" })
  }

  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const page = await cms
    .listStoreCmsPages({ id: page_id })
    .then((rows) => rows[0])
  if (!page) {
    return res.status(404).json({ message: "Không tìm thấy trang" })
  }

  const slugOpt =
    body.slug !== undefined && body.slug !== null
      ? String(body.slug).trim()
      : ""
  if (slugOpt && slugOpt !== page.slug) {
    return res.status(400).json({
      message: "slug không khớp với trang được chọn",
    })
  }

  const ttlRaw = Number(body.ttl_seconds ?? body.ttlSeconds)
  const ttlSec =
    Number.isFinite(ttlRaw) && ttlRaw > 0
      ? Math.min(3600, Math.floor(ttlRaw))
      : DEFAULT_TTL_SEC
  const exp = Math.floor(Date.now() / 1000) + ttlSec

  const token = signCmsPreviewToken(
    { pageId: page.id, slug: page.slug, exp },
    secret
  )
  const expires_at = new Date(exp * 1000).toISOString()

  res.status(201).json({ token, expires_at })
}
