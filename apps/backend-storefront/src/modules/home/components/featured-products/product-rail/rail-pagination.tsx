"use client"

import { useStorefrontMessages } from "@lib/i18n/storefront-i18n-provider"
import { clx } from "@medusajs/ui"

/**
 * Bản phân trang riêng cho rail trang chủ — KHÔNG dùng useSearchParams/usePathname/useRouter
 * (khác `@modules/store/components/pagination`, vốn gắn với URL) vì các hook điều hướng đó
 * đòi Suspense boundary bao quanh; re-render cục bộ trong 1 rail (không đổi URL) mà thiếu
 * boundary đó gây crash "Minified React error #482". Component này chỉ đổi state cục bộ.
 */
export function RailPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const pag = useStorefrontMessages().pagination

  const arrayRange = (start: number, stop: number) =>
    Array.from({ length: stop - start + 1 }, (_, index) => start + index)

  const renderPageButton = (
    pageNum: number,
    label: string | number,
    isCurrent: boolean
  ) => (
    <button
      key={pageNum}
      type="button"
      className={clx("txt-xlarge-plus text-ui-fg-muted", {
        "text-ui-fg-base hover:text-ui-fg-subtle": isCurrent,
      })}
      disabled={isCurrent}
      onClick={() => onPageChange(pageNum)}
      aria-label={
        isCurrent
          ? pag.currentPage.replace("{n}", String(pageNum))
          : pag.goToPage.replace("{n}", String(pageNum))
      }
      aria-current={isCurrent ? "page" : undefined}
    >
      <span aria-hidden="true">{label}</span>
    </button>
  )

  const renderEllipsis = (key: string) => (
    <span
      key={key}
      className="txt-xlarge-plus text-ui-fg-muted items-center cursor-default"
      aria-hidden="true"
    >
      …
    </span>
  )

  const renderPageButtons = () => {
    const buttons = []

    if (totalPages <= 7) {
      buttons.push(
        ...arrayRange(1, totalPages).map((p) => renderPageButton(p, p, p === page))
      )
    } else if (page <= 4) {
      buttons.push(
        ...arrayRange(1, 5).map((p) => renderPageButton(p, p, p === page))
      )
      buttons.push(renderEllipsis("ellipsis1"))
      buttons.push(renderPageButton(totalPages, totalPages, totalPages === page))
    } else if (page >= totalPages - 3) {
      buttons.push(renderPageButton(1, 1, 1 === page))
      buttons.push(renderEllipsis("ellipsis2"))
      buttons.push(
        ...arrayRange(totalPages - 4, totalPages).map((p) =>
          renderPageButton(p, p, p === page)
        )
      )
    } else {
      buttons.push(renderPageButton(1, 1, 1 === page))
      buttons.push(renderEllipsis("ellipsis3"))
      buttons.push(
        ...arrayRange(page - 1, page + 1).map((p) => renderPageButton(p, p, p === page))
      )
      buttons.push(renderEllipsis("ellipsis4"))
      buttons.push(renderPageButton(totalPages, totalPages, totalPages === page))
    }

    return buttons
  }

  const pageStatus = pag.pageStatus
    .replace("{current}", String(page))
    .replace("{total}", String(totalPages))

  return (
    <div className="flex justify-center w-full mt-8 xsmall:mt-10">
      <nav aria-label={pag.navLabel} className="w-full flex justify-center">
        <p className="sr-only" aria-live="polite">
          {pageStatus}
        </p>
        <div className="flex gap-3 items-end">{renderPageButtons()}</div>
      </nav>
    </div>
  )
}
