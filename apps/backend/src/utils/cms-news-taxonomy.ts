import type StoreCmsModuleService from "../modules/store-cms/service"
import { CmsNewsValidationError } from "./cms-news"

export function parseUuidIdArray(
  raw: unknown,
  fieldLabel: string
): string[] | undefined {
  if (raw === undefined) {
    return undefined
  }
  if (raw === null) {
    return []
  }
  if (!Array.isArray(raw)) {
    throw new CmsNewsValidationError(`${fieldLabel} phải là mảng id`)
  }
  const out: string[] = []
  for (const x of raw) {
    const s = String(x ?? "").trim()
    if (s) {
      out.push(s)
    }
  }
  return [...new Set(out)]
}

/** subtree gồm root + mọi hậu duệ (theo parent_id). */
export function collectCategoryDescendantIds(
  categories: { id: string; parent_id: string | null }[],
  rootId: string
): Set<string> {
  const byParent = new Map<string | null, string[]>()
  for (const c of categories) {
    const p = c.parent_id ?? null
    if (!byParent.has(p)) {
      byParent.set(p, [])
    }
    byParent.get(p)!.push(c.id)
  }
  const out = new Set<string>([rootId])
  const stack = [rootId]
  while (stack.length) {
    const id = stack.pop()!
    const kids = byParent.get(id) ?? []
    for (const k of kids) {
      if (!out.has(k)) {
        out.add(k)
        stack.push(k)
      }
    }
  }
  return out
}

export async function listArticleIdsForCategorySubtree(
  cms: StoreCmsModuleService,
  categoryIds: Set<string>
): Promise<Set<string>> {
  if (categoryIds.size === 0) {
    return new Set()
  }
  const links = await cms.listStoreCmsNewsArticleCategories({})
  const articles = new Set<string>()
  for (const l of links) {
    if (categoryIds.has(l.category_id)) {
      articles.add(l.article_id)
    }
  }
  return articles
}

export async function listArticleIdsForTag(
  cms: StoreCmsModuleService,
  tagId: string
): Promise<Set<string>> {
  const links = await cms.listStoreCmsNewsArticleTags({ tag_id: tagId })
  return new Set(links.map((l) => l.article_id))
}

export async function getArticleCategoryIds(
  cms: StoreCmsModuleService,
  articleId: string
): Promise<string[]> {
  const rows = await cms.listStoreCmsNewsArticleCategories({
    article_id: articleId,
  })
  return rows.map((r) => r.category_id)
}

export async function getArticleTagIds(
  cms: StoreCmsModuleService,
  articleId: string
): Promise<string[]> {
  const rows = await cms.listStoreCmsNewsArticleTags({ article_id: articleId })
  return rows.map((r) => r.tag_id)
}

export async function replaceNewsArticleCategories(
  cms: StoreCmsModuleService,
  articleId: string,
  categoryIds: string[]
): Promise<void> {
  const existing = await cms.listStoreCmsNewsArticleCategories({
    article_id: articleId,
  })
  if (existing.length) {
    await cms.deleteStoreCmsNewsArticleCategories(existing.map((r) => r.id))
  }
  if (categoryIds.length === 0) {
    return
  }
  await cms.createStoreCmsNewsArticleCategories(
    categoryIds.map((category_id) => ({
      article_id: articleId,
      category_id,
    }))
  )
}

export async function assertCategoryAndTagIdsExist(
  cms: StoreCmsModuleService,
  categoryIds: string[],
  tagIds: string[]
): Promise<void> {
  if (categoryIds.length > 0) {
    const all = await cms.listStoreCmsNewsCategories({})
    const set = new Set(all.map((c) => c.id))
    for (const id of categoryIds) {
      if (!set.has(id)) {
        throw new CmsNewsValidationError(`Chủ đề không tồn tại: ${id}`)
      }
    }
  }
  if (tagIds.length > 0) {
    const all = await cms.listStoreCmsNewsTags({})
    const set = new Set(all.map((t) => t.id))
    for (const id of tagIds) {
      if (!set.has(id)) {
        throw new CmsNewsValidationError(`Nhãn không tồn tại: ${id}`)
      }
    }
  }
}

export async function replaceNewsArticleTags(
  cms: StoreCmsModuleService,
  articleId: string,
  tagIds: string[]
): Promise<void> {
  const existing = await cms.listStoreCmsNewsArticleTags({
    article_id: articleId,
  })
  if (existing.length) {
    await cms.deleteStoreCmsNewsArticleTags(existing.map((r) => r.id))
  }
  if (tagIds.length === 0) {
    return
  }
  await cms.createStoreCmsNewsArticleTags(
    tagIds.map((tag_id) => ({
      article_id: articleId,
      tag_id,
    }))
  )
}
