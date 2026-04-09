import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { STORE_CMS_MODULE } from "../../../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../../../modules/store-cms/service"
import { CMS_NEWS_STATUS } from "../../../../../../modules/store-cms/models/store-cms-news-article"
import {
  appendNewsRevisionWithTaxonomy,
  newsRowFromUpdate,
} from "../../../../../../utils/cms-news-revision"
import { revalidateStorefrontCms } from "../../../../../../utils/revalidate-storefront"

function actorUserId(
  req: AuthenticatedMedusaRequest
): string | null {
  return req.auth_context?.actor_id ?? null
}

export async function POST(
  req: AuthenticatedMedusaRequest<{ id: string }>,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const existing = await cms
    .listStoreCmsNewsArticles({ id: req.params.id })
    .then((rows) => rows[0])
  if (!existing) {
    return res.status(404).json({ message: "Không tìm thấy bài tin" })
  }

  const updateResult = await cms.updateStoreCmsNewsArticles([
    {
      id: req.params.id,
      status: CMS_NEWS_STATUS.DRAFT,
      published_at: null,
    },
  ])
  const updated = Array.isArray(updateResult) ? updateResult[0] : updateResult

  await appendNewsRevisionWithTaxonomy(
    cms,
    newsRowFromUpdate(
      updated.id,
      updated.slug,
      updated.title_i18n,
      updated.excerpt_i18n,
      updated.body_html_i18n,
      updated.featured_image_file_id ?? null,
      updated.seo,
      updated.status,
      updated.published_at
    ),
    actorUserId(req)
  )

  await revalidateStorefrontCms("cms-news")
  res.json({ cms_news_article: updated })
}
