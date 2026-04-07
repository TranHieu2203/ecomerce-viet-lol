import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { STORE_CMS_MODULE } from "../../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../../modules/store-cms/service"
import { executeCmsRevisionRestore } from "../../../../../utils/cms-revision-restore"

function actorUserId(
  req: AuthenticatedMedusaRequest
): string | null {
  return req.auth_context?.actor_id ?? null
}

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const body = (req.body ?? {}) as Record<string, unknown>
  const revisionId =
    typeof body.revision_id === "string" ? body.revision_id.trim() : ""
  if (!revisionId) {
    return res.status(400).json({ message: "Thiếu revision_id" })
  }

  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const result = await executeCmsRevisionRestore(
    req,
    cms,
    revisionId,
    actorUserId(req)
  )

  if (!result.ok) {
    return res.status(result.status).json({ message: result.message })
  }

  res.json({ ok: true })
}
