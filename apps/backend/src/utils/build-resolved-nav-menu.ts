import {
  resolveI18nTitleDescription,
  type I18nBlock,
} from "./resolve-i18n"
import {
  collectCollectionHandles,
  type NavTree,
  type NavTreeCollectionChild,
  type NavTreeGroup,
  type NavTreeLinkChild,
} from "./nav-tree"

export type ResolvedNavChild =
  | { type: "collection"; handle: string; label: string; href: string }
  | { type: "link"; label: string; href: string }

export type ResolvedNavGroup = {
  id: string
  label: string
  children: ResolvedNavChild[]
}

type Query = {
  graph: (args: {
    entity: string
    fields: string[]
    filters: Record<string, unknown>
  }) => Promise<{ data?: unknown[] }>
}

type CollectionRow = {
  handle?: string
  title?: string
  metadata?: Record<string, unknown> | null
}

/** Chọn chuỗi hiển thị theo locale, fallback vi → en. */
export function pickLocaleString(
  label: { vi?: string; en?: string },
  locale: string
): string {
  const primary =
    typeof label[locale as "vi" | "en"] === "string"
      ? label[locale as "vi" | "en"]!.trim()
      : ""
  if (primary) {
    return primary
  }
  const vi = typeof label.vi === "string" ? label.vi.trim() : ""
  if (vi) {
    return vi
  }
  const en = typeof label.en === "string" ? label.en.trim() : ""
  return en
}

function pickOverrideLabel(
  o: NavTreeCollectionChild["label_override"],
  locale: string
): string | null {
  if (o == null || typeof o !== "object") {
    return null
  }
  const v = pickLocaleString(o, locale)
  return v.length ? v : null
}

export async function loadCollectionsByHandles(
  query: Query,
  handles: string[]
): Promise<Map<string, CollectionRow>> {
  const map = new Map<string, CollectionRow>()
  for (const handle of handles) {
    const { data } = await query.graph({
      entity: "product_collection",
      fields: ["id", "handle", "title", "metadata"],
      filters: { handle },
    })
    const row = data?.[0] as CollectionRow | undefined
    if (row?.handle) {
      map.set(row.handle, row)
    }
  }
  return map
}

export async function buildResolvedNavMenu(
  query: unknown,
  navTree: NavTree | null | undefined,
  locale: string
): Promise<{ locale: string; items: ResolvedNavGroup[] }> {
  const q = query as Query
  if (!navTree?.items?.length) {
    return { locale, items: [] }
  }

  const handles = collectCollectionHandles(navTree)
  const byHandle = await loadCollectionsByHandles(q, handles)

  const resolveChild = (
    c: NavTreeCollectionChild | NavTreeLinkChild
  ): ResolvedNavChild => {
    if (c.type === "link") {
      return {
        type: "link",
        label: pickLocaleString(c.label, locale),
        href: c.url,
      }
    }
    const override = pickOverrideLabel(c.label_override, locale)
    const col = byHandle.get(c.handle)
    const baseTitle = typeof col?.title === "string" ? col.title : c.handle
    const i18n = col?.metadata?.i18n as I18nBlock | undefined
    const resolved = resolveI18nTitleDescription(
      i18n,
      locale,
      baseTitle,
      null
    )
    const label = override ?? resolved.title
    return {
      type: "collection",
      handle: c.handle,
      label,
      href: `/collections/${c.handle}`,
    }
  }

  const items: ResolvedNavGroup[] = navTree.items.map((g: NavTreeGroup) => ({
    id: g.id,
    label: pickLocaleString(g.label, locale),
    children: g.children.map(resolveChild),
  }))

  return { locale, items }
}

/** Trả về danh sách handle collection có trong tree nhưng không tồn tại trong DB. */
export async function findMissingCollectionHandles(
  query: unknown,
  tree: NavTree
): Promise<string[]> {
  const handles = collectCollectionHandles(tree)
  if (!handles.length) {
    return []
  }
  const map = await loadCollectionsByHandles(query as Query, handles)
  return handles.filter((h) => !map.has(h))
}
