"use client"

import { useStorefrontMessages } from "@lib/i18n/storefront-i18n-provider"
import {
  Check,
  EllipsisHorizontal,
  Envelope,
  Link as LinkIcon,
  Linkedin,
  Share,
  Telegram,
} from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import {
  SocialFacebook,
  SocialPinterest,
  SocialWhatsapp,
  SocialX,
  SocialZalo,
} from "@modules/common/icons/social"
import { useEffect, useRef, useState } from "react"

type Props = {
  url: string
  title: string
  /** Ảnh đại diện — dùng cho preview khi ghim lên Pinterest (tùy chọn). */
  image?: string
  className?: string
}

const ICON_BUTTON_CLASS =
  "inline-flex items-center justify-center min-h-10 min-w-10 rounded-rounded border border-ui-border-base text-ui-fg-subtle hover:text-ui-fg-base hover:border-ui-border-strong transition-colors duration-180 ease-standard focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg-interactive"

const MENU_ITEM_CLASS =
  "flex items-center gap-3 px-3 py-2.5 min-h-11 text-small-regular text-ui-fg-base hover:bg-ui-bg-subtle transition-colors duration-180 ease-standard"

export default function ShareButtons({ url, title, image, className }: Props) {
  const m = useStorefrontMessages().share
  const [copied, setCopied] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement | null>(null)

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function"

  useEffect(() => {
    if (!moreOpen) {
      return
    }
    const onPointerDown = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMoreOpen(false)
      }
    }
    window.addEventListener("mousedown", onPointerDown)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("mousedown", onPointerDown)
      window.removeEventListener("keydown", onKey)
    }
  }, [moreOpen])

  const shareNative = async () => {
    try {
      await navigator.share({ title, url })
    } catch {
      // Người dùng hủy chia sẻ hoặc trình duyệt từ chối — không cần báo lỗi.
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API không khả dụng (HTTP không an toàn, trình duyệt cũ...) — bỏ qua thầm lặng.
    }
  }

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
  const zaloHref = `https://zalo.me/share?u=${encodedUrl}`
  const telegramHref = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
  const whatsappHref = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`
  const xHref = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
  const pinterestHref = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}${
    image ? `&media=${encodeURIComponent(image)}` : ""
  }`
  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
  const emailHref = `mailto:?subject=${encodedTitle}&body=${encodedUrl}`

  return (
    <div className={clx("flex items-center gap-2", className)}>
      <span className="text-small-regular text-ui-fg-muted">{m.label}</span>

      {canNativeShare ? (
        <button
          type="button"
          onClick={shareNative}
          aria-label={m.native}
          title={m.native}
          className={ICON_BUTTON_CLASS}
        >
          <Share />
        </button>
      ) : null}

      <a
        href={facebookHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={m.facebook}
        title={m.facebook}
        className={ICON_BUTTON_CLASS}
      >
        <SocialFacebook size={18} />
      </a>

      <a
        href={zaloHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={m.zalo}
        title={m.zalo}
        className={ICON_BUTTON_CLASS}
      >
        <SocialZalo size={18} />
      </a>

      <button
        type="button"
        onClick={copyLink}
        aria-label={copied ? m.copied : m.copyLink}
        title={copied ? m.copied : m.copyLink}
        className={ICON_BUTTON_CLASS}
      >
        {copied ? <Check /> : <LinkIcon />}
      </button>

      <div ref={moreRef} className="relative">
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-label={m.more}
          title={m.more}
          aria-expanded={moreOpen}
          className={ICON_BUTTON_CLASS}
        >
          <EllipsisHorizontal />
        </button>

        {moreOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 z-50 w-56 max-w-[calc(100vw-2rem)] rounded-rounded border border-ui-border-base bg-white shadow-lg shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] animate-fade-in-top motion-reduce:animate-none overflow-hidden py-1"
          >
            <a
              href={telegramHref}
              target="_blank"
              rel="noopener noreferrer"
              className={MENU_ITEM_CLASS}
              onClick={() => setMoreOpen(false)}
            >
              <Telegram /> {m.telegram}
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={MENU_ITEM_CLASS}
              onClick={() => setMoreOpen(false)}
            >
              <SocialWhatsapp size={15} /> {m.whatsapp}
            </a>
            <a
              href={xHref}
              target="_blank"
              rel="noopener noreferrer"
              className={MENU_ITEM_CLASS}
              onClick={() => setMoreOpen(false)}
            >
              <SocialX size={15} /> {m.x}
            </a>
            <a
              href={pinterestHref}
              target="_blank"
              rel="noopener noreferrer"
              className={MENU_ITEM_CLASS}
              onClick={() => setMoreOpen(false)}
            >
              <SocialPinterest size={15} /> {m.pinterest}
            </a>
            <a
              href={linkedinHref}
              target="_blank"
              rel="noopener noreferrer"
              className={MENU_ITEM_CLASS}
              onClick={() => setMoreOpen(false)}
            >
              <Linkedin /> {m.linkedin}
            </a>
            <a
              href={emailHref}
              className={MENU_ITEM_CLASS}
              onClick={() => setMoreOpen(false)}
            >
              <Envelope /> {m.email}
            </a>
          </div>
        ) : null}
      </div>
    </div>
  )
}
