import {
  DndContext,
  type CollisionDetection,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type DragCancelEvent,
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button, Heading, Input, Label, Text, toast } from "@medusajs/ui"
import {
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FolderKanban,
  Link2,
  Plus,
  Save,
  Trash2,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CmsCollapsibleSection } from "../../components/cms-collapsible-section"
import { adminFetch } from "./admin-fetch"
import { CmsRevisionDrawer } from "./revision-drawer"
import {
  type EditorChildRow,
  type EditorGroupRow,
  childSortableId,
  editorToNavTree,
  groupSortableId,
  navTreeToEditor,
  parseNavEditorDragId,
} from "./nav-editor-model"
import type {
  NavTree,
  NavTreeCollectionChild,
  NavTreeLinkChild,
} from "../../../utils/nav-tree"

type Lang = "vi" | "en"

type AdminCollectionRow = { id?: string; handle?: string; title?: string }

const COLLECTION_DATALIST_ID = "cms-nav-collection-hits"

function emptyCollectionChild(): NavTreeCollectionChild {
  return { type: "collection", handle: "", label_override: null }
}

function emptyLinkChild(): NavTreeLinkChild {
  return { type: "link", url: "", label: {} }
}

function BadgeMini({ children }: { children: string }) {
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded bg-ui-bg-base border border-ui-border-base">
      {children}
    </span>
  )
}

function SortableGrip(props: {
  attributes: DraggableAttributes
  listeners: DraggableSyntheticListeners
}) {
  return (
    <button
      type="button"
      className="cursor-grab active:cursor-grabbing touch-none shrink-0 min-h-9 min-w-9 inline-flex items-center justify-center text-ui-fg-muted rounded-md border border-dashed border-ui-border-strong hover:bg-ui-bg-subtle hover:border-ui-border-interactive"
      aria-label="Kéo để sắp xếp"
      {...props.attributes}
      {...props.listeners}
    >
      ⠿
    </button>
  )
}

function SortableGroupCard({
  group,
  lang,
  onChangeGroup,
  onRemoveGroup,
  onAddChild,
  onChangeChild,
  onRemoveChild,
}: {
  group: EditorGroupRow
  lang: Lang
  onChangeGroup: (g: EditorGroupRow) => void
  onRemoveGroup: () => void
  onAddChild: (t: "collection" | "link") => void
  onChangeChild: (key: string, row: EditorChildRow) => void
  onRemoveChild: (key: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: groupSortableId(group.id) })

  const [groupBodyOpen, setGroupBodyOpen] = useState(true)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  }

  const labelVal =
    lang === "vi" ? group.label.vi ?? "" : group.label.en ?? ""

  const setLabel = (v: string) => {
    onChangeGroup({
      ...group,
      label: { ...group.label, [lang]: v },
    })
  }

  const childIds = group.children.map((c) => childSortableId(group.id, c.key))

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-ui-border-base rounded-md p-4 flex flex-col gap-3 bg-ui-bg-base"
    >
      <div className="flex flex-wrap items-center gap-2">
        <SortableGrip attributes={attributes} listeners={listeners} />
        <Button
          type="button"
          variant="transparent"
          size="small"
          className="h-8 w-8 shrink-0 p-0 text-ui-fg-muted"
          title={groupBodyOpen ? "Thu gọn nhóm" : "Mở rộng nhóm"}
          aria-expanded={groupBodyOpen}
          aria-label={groupBodyOpen ? "Thu gọn nhóm" : "Mở rộng nhóm"}
          onClick={() => setGroupBodyOpen((v) => !v)}
        >
          {groupBodyOpen ? (
            <ChevronDown className="size-4" strokeWidth={2} />
          ) : (
            <ChevronRight className="size-4" strokeWidth={2} />
          )}
        </Button>
        <Text weight="plus" className="flex-1 min-w-[8rem] truncate">
          Nhóm menu
          {labelVal.trim() ? (
            <span className="font-normal text-ui-fg-muted">
              {" "}
              — {labelVal.trim()}
            </span>
          ) : null}
          {!groupBodyOpen && group.children.length > 0 ? (
            <span className="ml-1 font-normal text-ui-fg-muted">
              ({group.children.length} mục)
            </span>
          ) : null}
        </Text>
        <Button
          size="small"
          variant="danger"
          type="button"
          className="h-8 w-8 shrink-0 p-0"
          title="Xóa nhóm"
          aria-label="Xóa nhóm"
          onClick={onRemoveGroup}
        >
          <Trash2 className="size-4" strokeWidth={2} />
        </Button>
      </div>
      {groupBodyOpen ? (
        <>
          <div>
            <Label>Tên nhóm ({lang === "vi" ? "Tiếng Việt" : "English"})</Label>
            <Input
              value={labelVal}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={lang === "vi" ? "VD: Quà tặng" : "e.g. Gifts"}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="small"
              variant="secondary"
              type="button"
              className="h-8 w-8 p-0"
              title="Thêm collection"
              aria-label="Thêm collection"
              onClick={() => onAddChild("collection")}
            >
              <FolderKanban className="size-4" strokeWidth={2} />
            </Button>
            <Button
              size="small"
              variant="secondary"
              type="button"
              className="h-8 w-8 p-0"
              title="Thêm link ngoài"
              aria-label="Thêm link ngoài"
              onClick={() => onAddChild("link")}
            >
              <Link2 className="size-4" strokeWidth={2} />
            </Button>
          </div>
          <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-3 pl-2 border-l-2 border-ui-border-base">
              {group.children.map((row) => (
                <SortableChildRow
                  key={row.key}
                  groupId={group.id}
                  row={row}
                  lang={lang}
                  onChange={(next) => onChangeChild(row.key, next)}
                  onRemove={() => onRemoveChild(row.key)}
                />
              ))}
            </ul>
          </SortableContext>
        </>
      ) : null}
    </div>
  )
}

function SortableChildRow({
  groupId,
  row,
  lang,
  onChange,
  onRemove,
}: {
  groupId: string
  row: EditorChildRow
  lang: Lang
  onChange: (row: EditorChildRow) => void
  onRemove: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: childSortableId(groupId, row.key) })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  }

  if (row.child.type === "collection") {
    const c = row.child
    const ov = c.label_override ?? {}
    const overrideField = lang === "vi" ? ov.vi ?? "" : ov.en ?? ""
    const catalogHint =
      !(ov.vi && ov.vi.trim()) && !(ov.en && ov.en.trim())

    const setHandle = (handle: string) => {
      onChange({
        ...row,
        child: { ...c, handle },
      })
    }

    const setOverride = (v: string) => {
      const nextOv = { ...ov, [lang]: v }
      const hasAny = [nextOv.vi, nextOv.en].some((x) => x && String(x).trim())
      onChange({
        ...row,
        child: {
          ...c,
          label_override: hasAny ? nextOv : null,
        },
      })
    }

    return (
      <li
        ref={setNodeRef}
        style={style}
        className="border border-ui-border-base rounded p-3 bg-ui-bg-subtle flex flex-col gap-2"
      >
        <div className="flex flex-wrap items-center gap-2">
          <SortableGrip attributes={attributes} listeners={listeners} />
          <BadgeMini>Collection</BadgeMini>
          <Button
            size="small"
            variant="danger"
            type="button"
            className="h-8 w-8 shrink-0 p-0"
            title="Xóa mục"
            aria-label="Xóa mục"
            onClick={onRemove}
          >
            <Trash2 className="size-4" strokeWidth={2} />
          </Button>
        </div>
        <div>
          <Label>Handle collection</Label>
          <Input
            value={c.handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="handle-trong-catalog"
            list={COLLECTION_DATALIST_ID}
          />
        </div>
        <div>
          <Label>Nhãn tùy chọn ({lang === "vi" ? "VI" : "EN"})</Label>
          <Input
            value={overrideField}
            onChange={(e) => setOverride(e.target.value)}
            placeholder="Để trống = dùng tên catalog"
          />
          {catalogHint ? (
            <Text size="small" className="text-ui-fg-muted mt-1">
              Lấy tên từ catalog (khi không ghi đè)
            </Text>
          ) : null}
        </div>
      </li>
    )
  }

  const c = row.child
  const linkLabel = lang === "vi" ? c.label.vi ?? "" : c.label.en ?? ""

  const setUrl = (url: string) => {
    onChange({
      ...row,
      child: { ...c, url },
    })
  }

  const setLinkLabel = (v: string) => {
    onChange({
      ...row,
      child: {
        ...c,
        label: { ...c.label, [lang]: v },
      },
    })
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="border border-ui-border-base rounded p-3 bg-ui-bg-subtle flex flex-col gap-2"
    >
      <div className="flex flex-wrap items-center gap-2">
        <SortableGrip attributes={attributes} listeners={listeners} />
        <BadgeMini>Link</BadgeMini>
        <Button
          size="small"
          variant="danger"
          type="button"
          className="h-8 w-8 shrink-0 p-0"
          title="Xóa mục"
          aria-label="Xóa mục"
          onClick={onRemove}
        >
          <Trash2 className="size-4" strokeWidth={2} />
        </Button>
      </div>
      <div>
        <Label>URL</Label>
        <Input
          value={c.url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://… hoặc /đường-dẫn"
        />
      </div>
      <div>
        <Label>Nhãn hiển thị ({lang === "vi" ? "VI" : "EN"})</Label>
        <Input
          value={linkLabel}
          onChange={(e) => setLinkLabel(e.target.value)}
        />
      </div>
    </li>
  )
}

export function NavHeaderMenuSection() {
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(1)
  const [groups, setGroups] = useState<EditorGroupRow[]>([])
  const [lang, setLang] = useState<Lang>("vi")
  const [helpOpen, setHelpOpen] = useState(false)
  const [collectionQuery, setCollectionQuery] = useState("")
  const [collectionHits, setCollectionHits] = useState<AdminCollectionRow[]>([])
  const [collectionLoading, setCollectionLoading] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Tránh closestCenter chọn nhầm nhóm cha khi kéo mục con (Sortable lồng nhau). */
  const activeDragIdRef = useRef<string | null>(null)

  const loadNav = useCallback(async () => {
    setLoading(true)
    try {
      const res = (await adminFetch("/admin/custom/cms-nav")) as {
        nav_tree?: { version?: number; items?: unknown[] }
      }
      const raw = res.nav_tree
      const tree = {
        version: typeof raw?.version === "number" ? raw.version : 1,
        items: Array.isArray(raw?.items) ? raw.items : [],
      }
      const ed = navTreeToEditor(tree as NavTree)
      setVersion(ed.version)
      setGroups(ed.groups)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Không tải được menu")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadNav()
  }, [loadNav])

  const searchCollections = useCallback(async (q: string) => {
    setCollectionLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("limit", "20")
      if (q.trim()) {
        params.set("q", q.trim())
      }
      const res = (await adminFetch(`/admin/collections?${params.toString()}`)) as {
        collections?: AdminCollectionRow[]
      }
      setCollectionHits(res.collections ?? [])
    } catch (e: unknown) {
      setCollectionHits([])
      toast.warning(
        e instanceof Error
          ? e.message
          : "Không tải được danh sách collection (gợi ý handle)."
      )
    } finally {
      setCollectionLoading(false)
    }
  }, [])

  useEffect(() => {
    if (searchTimer.current) {
      clearTimeout(searchTimer.current)
    }
    searchTimer.current = setTimeout(() => {
      void searchCollections(collectionQuery)
    }, 280)
    return () => {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current)
      }
    }
  }, [collectionQuery, searchCollections])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      /** Nới hơn mặc định để dễ bắt đầu kéo (chuột + bàn phím cảm ứng). */
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const navMenuCollisionDetection: CollisionDetection = useCallback((args) => {
    const activeRaw = activeDragIdRef.current ?? String(args.active.id)
    const activeParsed = parseNavEditorDragId(activeRaw)
    if (!activeParsed) {
      return closestCenter(args)
    }
    const filtered = args.droppableContainers.filter((container) => {
      const id = String(container.id)
      const overParsed = parseNavEditorDragId(id)
      if (!overParsed) {
        return false
      }
      if (activeParsed.kind === "group" && overParsed.kind === "group") {
        return true
      }
      if (
        activeParsed.kind === "child" &&
        overParsed.kind === "child" &&
        activeParsed.groupId === overParsed.groupId
      ) {
        return true
      }
      return false
    })
    if (filtered.length === 0) {
      return closestCenter(args)
    }
    return closestCenter({
      ...args,
      droppableContainers: filtered,
    })
  }, [])

  const onDragStart = (_event: DragStartEvent) => {
    activeDragIdRef.current = String(_event.active.id)
  }

  const onDragCancel = (_event: DragCancelEvent) => {
    activeDragIdRef.current = null
  }

  const groupIds = useMemo(
    () => groups.map((g) => groupSortableId(g.id)),
    [groups]
  )

  const onDragEnd = (event: DragEndEvent) => {
    activeDragIdRef.current = null
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }
    const a = parseNavEditorDragId(String(active.id))
    const b = parseNavEditorDragId(String(over.id))
    if (!a || !b) {
      return
    }
    if (a.kind === "group" && b.kind === "group") {
      setGroups((prev) => {
        const oldIndex = prev.findIndex((g) => g.id === a.groupId)
        const newIndex = prev.findIndex((g) => g.id === b.groupId)
        if (oldIndex < 0 || newIndex < 0) {
          return prev
        }
        return arrayMove(prev, oldIndex, newIndex)
      })
      return
    }
    if (
      a.kind === "child" &&
      b.kind === "child" &&
      a.groupId === b.groupId
    ) {
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id !== a.groupId) {
            return g
          }
          const keys = g.children.map((c) => c.key)
          const oldIndex = keys.indexOf(a.rowKey)
          const newIndex = keys.indexOf(b.rowKey)
          if (oldIndex < 0 || newIndex < 0) {
            return g
          }
          return {
            ...g,
            children: arrayMove(g.children, oldIndex, newIndex),
          }
        })
      )
    }
  }

  const addGroup = () => {
    setGroups((g) => [
      ...g,
      {
        id: crypto.randomUUID(),
        label: {},
        children: [],
      },
    ])
  }

  const updateGroup = (id: string, next: EditorGroupRow) => {
    setGroups((list) => list.map((g) => (g.id === id ? next : g)))
  }

  const removeGroup = (id: string) => {
    if (!confirm("Xóa nhóm menu này và toàn bộ mục con?")) {
      return
    }
    setGroups((list) => list.filter((g) => g.id !== id))
  }

  const addChild = (groupId: string, t: "collection" | "link") => {
    setGroups((list) =>
      list.map((g) => {
        if (g.id !== groupId) {
          return g
        }
        const child =
          t === "collection"
            ? emptyCollectionChild()
            : emptyLinkChild()
        return {
          ...g,
          children: [
            ...g.children,
            { key: crypto.randomUUID(), child },
          ],
        }
      })
    )
  }

  const updateChild = (groupId: string, key: string, row: EditorChildRow) => {
    setGroups((list) =>
      list.map((g) => {
        if (g.id !== groupId) {
          return g
        }
        return {
          ...g,
          children: g.children.map((c) => (c.key === key ? row : c)),
        }
      })
    )
  }

  const removeChild = (groupId: string, key: string) => {
    setGroups((list) =>
      list.map((g) => {
        if (g.id !== groupId) {
          return g
        }
        return {
          ...g,
          children: g.children.filter((c) => c.key !== key),
        }
      })
    )
  }

  const save = async () => {
    for (const g of groups) {
      for (const row of g.children) {
        if (row.child.type === "link") {
          const u = row.child.url.trim()
          if (!u) {
            toast.error("Mỗi link cần URL (không được để trống).")
            return
          }
        }
        if (row.child.type === "collection") {
          if (!row.child.handle.trim()) {
            toast.error("Mỗi mục collection cần handle.")
            return
          }
        }
      }
    }
    const nav_tree = editorToNavTree(version, groups)
    try {
      await adminFetch("/admin/custom/cms-nav", {
        method: "PATCH",
        body: JSON.stringify({ nav_tree }),
      })
      toast.success("Đã lưu menu header")
      await loadNav()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Lưu menu thất bại")
    }
  }

  return (
    <CmsCollapsibleSection
      className="mt-2"
      defaultOpen
      summary={
        <>
          <Heading level="h2" className="text-base">
            Menu header (2 cấp)
          </Heading>
          <CmsRevisionDrawer
            entityType="nav"
            entityId="cms"
            triggerLabel="Lịch sử menu"
            onAfterRestore={() => loadNav()}
          />
          <Button
            size="small"
            variant="secondary"
            type="button"
            className="h-8 w-8 shrink-0 p-0"
            title="Trợ giúp"
            aria-label="Trợ giúp"
            aria-pressed={helpOpen}
            onClick={() => setHelpOpen((v) => !v)}
          >
            <CircleHelp className="size-4" strokeWidth={2} />
          </Button>
        </>
      }
    >
      {helpOpen ? (
        <Text size="small" className="text-ui-fg-subtle max-w-3xl">
          <strong>Trợ giúp:</strong> Menu gồm tối đa hai cấp — <strong>cấp 1</strong> là các{" "}
          <em>nhóm</em> (tab trên header), <strong>cấp 2</strong> là{" "}
          <em>collection</em> trong catalog hoặc <em>link ngoài</em>. Kéo bằng nút{" "}
          <strong>⠿</strong> (ô viền nét đứt) để đổi thứ tự <em>giữa các nhóm</em> hoặc{" "}
          <em>trong cùng một nhóm</em>; không kéo giữa hai nhóm khác nhau. Nhãn có thể điền
          một hoặc hai ngôn ngữ (VI / EN).
        </Text>
      ) : null}

      {loading ? (
        <Text>Đang tải menu…</Text>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Text size="small" weight="plus">
              Ngôn ngữ chỉnh sửa nhãn:
            </Text>
            <Button
              size="small"
              variant={lang === "vi" ? "primary" : "secondary"}
              type="button"
              className="min-w-[2.5rem] px-2"
              title="Nhãn tiếng Việt"
              onClick={() => setLang("vi")}
            >
              VI
            </Button>
            <Button
              size="small"
              variant={lang === "en" ? "primary" : "secondary"}
              type="button"
              className="min-w-[2.5rem] px-2"
              title="English labels"
              onClick={() => setLang("en")}
            >
              EN
            </Button>
          </div>

          <div className="max-w-xl flex flex-col gap-2">
            <Label>Tìm collection (gợi ý handle)</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Gõ tên hoặc handle…"
                value={collectionQuery}
                onChange={(e) => setCollectionQuery(e.target.value)}
              />
              {collectionLoading ? (
                <Text size="small" className="text-ui-fg-muted">
                  Đang tìm…
                </Text>
              ) : null}
            </div>
            <datalist id={COLLECTION_DATALIST_ID}>
              {collectionHits.map((h, idx) => (
                <option
                  key={h.id ?? `${h.handle ?? "h"}-${idx}`}
                  value={h.handle ?? ""}
                >
                  {h.title ?? h.handle}
                </option>
              ))}
            </datalist>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={navMenuCollisionDetection}
            onDragStart={onDragStart}
            onDragCancel={onDragCancel}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={groupIds} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-4">
                {groups.map((g) => (
                  <SortableGroupCard
                    key={g.id}
                    group={g}
                    lang={lang}
                    onChangeGroup={(next) => updateGroup(g.id, next)}
                    onRemoveGroup={() => removeGroup(g.id)}
                    onAddChild={(t) => addChild(g.id, t)}
                    onChangeChild={(key, row) => updateChild(g.id, key, row)}
                    onRemoveChild={(key) => removeChild(g.id, key)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-9 w-9 p-0"
              title="Thêm nhóm menu"
              aria-label="Thêm nhóm menu"
              onClick={addGroup}
            >
              <Plus className="size-4" strokeWidth={2} />
            </Button>
            <Button
              type="button"
              className="h-9 w-9 p-0"
              title="Lưu menu"
              aria-label="Lưu menu"
              onClick={() => void save()}
            >
              <Save className="size-4" strokeWidth={2} />
            </Button>
          </div>
        </>
      )}
    </CmsCollapsibleSection>
  )
}
