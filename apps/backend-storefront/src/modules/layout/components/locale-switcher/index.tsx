"use client"

import { clx } from "@medusajs/ui"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { ALL_APP_LOCALE_CODES, isAppLocale } from "@lib/util/locales"

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
    <div className="flex items-center gap-1 txt-compact-small">
      {codes.map((code) => {
        const href = rest ? `/${code}/${rest}` : `/${code}`
        const active = current === code
        return (
          <Link
            key={code}
            href={href}
            className={clx(
              "uppercase px-2 2xsmall:px-3 py-2 rounded-rounded min-h-10 min-w-[2.25rem] justify-center inline-flex items-center text-[11px] 2xsmall:text-xs font-medium",
              active ? "bg-ui-bg-base text-ui-fg-on-color" : "hover:bg-ui-bg-subtle"
            )}
            hrefLang={code}
          >
            {code}
          </Link>
        )
      })}
    </div>
  )
}
