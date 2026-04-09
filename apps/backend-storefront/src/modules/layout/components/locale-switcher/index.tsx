"use client"

import { clx } from "@medusajs/ui"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { ALL_APP_LOCALE_CODES, isAppLocale } from "@lib/util/locales"
import { resolveLocaleFlag } from "@modules/common/icons/locale-flags"

type Props = {
  current: string
  /** Locale được CMS bật; mặc định hiển thị mọi mã app hỗ trợ. */
  enabledLocales?: string[]
}

export default function LocaleSwitcher({ current, enabledLocales }: Props) {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  const first = segments[0] || ""
  const rest = isAppLocale(first) ? segments.slice(1).join("/") : segments.join("/")

  const filtered = enabledLocales?.length
    ? ALL_APP_LOCALE_CODES.filter((c) => enabledLocales.includes(c))
    : null
  const codes = filtered?.length ? filtered : [...ALL_APP_LOCALE_CODES]

  return (
    <div className="inline-flex items-center gap-px rounded-full border border-brand-gold/22 bg-white/75 p-0.5 shadow-[0_1px_2px_rgba(184,148,79,0.07)] backdrop-blur-sm">
      {codes.map((code) => {
        const href = rest ? `/${code}/${rest}` : `/${code}`
        const active = current === code
        const Flag = resolveLocaleFlag(code)
        return (
          <Link
            key={code}
            href={href}
            className={clx(
              "uppercase rounded-full justify-center inline-flex items-center gap-1 px-2 py-0.5 text-[10px] 2xsmall:text-[11px] font-medium tracking-[0.04em] transition-[color,background-color,box-shadow] duration-200",
              active
                ? "bg-white text-brand-gold-hover ring-1 ring-brand-gold/30 shadow-[0_1px_2px_rgba(184,148,79,0.12)]"
                : "text-ui-fg-muted hover:text-ui-fg-subtle hover:bg-brand-gold-muted/45"
            )}
            hrefLang={code}
          >
            <span className="shrink-0 inline-flex opacity-[0.92]" aria-hidden>
              <Flag size={12} />
            </span>
            <span>{code}</span>
          </Link>
        )
      })}
    </div>
  )
}
