import { Button, Input, Label, Text, toast } from "@medusajs/ui"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import Table from "@tiptap/extension-table"
import TableCellBase from "@tiptap/extension-table-cell"
import TableHeaderBase from "@tiptap/extension-table-header"
import TableRow from "@tiptap/extension-table-row"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Heading2,
  Heading3,
  Heading4,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Redo2,
  Strikethrough,
  Table2,
  TableCellsMerge,
  TableCellsSplit,
  TextQuote,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  adminUploadFiles,
  pushRecentCmsMediaId,
} from "../storefront-cms/admin-upload"

const ICON = { className: "size-4 shrink-0", strokeWidth: 2 }

/** colspan/rowspan: parse & render HTML đúng (mặc định TipTap thiếu parseHTML/renderHTML). */
const TableCell = TableCellBase.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      colspan: {
        default: 1,
        parseHTML: (element) => {
          const v = element.getAttribute("colspan")
          if (!v) {
            return 1
          }
          const n = parseInt(v, 10)
          return Number.isFinite(n) && n > 0 ? n : 1
        },
        renderHTML: (attributes) => {
          const n = attributes.colspan as number
          return !n || n <= 1 ? {} : { colspan: String(n) }
        },
      },
      rowspan: {
        default: 1,
        parseHTML: (element) => {
          const v = element.getAttribute("rowspan")
          if (!v) {
            return 1
          }
          const n = parseInt(v, 10)
          return Number.isFinite(n) && n > 0 ? n : 1
        },
        renderHTML: (attributes) => {
          const n = attributes.rowspan as number
          return !n || n <= 1 ? {} : { rowspan: String(n) }
        },
      },
    }
  },
})

const TableHeader = TableHeaderBase.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      colspan: {
        default: 1,
        parseHTML: (element) => {
          const v = element.getAttribute("colspan")
          if (!v) {
            return 1
          }
          const n = parseInt(v, 10)
          return Number.isFinite(n) && n > 0 ? n : 1
        },
        renderHTML: (attributes) => {
          const n = attributes.colspan as number
          return !n || n <= 1 ? {} : { colspan: String(n) }
        },
      },
      rowspan: {
        default: 1,
        parseHTML: (element) => {
          const v = element.getAttribute("rowspan")
          if (!v) {
            return 1
          }
          const n = parseInt(v, 10)
          return Number.isFinite(n) && n > 0 ? n : 1
        },
        renderHTML: (attributes) => {
          const n = attributes.rowspan as number
          return !n || n <= 1 ? {} : { rowspan: String(n) }
        },
      },
    }
  },
})

function readTableCellAttrs(editor: {
  isActive: (name: string) => boolean
  getAttributes: (name: string) => Record<string, unknown>
}) {
  let attrs: Record<string, unknown> = {}
  if (editor.isActive("tableHeader")) {
    attrs = editor.getAttributes("tableHeader")
  } else if (editor.isActive("tableCell")) {
    attrs = editor.getAttributes("tableCell")
  }
  const colspan =
    typeof attrs.colspan === "number" && attrs.colspan > 0 ? attrs.colspan : 1
  const rowspan =
    typeof attrs.rowspan === "number" && attrs.rowspan > 0 ? attrs.rowspan : 1
  return { colspan, rowspan }
}

function ToolbarDivider() {
  return (
    <span
      className="mx-1 h-6 w-px shrink-0 self-center bg-ui-border-base"
      aria-hidden
    />
  )
}

function ToolbarIconButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active ?? false}
      className={[
        "inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-md px-1.5 transition-colors",
        disabled
          ? "cursor-not-allowed opacity-40"
          : "cursor-pointer hover:bg-ui-bg-base-hover",
        active
          ? "border border-ui-border-strong bg-ui-bg-base text-ui-fg-base shadow-sm"
          : "border border-transparent text-ui-fg-muted hover:text-ui-fg-base",
      ].join(" ")}
    >
      {children}
    </button>
  )
}

async function uploadImageAndGetSrc(file: File): Promise<string | null> {
  const uploaded = await adminUploadFiles([file])
  const first = uploaded[0]
  if (!first?.id) {
    toast.error("Không nhận được file sau khi upload")
    return null
  }
  pushRecentCmsMediaId(first.id)
  const src = first.url?.trim() ?? ""
  if (!src) {
    toast.error(
      "Upload không trả về URL công khai cho ảnh — thử lại hoặc kiểm tra module File."
    )
    return null
  }
  return src
}

export function CmsNewsBodyEditor({
  initialHtml,
  onHtmlChange,
  placeholder,
  disabled,
}: {
  initialHtml: string
  onHtmlChange: (html: string) => void
  placeholder: string
  disabled?: boolean
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<ReturnType<typeof useEditor>>(null)
  const [linkBarOpen, setLinkBarOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkNewTab, setLinkNewTab] = useState(false)

  const insertImageFromFile = useCallback(
    async (file: File) => {
      const ed = editorRef.current
      if (!ed || disabled) {
        return
      }
      try {
        const src = await uploadImageAndGetSrc(file)
        if (src) {
          ed.chain().focus().setImage({ src, alt: "" }).run()
        }
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Upload ảnh thất bại")
      }
    },
    [disabled]
  )

  const editor = useEditor({
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      Table.configure({
        resizable: false,
        HTMLAttributes: {
          class: "border-collapse w-full my-4 text-sm",
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: { class: "border border-ui-border-base bg-ui-bg-subtle px-2 py-1" },
      }),
      TableCell.configure({
        HTMLAttributes: { class: "border border-ui-border-base px-2 py-1 align-top" },
      }),
      Image.configure({
        allowBase64: false,
        HTMLAttributes: { class: "max-w-full h-auto rounded-md" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
    ],
    content: initialHtml || "<p></p>",
    onUpdate: ({ editor: ed }) => {
      onHtmlChange(ed.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "ProseMirror focus:outline-none min-h-[280px] md:min-h-[360px] px-4 py-3 text-sm leading-relaxed text-ui-fg-base [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-6 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold [&_h4]:mt-2 [&_h4]:text-sm [&_h4]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-ui-border-strong [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-ui-fg-muted [&_pre]:bg-ui-bg-subtle [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:text-xs [&_pre]:overflow-x-auto [&_code]:text-[0.9em]",
      },
      handlePaste: (_view, event) => {
        const ed = editorRef.current
        if (!ed || disabled) {
          return false
        }
        const items = event.clipboardData?.items
        if (!items?.length) {
          return false
        }
        for (const item of items) {
          if (item.kind === "file" && item.type.startsWith("image/")) {
            const file = item.getAsFile()
            if (file) {
              event.preventDefault()
              void insertImageFromFile(file)
              return true
            }
          }
        }
        return false
      },
      handleDrop: (_view, event) => {
        const ed = editorRef.current
        if (!ed || disabled) {
          return false
        }
        const dt = event.dataTransfer
        if (!dt?.files?.length) {
          return false
        }
        const file = Array.from(dt.files).find((f) =>
          f.type.startsWith("image/")
        )
        if (file) {
          event.preventDefault()
          void insertImageFromFile(file)
          return true
        }
        return false
      },
    },
  })

  editorRef.current = editor ?? null

  const [tableColspanStr, setTableColspanStr] = useState("1")
  const [tableRowspanStr, setTableRowspanStr] = useState("1")

  useEffect(() => {
    if (!editor) {
      return
    }
    const syncTableSpans = () => {
      if (!editor.isActive("table")) {
        return
      }
      const { colspan, rowspan } = readTableCellAttrs(editor)
      setTableColspanStr(String(colspan))
      setTableRowspanStr(String(rowspan))
    }
    editor.on("selectionUpdate", syncTableSpans)
    editor.on("transaction", syncTableSpans)
    syncTableSpans()
    return () => {
      editor.off("selectionUpdate", syncTableSpans)
      editor.off("transaction", syncTableSpans)
    }
  }, [editor])

  useEffect(() => {
    if (!editor) {
      return
    }
    editor.setEditable(!disabled)
  }, [editor, disabled])

  const openLinkBar = useCallback(() => {
    if (!editor || disabled) {
      return
    }
    const attrs = editor.getAttributes("link") as {
      href?: string
      target?: string
    }
    setLinkUrl(attrs.href?.trim() ?? "https://")
    setLinkNewTab(attrs.target === "_blank")
    setLinkBarOpen(true)
  }, [editor, disabled])

  const applyLink = useCallback(() => {
    if (!editor || disabled) {
      return
    }
    const t = linkUrl.trim()
    if (t === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      setLinkBarOpen(false)
      return
    }
    const linkAttrs = linkNewTab
      ? { href: t, target: "_blank" as const, rel: "noopener noreferrer" }
      : { href: t, rel: "noopener noreferrer" }
    editor.chain().focus().extendMarkRange("link").setLink(linkAttrs).run()
    setLinkBarOpen(false)
  }, [editor, disabled, linkUrl, linkNewTab])

  const onPickImage = () => fileRef.current?.click()

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (f?.type.startsWith("image/")) {
      await insertImageFromFile(f)
    }
  }

  const applyTableColspanRowspan = () => {
    if (!editor || disabled) {
      return
    }
    const c = parseInt(tableColspanStr, 10)
    const r = parseInt(tableRowspanStr, 10)
    if (!Number.isFinite(c) || c < 1 || c > 20) {
      toast.error("Colspan: nhập số từ 1 đến 20.")
      return
    }
    if (!Number.isFinite(r) || r < 1 || r > 20) {
      toast.error("Rowspan: nhập số từ 1 đến 20.")
      return
    }
    editor
      .chain()
      .focus()
      .setCellAttribute("colspan", c)
      .setCellAttribute("rowspan", r)
      .fixTables()
      .run()
  }

  if (!editor) {
    return (
      <div className="rounded-md border border-ui-border-base bg-ui-bg-field p-4">
        <Text size="small" className="text-ui-fg-muted">
          Đang khởi tạo trình soạn thảo…
        </Text>
      </div>
    )
  }

  const alignLeftActive =
    editor.isActive({ textAlign: "left" }) ||
    (!editor.isActive({ textAlign: "center" }) &&
      !editor.isActive({ textAlign: "right" }))

  return (
    <div className="flex flex-col gap-0">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onFileChange(e)}
      />
      <div className="overflow-hidden rounded-t-md border border-b-0 border-ui-border-base bg-ui-bg-subtle">
        <div
          className="flex flex-wrap items-center gap-0.5 px-2 py-2"
          role="toolbar"
          aria-label="Định dạng nội dung"
        >
          <ToolbarIconButton
            title="Hoàn tác"
            disabled={disabled || !editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 {...ICON} />
          </ToolbarIconButton>
          <ToolbarIconButton
            title="Làm lại"
            disabled={disabled || !editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 {...ICON} />
          </ToolbarIconButton>
          <ToolbarDivider />
          <ToolbarIconButton
            title="Đậm"
            active={editor.isActive("bold")}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold {...ICON} />
          </ToolbarIconButton>
          <ToolbarIconButton
            title="Nghiêng"
            active={editor.isActive("italic")}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic {...ICON} />
          </ToolbarIconButton>
          <ToolbarIconButton
            title="Gạch dưới"
            active={editor.isActive("underline")}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon {...ICON} />
          </ToolbarIconButton>
          <ToolbarIconButton
            title="Gạch ngang"
            active={editor.isActive("strike")}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough {...ICON} />
          </ToolbarIconButton>
          <ToolbarDivider />
          <ToolbarIconButton
            title="Tiêu đề 2"
            active={editor.isActive("heading", { level: 2 })}
            disabled={disabled}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 {...ICON} />
          </ToolbarIconButton>
          <ToolbarIconButton
            title="Tiêu đề 3"
            active={editor.isActive("heading", { level: 3 })}
            disabled={disabled}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3 {...ICON} />
          </ToolbarIconButton>
          <ToolbarIconButton
            title="Tiêu đề 4"
            active={editor.isActive("heading", { level: 4 })}
            disabled={disabled}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 4 }).run()
            }
          >
            <Heading4 {...ICON} />
          </ToolbarIconButton>
          <ToolbarDivider />
          <ToolbarIconButton
            title="Khối mã (code)"
            active={editor.isActive("codeBlock")}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Code2 {...ICON} />
          </ToolbarIconButton>
          <ToolbarDivider />
          <ToolbarIconButton
            title="Danh sách dấu đầu dòng"
            active={editor.isActive("bulletList")}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List {...ICON} />
          </ToolbarIconButton>
          <ToolbarIconButton
            title="Danh sách đánh số"
            active={editor.isActive("orderedList")}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered {...ICON} />
          </ToolbarIconButton>
          <ToolbarIconButton
            title="Trích dẫn"
            active={editor.isActive("blockquote")}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <TextQuote {...ICON} />
          </ToolbarIconButton>
          <ToolbarIconButton
            title="Đường kẻ ngang"
            disabled={disabled}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus {...ICON} />
          </ToolbarIconButton>
          <ToolbarDivider />
          <ToolbarIconButton
            title="Căn trái"
            active={alignLeftActive}
            disabled={disabled}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft {...ICON} />
          </ToolbarIconButton>
          <ToolbarIconButton
            title="Căn giữa"
            active={editor.isActive({ textAlign: "center" })}
            disabled={disabled}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter {...ICON} />
          </ToolbarIconButton>
          <ToolbarIconButton
            title="Căn phải"
            active={editor.isActive({ textAlign: "right" })}
            disabled={disabled}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight {...ICON} />
          </ToolbarIconButton>
          <ToolbarDivider />
          <ToolbarIconButton
            title="Chèn hoặc sửa liên kết"
            active={editor.isActive("link") || linkBarOpen}
            disabled={disabled}
            onClick={() => openLinkBar()}
          >
            <Link2 {...ICON} />
          </ToolbarIconButton>
          <ToolbarIconButton
            title="Chèn bảng 3×3"
            disabled={disabled}
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
          >
            <Table2 {...ICON} />
          </ToolbarIconButton>
          <ToolbarIconButton
            title="Chèn ảnh"
            disabled={disabled}
            onClick={() => onPickImage()}
          >
            <ImagePlus {...ICON} />
          </ToolbarIconButton>
        </div>
        {editor.isActive("table") ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-ui-border-base px-2 py-2">
            <Text size="small" weight="plus" className="text-ui-fg-muted shrink-0">
              Ô bảng
            </Text>
            <ToolbarIconButton
              title="Gộp ô (chọn nhiều ô liền kề)"
              disabled={disabled || !editor.can().mergeCells()}
              onClick={() =>
                editor.chain().focus().mergeCells().fixTables().run()
              }
            >
              <TableCellsMerge {...ICON} />
            </ToolbarIconButton>
            <ToolbarIconButton
              title="Tách ô đang gộp"
              disabled={disabled || !editor.can().splitCell()}
              onClick={() =>
                editor.chain().focus().splitCell().fixTables().run()
              }
            >
              <TableCellsSplit {...ICON} />
            </ToolbarIconButton>
            <ToolbarDivider />
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="cms-news-td-colspan" className="text-xs shrink-0">
                Colspan
              </Label>
              <Input
                id="cms-news-td-colspan"
                type="number"
                min={1}
                max={20}
                className="w-[4.25rem] h-8"
                value={tableColspanStr}
                onChange={(e) => setTableColspanStr(e.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="cms-news-td-rowspan" className="text-xs shrink-0">
                Rowspan
              </Label>
              <Input
                id="cms-news-td-rowspan"
                type="number"
                min={1}
                max={20}
                className="w-[4.25rem] h-8"
                value={tableRowspanStr}
                onChange={(e) => setTableRowspanStr(e.target.value)}
                disabled={disabled}
              />
            </div>
            <Button
              type="button"
              size="small"
              variant="secondary"
              disabled={disabled}
              onClick={() => applyTableColspanRowspan()}
            >
              Áp dụng ô
            </Button>
          </div>
        ) : null}
      </div>
      {linkBarOpen ? (
        <div className="flex flex-col gap-2 border-x border-ui-border-base border-b-0 bg-ui-bg-field px-3 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex min-w-[200px] flex-1 flex-col gap-1">
              <Label htmlFor="cms-news-link-url">Liên kết (URL)</Label>
              <Input
                id="cms-news-link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://"
                disabled={disabled}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 pb-2 text-small text-ui-fg-base">
              <input
                type="checkbox"
                checked={linkNewTab}
                onChange={(e) => setLinkNewTab(e.target.checked)}
                disabled={disabled}
              />
              Mở tab mới
            </label>
            <Button
              type="button"
              size="small"
              disabled={disabled}
              onClick={() => applyLink()}
            >
              Áp dụng
            </Button>
            <Button
              type="button"
              size="small"
              variant="secondary"
              disabled={disabled}
              onClick={() => setLinkBarOpen(false)}
            >
              Đóng
            </Button>
          </div>
        </div>
      ) : null}
      <div className="rounded-b-md border border-t-0 border-ui-border-base bg-ui-bg-field">
        <EditorContent editor={editor} />
      </div>
      <Text size="small" className="mt-2 text-ui-fg-muted">
        Định dạng, bảng (gộp/tách ô, colspan/rowspan qua thanh &quot;Ô bảng&quot;), mã,
        liên kết (có thể mở tab mới), ảnh. Dán từ Word / trình duyệt giữ phần lớn
        cấu trúc; ảnh dán hoặc kéo thả sẽ upload thư viện. Lưu: HTML được lọc an
        toàn phía server.
      </Text>
    </div>
  )
}
