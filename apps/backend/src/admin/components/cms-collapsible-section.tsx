import { ChevronDown, ChevronRight } from "lucide-react"
import type { ReactNode } from "react"
import { useState } from "react"

type Props = {
  summary: ReactNode
  children: ReactNode
  /** Mặc định mở — tắt cho khối phụ / ít dùng */
  defaultOpen?: boolean
  className?: string
}

/**
 * Card có thể thu gọn — dùng chung các màn Storefront CMS / tin / trang.
 */
export function CmsCollapsibleSection({
  summary,
  children,
  defaultOpen = true,
  className = "",
}: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section
      className={`rounded-lg border border-ui-border-base bg-ui-bg-base ${className}`.trim()}
    >
      <button
        type="button"
        className={`flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-ui-bg-subtle-hover ${
          open ? "rounded-t-lg" : "rounded-lg"
        }`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="mt-0.5 shrink-0 text-ui-fg-muted" aria-hidden>
          {open ? (
            <ChevronDown className="size-4" strokeWidth={2} />
          ) : (
            <ChevronRight className="size-4" strokeWidth={2} />
          )}
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {summary}
        </div>
      </button>
      {open ? (
        <div className="rounded-b-lg border-t border-ui-border-base px-3 py-4">
          {children}
        </div>
      ) : null}
    </section>
  )
}
