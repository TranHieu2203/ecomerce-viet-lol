"use client"

import { clx } from "@medusajs/ui"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { SUPPORTED_LOCALES, isAppLocale } from "@lib/util/locales"

export default function LocaleSwitcher({ current }: { current: string }) {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  const first = segments[0] || ""
  const rest = isAppLocale(first) ? segments.slice(1).join("/") : segments.join("/")

  return (
    <div className="flex items-center gap-1 txt-compact-small">
      {SUPPORTED_LOCALES.map((code) => {
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
