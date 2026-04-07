import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { IFileModuleService } from "@medusajs/types"
import { STORE_CMS_MODULE } from "../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../modules/store-cms/service"
import {
  mergeMediaLibraryIdOrder,
  parseSessionIdsQuery,
} from "../../../../utils/cms-media-library"

/** Giới hạn id từ query để tránh DoS (nhiều retrieveFile). Khớp tầm sessionStorage (~30) + dư định. */
const MAX_SESSION_IDS_FROM_QUERY = 48

/**
 * GET /admin/custom/cms-media-library?session_ids=id1,id2
 * Images referenced by CMS (settings + slides) + optional session-only ids; resolves url via File module.
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const fileModule = req.scope.resolve(Modules.FILE) as IFileModuleService

  const dbOrdered = await cms.listCmsReferencedImageFileIdsOrdered()
  const sessionIds = parseSessionIdsQuery(req.query?.session_ids).slice(
    0,
    MAX_SESSION_IDS_FROM_QUERY
  )
  const ordered = mergeMediaLibraryIdOrder(dbOrdered, sessionIds)

  const files: { id: string; url: string }[] = []
  for (const id of ordered) {
    try {
      const meta = await fileModule.retrieveFile(id)
      const url = typeof meta?.url === "string" ? meta.url : ""
      if (url) {
        files.push({ id, url })
      }
    } catch {
      // skip missing / invalid file
    }
  }

  res.json({ files })
}
