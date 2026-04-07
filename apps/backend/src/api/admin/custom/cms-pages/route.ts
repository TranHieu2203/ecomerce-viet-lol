import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { STORE_CMS_MODULE } from "../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../modules/store-cms/service"
import { CMS_PAGE_STATUS } from "../../../../modules/store-cms/models/store-cms-page"
import { buildPageRevisionSnapshot } from "../../../../utils/cms-page-revision"
import { pruneStoreCmsRevisionsAfterAppend } from "../../../../utils/cms-revision"
import {
  assertValidCmsPageSlug,
  CmsPageValidationError,
  parseAndValidatePageSeoJson,
  parseAndValidateTitleJson,
  sanitizeCmsPageBody,
} from "../../../../utils/cms-page"

function actorUserId(
  req: AuthenticatedMedusaRequest
): string | null {
  return req.auth_context?.actor_id ?? null
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const limitRaw = Number(req.query?.limit ?? 100)
  const offsetRaw = Number(req.query?.offset ?? 0)
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(100, Math.floor(limitRaw)) : 100
  const offset =
    Number.isFinite(offsetRaw) && offsetRaw >= 0 ? Math.floor(offsetRaw) : 0

  const [rows, count] = await cms.listAndCountStoreCmsPages(
    {},
    {
      take: limit,
      skip: offset,
      order: { updated_at: "DESC" },
    }
  )

  const cms_pages = rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    status: p.status,
    updated_at: p.updated_at,
    title: p.title,
  }))

  res.json({ cms_pages, count, limit, offset })
}

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const body = (req.body ?? {}) as Record<string, unknown>

  let slug: string
  let title: ReturnType<typeof parseAndValidateTitleJson>
  try {
    slug = assertValidCmsPageSlug(body.slug)
    title = parseAndValidateTitleJson(body.title)
  } catch (e: unknown) {
    if (e instanceof CmsPageValidationError) {
      return res.status(e.status).json({ message: e.message })
    }
    throw e
  }

  const existing = await cms.listStoreCmsPages({ slug })
  if (existing.length > 0) {
    return res.status(409).json({
      message: "Slug đã tồn tại; vui lòng chọn slug khác",
    })
  }

  const rawBody = body.body
  const bodyText =
    rawBody === undefined || rawBody === null
      ? null
      : sanitizeCmsPageBody(String(rawBody))

  let seo: Record<string, unknown> | null = null
  if (body.seo !== undefined) {
    try {
      const p = parseAndValidatePageSeoJson(body.seo)
      seo =
        p && Object.keys(p as object).length > 0
          ? (p as Record<string, unknown>)
          : null
    } catch (e: unknown) {
      if (e instanceof CmsPageValidationError) {
        return res.status(e.status).json({ message: e.message })
      }
      throw e
    }
  }

  try {
    const [created] = await cms.createStoreCmsPages([
      {
        slug,
        title,
        body: bodyText,
        seo,
        status: CMS_PAGE_STATUS.DRAFT,
        published_at: null,
      },
    ])

    const snap = buildPageRevisionSnapshot({
      id: created.id,
      slug: created.slug,
      title: created.title,
      body: created.body,
      seo: created.seo,
      status: created.status,
      published_at: created.published_at,
    })
    await cms.createStoreCmsRevisions([
      {
        entity_type: "page",
        entity_id: created.id,
        payload_snapshot: snap,
        actor_user_id: actorUserId(req),
      },
    ])
    await pruneStoreCmsRevisionsAfterAppend(cms, "page", created.id)

    res.status(201).json({ cms_page: created })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes("unique") || msg.includes("IDX_store_cms_page_slug")) {
      return res.status(409).json({
        message: "Slug đã tồn tại; vui lòng chọn slug khác",
      })
    }
    throw e
  }
}
