import type {
  NavLocaleLabel,
  NavTree,
  NavTreeCollectionChild,
  NavTreeGroup,
  NavTreeLinkChild,
} from "../../../utils/nav-tree"

export type EditorChildRow = {
  key: string
  child: NavTreeCollectionChild | NavTreeLinkChild
}

export type EditorGroupRow = {
  id: string
  label: NavLocaleLabel
  children: EditorChildRow[]
}

function newKey(): string {
  return crypto.randomUUID()
}

function cloneChild(
  c: NavTreeCollectionChild | NavTreeLinkChild
): NavTreeCollectionChild | NavTreeLinkChild {
  if (c.type === "collection") {
    const lo = c.label_override
    let label_override: NavLocaleLabel | null = null
    if (lo != null) {
      const merged = { ...lo }
      const hasAny = [merged.vi, merged.en].some(
        (x) => x != null && String(x).trim() !== ""
      )
      label_override = hasAny ? merged : null
    }
    return {
      type: "collection",
      handle: c.handle,
      label_override,
    }
  }
  return {
    type: "link",
    url: c.url,
    label: { ...c.label },
  }
}

/** Chuẩn bị state editor từ `NavTree` trả về GET cms-nav. */
export function navTreeToEditor(tree: NavTree): {
  version: number
  groups: EditorGroupRow[]
} {
  return {
    version: tree.version,
    groups: tree.items.map(
      (g: NavTreeGroup): EditorGroupRow => ({
        id: g.id,
        label: { ...g.label },
        children: g.children.map((c) => ({
          key: newKey(),
          child: cloneChild(c),
        })),
      })
    ),
  }
}

/** Gom lại payload PATCH (không gửi key nội bộ). */
export function editorToNavTree(
  version: number,
  groups: EditorGroupRow[]
): NavTree {
  return {
    version,
    items: groups.map((g) => ({
      id: g.id,
      label: { ...g.label },
      children: g.children.map((row) => cloneChild(row.child)),
    })),
  }
}

export const GROUP_SORT_PREFIX = "nav-grp-"
export const CHILD_SORT_PREFIX = "nav-chd-"

export function groupSortableId(groupId: string): string {
  return `${GROUP_SORT_PREFIX}${groupId}`
}

export function childSortableId(groupId: string, rowKey: string): string {
  return `${CHILD_SORT_PREFIX}${groupId}__${rowKey}`
}

export type ParsedDragId =
  | { kind: "group"; groupId: string }
  | { kind: "child"; groupId: string; rowKey: string }

export function parseNavEditorDragId(id: string): ParsedDragId | null {
  if (id.startsWith(GROUP_SORT_PREFIX)) {
    return { kind: "group", groupId: id.slice(GROUP_SORT_PREFIX.length) }
  }
  if (id.startsWith(CHILD_SORT_PREFIX)) {
    const rest = id.slice(CHILD_SORT_PREFIX.length)
    const sep = "__"
    const i = rest.indexOf(sep)
    if (i < 0) {
      return null
    }
    return {
      kind: "child",
      groupId: rest.slice(0, i),
      rowKey: rest.slice(i + sep.length),
    }
  }
  return null
}
