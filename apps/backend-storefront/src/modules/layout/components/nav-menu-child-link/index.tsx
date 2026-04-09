"use client"

import type { ResolvedNavChild } from "@lib/nav/nav-types"
import { isExternalOrAbsoluteHref } from "@lib/nav/is-external-href"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function NavMenuChildLink({
  child,
  className,
  onNavigate,
  role,
}: {
  child: ResolvedNavChild
  className?: string
  onNavigate?: () => void
  role?: string
}) {
  if (child.type === "link") {
    if (isExternalOrAbsoluteHref(child.href)) {
      return (
        <a
          href={child.href}
          className={className}
          rel="noopener noreferrer"
          role={role}
          target="_blank"
          onClick={onNavigate}
        >
          {child.label}
        </a>
      )
    }
    const h = child.href.trim()
    if (h.startsWith("/")) {
      return (
        <LocalizedClientLink
          href={h}
          className={className}
          role={role}
          onClick={onNavigate}
        >
          {child.label}
        </LocalizedClientLink>
      )
    }
    return (
      <a
        href={child.href}
        className={className}
        role={role}
        onClick={onNavigate}
      >
        {child.label}
      </a>
    )
  }

  return (
    <LocalizedClientLink
      href={child.href}
      className={className}
      role={role}
      onClick={onNavigate}
    >
      {child.label}
    </LocalizedClientLink>
  )
}
