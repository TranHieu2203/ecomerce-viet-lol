"use client"

import { XMark } from "@medusajs/icons"
import { useEffect, useMemo, useState } from "react"

export type AnnouncementBarPayload = {
  enabled: boolean
  text: { vi: string; en: string }
  link_url: string | null
  starts_at: string | null
  ends_at: string | null
}

function inWindow(a: AnnouncementBarPayload): boolean {
  const now = Date.now()
  if (a.starts_at) {
    const t = Date.parse(a.starts_at)
    if (!Number.isNaN(t) && now < t) {
      return false
    }
  }
  if (a.ends_at) {
    const t = Date.parse(a.ends_at)
    if (!Number.isNaN(t) && now > t) {
      return false
    }
  }
  return true
}

function dismissSignature(a: AnnouncementBarPayload): string {
  return `${a.text.vi}\u0000${a.text.en}\u0000${a.link_url ?? ""}`
}

type Props = {
  locale: string
  announcement: AnnouncementBarPayload | null
}

export default function AnnouncementBar({ locale, announcement }: Props) {
  const [dismissed, setDismissed] = useState(false)

  const sig = useMemo(
    () => (announcement ? dismissSignature(announcement) : ""),
    [announcement]
  )

  useEffect(() => {
    if (typeof window === "undefined" || !sig) {
      return
    }
    try {
      const prev = window.localStorage.getItem("cms_announcement_dismissed_sig")
      if (prev === sig) {
        setDismissed(true)
      }
    } catch {
      /* ignore */
    }
  }, [sig])

  if (!announcement || !announcement.enabled || dismissed) {
    return null
  }

  if (!inWindow(announcement)) {
    return null
  }

  const primary = locale === "en" ? "en" : "vi"
  const text =
    primary === "en"
      ? announcement.text.en || announcement.text.vi
      : announcement.text.vi || announcement.text.en

  if (!text.trim()) {
    return null
  }

  const dismiss = () => {
    try {
      window.localStorage.setItem("cms_announcement_dismissed_sig", sig)
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  const href = announcement.link_url?.trim() || null
  const isExternalHref =
    typeof href === "string" && /^https?:\/\//i.test(href)

  const inner = href ? (
    <a
      href={href}
      className="underline underline-offset-2 hover:opacity-90"
      {...(isExternalHref
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {text}
    </a>
  ) : (
    <span>{text}</span>
  )

  return (
    <div
      className="w-full border-b border-ui-border-base bg-ui-bg-subtle text-center text-small-regular text-ui-fg-base py-2.5 px-10 relative"
      role="region"
      aria-label="Announcement"
    >
      <div className="max-w-4xl mx-auto">{inner}</div>
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-ui-bg-base"
        aria-label="Close announcement"
      >
        <XMark className="text-ui-fg-muted" />
      </button>
    </div>
  )
}
