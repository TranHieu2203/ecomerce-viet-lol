import { validateTargetUrl } from "./validate-target-url"

/** Nhãn song ngữ cho nhóm / link; có thể chỉ điền một locale. */
export type NavLocaleLabel = { vi?: string; en?: string }

export type NavTreeCollectionChild = {
  type: "collection"
  handle: string
  label_override?: NavLocaleLabel | null
}

export type NavTreeLinkChild = {
  type: "link"
  url: string
  label: NavLocaleLabel
}

export type NavTreeGroup = {
  id: string
  label: NavLocaleLabel
  children: (NavTreeCollectionChild | NavTreeLinkChild)[]
}

export type NavTree = {
  version: number
  items: NavTreeGroup[]
}

export const EMPTY_NAV_TREE: NavTree = { version: 1, items: [] }

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function parseLocaleLabel(raw: unknown, ctx: string): NavLocaleLabel {
  if (raw === undefined || raw === null) {
    return {}
  }
  if (!isPlainObject(raw)) {
    throw new Error(`${ctx}: label phải là object`)
  }
  const out: NavLocaleLabel = {}
  if (typeof raw.vi === "string") {
    out.vi = raw.vi
  }
  if (typeof raw.en === "string") {
    out.en = raw.en
  }
  return out
}

function parseChild(raw: unknown, ctx: string): NavTreeCollectionChild | NavTreeLinkChild {
  if (!isPlainObject(raw)) {
    throw new Error(`${ctx}: mục con không hợp lệ`)
  }
  const type = raw.type
  if (type === "collection") {
    const handle =
      typeof raw.handle === "string" ? raw.handle.trim() : ""
    if (!handle) {
      throw new Error(`${ctx}: collection cần handle`)
    }
    let label_override: NavLocaleLabel | null = null
    if (raw.label_override !== undefined && raw.label_override !== null) {
      label_override = parseLocaleLabel(raw.label_override, `${ctx}.label_override`)
    }
    return { type: "collection", handle, label_override }
  }
  if (type === "link") {
    const urlRaw = typeof raw.url === "string" ? raw.url.trim() : ""
    if (!urlRaw) {
      throw new Error(`${ctx}: link cần url`)
    }
    const { value: url } = validateTargetUrl(urlRaw)
    if (!url) {
      throw new Error(`${ctx}: url không hợp lệ`)
    }
    const label = parseLocaleLabel(raw.label, `${ctx}.label`)
    return { type: "link", url, label }
  }
  throw new Error(`${ctx}: type phải là collection hoặc link`)
}

/**
 * Chuẩn hoá + validate cây menu (tối đa 2 cấp). Lỗi ném Error — route map sang tiếng Việt.
 */
export function validateAndNormalizeNavTree(input: unknown): NavTree {
  if (input === undefined || input === null) {
    return { ...EMPTY_NAV_TREE }
  }
  if (!isPlainObject(input)) {
    throw new Error("nav_tree phải là object hoặc null")
  }
  const version =
    typeof input.version === "number" && Number.isFinite(input.version)
      ? input.version
      : 1
  if (!Array.isArray(input.items)) {
    throw new Error("nav_tree.items phải là mảng")
  }
  const items: NavTreeGroup[] = []
  for (let i = 0; i < input.items.length; i++) {
    const raw = input.items[i]
    const ctx = `items[${i}]`
    if (!isPlainObject(raw)) {
      throw new Error(`${ctx}: nhóm không hợp lệ`)
    }
    const id = typeof raw.id === "string" ? raw.id.trim() : ""
    if (!id) {
      throw new Error(`${ctx}: cần id`)
    }
    if (raw.children !== undefined && !Array.isArray(raw.children)) {
      throw new Error(`${ctx}.children phải là mảng`)
    }
    const childrenRaw = Array.isArray(raw.children) ? raw.children : []
    const label = parseLocaleLabel(raw.label, `${ctx}.label`)
    const children: (NavTreeCollectionChild | NavTreeLinkChild)[] = []
    for (let j = 0; j < childrenRaw.length; j++) {
      children.push(parseChild(childrenRaw[j], `${ctx}.children[${j}]`))
    }
    items.push({ id, label, children })
  }
  return { version, items }
}

/** Gom handle collection duy nhất (theo thứ tự duyệt). */
export function collectCollectionHandles(tree: NavTree): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const g of tree.items) {
    for (const c of g.children) {
      if (c.type === "collection" && !seen.has(c.handle)) {
        seen.add(c.handle)
        out.push(c.handle)
      }
    }
  }
  return out
}
