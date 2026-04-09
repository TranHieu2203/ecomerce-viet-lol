import type StoreCmsModuleService from "../modules/store-cms/service"
import { pruneStoreCmsRevisionsAfterAppend } from "./cms-revision"
import { getArticleCategoryIds, getArticleTagIds } from "./cms-news-taxonomy"

type NewsRow = {
  id: string
  slug: string
  title_i18n: unknown
  excerpt_i18n: unknown
  body_html_i18n: unknown
  featured_image_file_id: string | null
  seo: unknown
  status: string
  published_at: Date | string | null
}

export function buildNewsRevisionSnapshot(
  article: NewsRow,
  taxonomy?: { category_ids: string[]; tag_ids: string[] }
): Record<string, unknown> {
  const snap: Record<string, unknown> = {
    slug: article.slug,
    title_i18n: article.title_i18n,
    excerpt_i18n: article.excerpt_i18n,
    body_html_i18n: article.body_html_i18n,
    featured_image_file_id: article.featured_image_file_id,
    seo: article.seo,
    status: article.status,
    published_at:
      article.published_at instanceof Date
        ? article.published_at.toISOString()
        : article.published_at,
  }
  if (taxonomy) {
    snap.category_ids = taxonomy.category_ids
    snap.tag_ids = taxonomy.tag_ids
  }
  return snap
}

export async function appendNewsRevision(
  cms: StoreCmsModuleService,
  article: NewsRow,
  actorUserId: string | null | undefined,
  taxonomy?: { category_ids: string[]; tag_ids: string[] }
): Promise<void> {
  await cms.createStoreCmsRevisions([
    {
      entity_type: "news_article",
      entity_id: article.id,
      payload_snapshot: buildNewsRevisionSnapshot(article, taxonomy),
      actor_user_id: actorUserId ?? null,
    },
  ])
  await pruneStoreCmsRevisionsAfterAppend(cms, "news_article", article.id)
}

export async function appendNewsRevisionWithTaxonomy(
  cms: StoreCmsModuleService,
  article: NewsRow,
  actorUserId: string | null | undefined
): Promise<void> {
  const [category_ids, tag_ids] = await Promise.all([
    getArticleCategoryIds(cms, article.id),
    getArticleTagIds(cms, article.id),
  ])
  await appendNewsRevision(cms, article, actorUserId, { category_ids, tag_ids })
}

export function newsRowFromUpdate(
  id: string,
  slug: string,
  title_i18n: unknown,
  excerpt_i18n: unknown,
  body_html_i18n: unknown,
  featured_image_file_id: string | null,
  seo: unknown,
  status: string,
  published_at: Date | string | null
): NewsRow {
  return {
    id,
    slug,
    title_i18n,
    excerpt_i18n,
    body_html_i18n,
    featured_image_file_id,
    seo,
    status,
    published_at,
  }
}
