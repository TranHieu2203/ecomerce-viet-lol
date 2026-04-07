import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  CMS_SETTINGS_ID,
  STORE_CMS_MODULE,
} from "../../../../modules/store-cms"
import {
  CMS_REVISION_ENTITY_TYPES,
  type CmsRevisionEntityType,
} from "../../../../modules/store-cms/models/store-cms-revision"
import type StoreCmsModuleService from "../../../../modules/store-cms/service"

function isRevisionEntityType(s: string): s is CmsRevisionEntityType {
  return (CMS_REVISION_ENTITY_TYPES as readonly string[]).includes(s)
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const entityTypeRaw = req.query?.entity_type
  const entityIdRaw = req.query?.entity_id
  const entityType =
    typeof entityTypeRaw === "string" ? entityTypeRaw.trim() : ""
  const entityId =
    typeof entityIdRaw === "string" ? entityIdRaw.trim() : undefined

  if (!entityType || !isRevisionEntityType(entityType)) {
    return res.status(400).json({
      message:
        "Thiếu hoặc sai entity_type (settings | nav | page | banner)",
    })
  }

  if (entityType === "banner") {
    return res.status(400).json({
      message: "Chưa hỗ trợ liệt kê revision cho banner",
    })
  }

  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService

  if (entityType === "page") {
    if (!entityId) {
      return res.status(400).json({
        message: "Với entity_type=page bắt buộc có entity_id (id trang)",
      })
    }
    const rows = await cms.listStoreCmsRevisions(
      { entity_type: "page", entity_id: entityId },
      { order: { created_at: "DESC" } }
    )
    return res.json({
      revisions: rows.map((r) => ({
        id: r.id,
        created_at: r.created_at,
        entity_type: r.entity_type,
        entity_id: r.entity_id,
        payload_snapshot: r.payload_snapshot,
      })),
    })
  }

  if (entityType === "settings" || entityType === "nav") {
    if (entityId !== CMS_SETTINGS_ID) {
      return res.status(400).json({
        message: `Với entity_type=${entityType} bắt buộc entity_id=${CMS_SETTINGS_ID}`,
      })
    }
    const all = await cms.listStoreCmsRevisions(
      { entity_type: entityType },
      { order: { created_at: "DESC" } }
    )
    const rows = all.filter(
      (r) => r.entity_id == null || r.entity_id === CMS_SETTINGS_ID
    )
    return res.json({
      revisions: rows.map((r) => ({
        id: r.id,
        created_at: r.created_at,
        entity_type: r.entity_type,
        entity_id: r.entity_id,
        payload_snapshot: r.payload_snapshot,
      })),
    })
  }

  return res.status(400).json({ message: "entity_type không hợp lệ" })
}
