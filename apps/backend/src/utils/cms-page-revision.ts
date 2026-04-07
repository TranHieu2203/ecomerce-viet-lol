import type StoreCmsModuleService from "../modules/store-cms/service"
import { pruneStoreCmsRevisionsAfterAppend } from "./cms-revision"

type PageRow = {
  id: string
  slug: string
  title: unknown
  body: string | null
  seo: unknown
  status: string
  published_at: Date | string | null
}

export function buildPageRevisionSnapshot(page: PageRow): Record<string, unknown> {
  return {
    slug: page.slug,
    title: page.title,
    body: page.body,
    seo: page.seo,
    status: page.status,
    published_at:
      page.published_at instanceof Date
        ? page.published_at.toISOString()
        : page.published_at,
  }
}

export async function appendPageRevision(
  cms: StoreCmsModuleService,
  page: PageRow,
  actorUserId: string | null | undefined
): Promise<void> {
  await cms.createStoreCmsRevisions([
    {
      entity_type: "page",
      entity_id: page.id,
      payload_snapshot: buildPageRevisionSnapshot(page),
      actor_user_id: actorUserId ?? null,
    },
  ])
  await pruneStoreCmsRevisionsAfterAppend(cms, "page", page.id)
}

/** Map DB row → snapshot sau khi cập nhật logic publish. */
export function pageRowFromUpdate(
  id: string,
  slug: string,
  title: unknown,
  body: string | null,
  seo: unknown,
  status: string,
  published_at: Date | string | null
): PageRow {
  return { id, slug, title, body, seo, status, published_at }
}
