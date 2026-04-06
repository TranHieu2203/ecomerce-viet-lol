"use client"

import { useStorefrontMessages } from "@lib/i18n/storefront-i18n-provider"
import { clx } from "@medusajs/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export function Pagination({
  page,
  totalPages,
  "data-testid": dataTestid,
}: {
  page: number
  totalPages: number
  "data-testid"?: string
}) {
  const pag = useStorefrontMessages().pagination
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const arrayRange = (start: number, stop: number) =>
    Array.from({ length: stop - start + 1 }, (_, index) => start + index)

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", newPage.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

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
      onClick={() => handlePageChange(pageNum)}
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
        ...arrayRange(1, totalPages).map((p) =>
          renderPageButton(p, p, p === page)
        )
      )
    } else {
      if (page <= 4) {
        buttons.push(
          ...arrayRange(1, 5).map((p) =>
            renderPageButton(p, p, p === page)
          )
        )
        buttons.push(renderEllipsis("ellipsis1"))
        buttons.push(
          renderPageButton(totalPages, totalPages, totalPages === page)
        )
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
          ...arrayRange(page - 1, page + 1).map((p) =>
            renderPageButton(p, p, p === page)
          )
        )
        buttons.push(renderEllipsis("ellipsis4"))
        buttons.push(
          renderPageButton(totalPages, totalPages, totalPages === page)
        )
      }
    }

    return buttons
  }

  const pageStatus = pag.pageStatus
    .replace("{current}", String(page))
    .replace("{total}", String(totalPages))

  return (
    <div className="flex justify-center w-full mt-12">
      <nav aria-label={pag.navLabel} className="w-full flex justify-center">
        <p className="sr-only" aria-live="polite">
          {pageStatus}
        </p>
        <div className="flex gap-3 items-end" data-testid={dataTestid}>
          {renderPageButtons()}
        </div>
      </nav>
    </div>
  )
}
