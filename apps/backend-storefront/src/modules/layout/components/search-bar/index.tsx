"use client"

import { listProducts } from "@lib/data/products"
import { useStorefrontMessages } from "@lib/i18n/storefront-i18n-provider"
import { normalizeMedusaAssetUrl } from "@lib/util/cms-assets"
import { displayProduct } from "@lib/util/i18n-catalog"
import { MagnifyingGlass, XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

const DEBOUNCE_MS = 300
const RESULT_LIMIT = 6

export default function SearchBar({ countryCode }: { countryCode: string }) {
  const m = useStorefrontMessages().nav
  const router = useRouter()

  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<HttpTypes.StoreProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setSearched(false)
      setLoading(false)
      return
    }
    setLoading(true)
    const t = setTimeout(() => {
      listProducts({
        countryCode,
        queryParams: {
          q: trimmed,
          limit: RESULT_LIMIT,
          fields: "id,handle,title,description,thumbnail,metadata",
        },
      })
        .then(({ response }) => {
          setResults(response.products)
        })
        .catch(() => {
          setResults([])
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

  const goToResults = () => {
    const trimmed = query.trim()
    if (!trimmed) {
      return
    }
    setIsOpen(false)
    router.push(`/${countryCode}/store?q=${encodeURIComponent(trimmed)}`)
  }

  const trimmedQuery = query.trim()

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={m.searchLabel}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
        className="inline-flex items-center justify-center min-h-10 min-w-10 rounded-rounded hover:bg-ui-bg-subtle hover:text-ui-fg-base transition-colors duration-180 ease-standard focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg-interactive"
      >
        <MagnifyingGlass />
      </button>

      {isOpen ? (
        <div
          role="search"
          className="absolute right-0 top-full mt-2 z-50 w-[92vw] max-w-[380px] rounded-rounded border border-brand-gold/25 bg-white shadow-lg shadow-[0_12px_40px_-12px_rgba(184,148,79,0.2)] animate-fade-in-top motion-reduce:animate-none overflow-hidden"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              goToResults()
            }}
            className="flex items-center gap-2 p-3 border-b border-ui-border-base"
          >
            <MagnifyingGlass className="text-ui-fg-muted shrink-0" />
            <input
              ref={inputRef}
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
          </form>

          {trimmedQuery ? (
            <div className="max-h-[60vh] overflow-y-auto">
              {results.length > 0 ? (
                <ul>
                  {results.map((p) => {
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
              ) : searched && !loading ? (
                <div className="p-4 text-small-regular text-ui-fg-muted">
                  {m.searchNoResults.replace("{query}", trimmedQuery)}
                </div>
              ) : null}
            </div>
          ) : null}

          {trimmedQuery ? (
            <button
              type="button"
              onClick={goToResults}
              className="block w-full p-3 text-center text-small-semi text-ui-fg-interactive hover:bg-ui-bg-subtle transition-colors duration-180 ease-standard border-t border-ui-border-base"
            >
              {m.searchViewAll.replace("{query}", trimmedQuery)}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
