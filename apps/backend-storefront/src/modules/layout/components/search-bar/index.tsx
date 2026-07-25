"use client"

import { searchStorefront } from "@lib/data/search-actions"
import { useStorefrontMessages } from "@lib/i18n/storefront-i18n-provider"
import { normalizeMedusaAssetUrl } from "@lib/util/cms-assets"
import { displayProduct } from "@lib/util/i18n-catalog"
import { ArrowLeftMini, MagnifyingGlass, XMark } from "@medusajs/icons"
import { CmsNewsListItem } from "@lib/data/cms"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

const DEBOUNCE_MS = 300

export default function SearchBar({ countryCode }: { countryCode: string }) {
  const m = useStorefrontMessages().nav
  const router = useRouter()

  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([])
  const [news, setNews] = useState<CmsNewsListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [mounted, setMounted] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const desktopInputRef = useRef<HTMLInputElement | null>(null)
  const mobileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      mobileInputRef.current?.focus()
    }
  }, [isOpen])

  // Khóa cuộn nền khi panel toàn màn hình trên mobile đang mở — CHỈ áp dụng
  // dưới breakpoint "small" (1024px), nơi panel thực sự chiếm toàn màn hình.
  // Trên desktop, isOpen chỉ mở 1 dropdown neo nhỏ nên không được khoá cuộn trang.
  useEffect(() => {
    if (!isOpen || typeof window === "undefined" || !window.matchMedia) {
      return
    }
    if (!window.matchMedia("(max-width: 1023px)").matches) {
      return
    }
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [isOpen])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setProducts([])
      setNews([])
      setSearched(false)
      setLoading(false)
      return
    }
    setLoading(true)
    const t = setTimeout(() => {
      searchStorefront(trimmed, countryCode)
        .then(({ products, news }) => {
          setProducts(products)
          setNews(news)
        })
        .catch(() => {
          setProducts([])
          setNews([])
        })
        .finally(() => {
          setSearched(true)
          setLoading(false)
        })
    }, DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [query, countryCode])

  useEffect(() => {
    if (!isOpen) {
      return
    }
    const onPointerDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }
    window.addEventListener("mousedown", onPointerDown)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("mousedown", onPointerDown)
      window.removeEventListener("keydown", onKey)
    }
  }, [isOpen])

  const goToProductResults = () => {
    const trimmed = query.trim()
    if (!trimmed) {
      return
    }
    setIsOpen(false)
    router.push(`/${countryCode}/store?q=${encodeURIComponent(trimmed)}`)
  }

  const goToNewsResults = () => {
    const trimmed = query.trim()
    if (!trimmed) {
      return
    }
    setIsOpen(false)
    router.push(`/${countryCode}/news?q=${encodeURIComponent(trimmed)}`)
  }

  const trimmedQuery = query.trim()
  const hasResults = products.length > 0 || news.length > 0

  const resultsPanel = (
    <>
      {trimmedQuery ? (
        <div className="flex-1 overflow-y-auto small:max-h-[60vh]">
          {products.length > 0 ? (
            <div>
              <p className="px-3 pt-3 pb-1 text-xsmall-regular font-semibold text-ui-fg-muted uppercase tracking-wide">
                {m.searchSectionProducts}
              </p>
              <ul>
                {products.map((p) => {
                  const { title } = displayProduct(
                    countryCode,
                    p.title,
                    p.description,
                    p.metadata as Record<string, unknown> | null | undefined
                  )
                  return (
                    <li key={p.id}>
                      <LocalizedClientLink
                        href={`/products/${p.handle}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-3 hover:bg-ui-bg-subtle transition-colors duration-180 ease-standard"
                      >
                        <div className="relative w-12 h-12 shrink-0 rounded-rounded overflow-hidden bg-ui-bg-subtle">
                          {p.thumbnail ? (
                            <Image
                              src={
                                normalizeMedusaAssetUrl(p.thumbnail) ||
                                p.thumbnail
                              }
                              alt={title}
                              fill
                              sizes="48px"
                              style={{ objectFit: "cover" }}
                            />
                          ) : null}
                        </div>
                        <span className="text-small-regular text-ui-fg-base line-clamp-2">
                          {title}
                        </span>
                      </LocalizedClientLink>
                    </li>
                  )
                })}
              </ul>
              <button
                type="button"
                onClick={goToProductResults}
                className="block w-full py-2.5 px-3 text-left text-small-semi text-ui-fg-interactive hover:bg-ui-bg-subtle transition-colors duration-180 ease-standard"
              >
                {m.searchViewAll.replace("{query}", trimmedQuery)}
              </button>
            </div>
          ) : null}

          {news.length > 0 ? (
            <div className="border-t border-ui-border-base">
              <p className="px-3 pt-3 pb-1 text-xsmall-regular font-semibold text-ui-fg-muted uppercase tracking-wide">
                {m.searchSectionNews}
              </p>
              <ul>
                {news.map((a) => (
                  <li key={a.slug}>
                    <LocalizedClientLink
                      href={`/news/${encodeURIComponent(a.slug)}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 p-3 hover:bg-ui-bg-subtle transition-colors duration-180 ease-standard"
                    >
                      <div className="relative w-12 h-12 shrink-0 rounded-rounded overflow-hidden bg-ui-bg-subtle">
                        {a.featured_image_url ? (
                          <Image
                            src={a.featured_image_url}
                            alt=""
                            fill
                            sizes="48px"
                            style={{ objectFit: "cover" }}
                          />
                        ) : null}
                      </div>
                      <span className="text-small-regular text-ui-fg-base line-clamp-2">
                        {a.title || a.slug}
                      </span>
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={goToNewsResults}
                className="block w-full py-2.5 px-3 text-left text-small-semi text-ui-fg-interactive hover:bg-ui-bg-subtle transition-colors duration-180 ease-standard"
              >
                {m.searchViewAllNews.replace("{query}", trimmedQuery)}
              </button>
            </div>
          ) : null}

          {!hasResults && searched && !loading ? (
            <div className="p-4 text-small-regular text-ui-fg-muted">
              {m.searchNoResults.replace("{query}", trimmedQuery)}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  )

  return (
    <div ref={containerRef} className="relative">
      {/* Mobile: icon mở tìm kiếm toàn màn hình (không đủ chỗ cho ô nhập luôn hiện trên header). */}
      <button
        type="button"
        aria-label={m.searchLabel}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className="small:hidden inline-flex items-center justify-center min-h-10 min-w-10 rounded-rounded hover:bg-ui-bg-subtle hover:text-ui-fg-base transition-colors duration-180 ease-standard focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg-interactive"
      >
        <MagnifyingGlass />
      </button>

      {/* Desktop: ô nhập luôn hiển thị. */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          goToProductResults()
        }}
        className="hidden small:flex items-center gap-2 h-10 w-48 medium:w-64 px-3 rounded-full border border-ui-border-base bg-ui-bg-subtle focus-within:border-ui-border-interactive transition-colors duration-180 ease-standard"
      >
        <MagnifyingGlass className="text-ui-fg-muted shrink-0" />
        <input
          ref={desktopInputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={m.searchPlaceholder}
          aria-label={m.searchLabel}
          className="flex-1 min-w-0 bg-transparent outline-none text-small-regular placeholder:text-ui-fg-muted"
        />
        {query ? (
          <button
            type="button"
            aria-label={m.searchClear}
            onClick={() => setQuery("")}
            className="text-ui-fg-muted hover:text-ui-fg-base shrink-0"
          >
            <XMark />
          </button>
        ) : null}
      </form>

      {/* Desktop: dropdown neo theo ô nhập — viewport rộng nên không lo tràn màn hình. */}
      {isOpen ? (
        <div
          role="search"
          className="hidden small:block absolute right-0 top-full mt-2 z-50 w-[380px] rounded-rounded border border-brand-gold/25 bg-white shadow-lg shadow-[0_12px_40px_-12px_rgba(184,148,79,0.2)] animate-fade-in-top motion-reduce:animate-none overflow-hidden"
        >
          {resultsPanel}
        </div>
      ) : null}

      {/* Mobile: chiếm toàn màn hình — render qua portal vào <body> vì header cha có
          backdrop-blur (backdrop-filter tạo containing block mới cho position:fixed,
          khiến "fixed inset-0" bị co lại theo kích thước header thay vì toàn viewport). */}
      {mounted && isOpen
        ? createPortal(
            <div className="small:hidden fixed inset-0 z-[70] bg-white flex flex-col">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  goToProductResults()
                }}
                className="flex items-center gap-2 p-3 border-b border-ui-border-base shrink-0"
              >
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label={m.searchClear}
                  className="flex items-center justify-center w-9 h-9 shrink-0 rounded-rounded text-ui-fg-subtle hover:bg-ui-bg-subtle"
                >
                  <ArrowLeftMini />
                </button>
                <div className="flex-1 flex items-center gap-2 h-10 px-3 rounded-full border border-ui-border-base bg-ui-bg-subtle focus-within:border-ui-border-interactive transition-colors duration-180 ease-standard">
                  <MagnifyingGlass className="text-ui-fg-muted shrink-0" />
                  <input
                    ref={mobileInputRef}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={m.searchPlaceholder}
                    aria-label={m.searchLabel}
                    className="flex-1 min-w-0 bg-transparent outline-none text-small-regular placeholder:text-ui-fg-muted"
                  />
                  {query ? (
                    <button
                      type="button"
                      aria-label={m.searchClear}
                      onClick={() => setQuery("")}
                      className="text-ui-fg-muted hover:text-ui-fg-base shrink-0"
                    >
                      <XMark />
                    </button>
                  ) : null}
                </div>
              </form>

              <div className="flex-1 overflow-y-auto flex flex-col">
                {resultsPanel}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
