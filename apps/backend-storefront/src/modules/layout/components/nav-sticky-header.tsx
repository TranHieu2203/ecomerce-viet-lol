"use client"

import { useLayoutEffect, useState, type ReactNode } from "react"

const SCROLL_THRESHOLD_PX = 12

/**
 * Sticky nav: nền kem khi ở đầu trang; nền trắng khi đã scroll để chữ/vàng đọc rõ trên hero.
 */
export default function NavStickyHeader({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false)

  useLayoutEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD_PX)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header
        className={[
          "relative min-h-14 h-auto py-2 small:h-16 small:py-0 mx-auto backdrop-blur-sm border-b transition-[background-color,box-shadow,border-color] duration-200",
          scrolled
            ? "bg-white border-brand-gold/20 shadow-[0_1px_4px_-1px_rgba(80,60,30,0.1)]"
            : "bg-brand-cream/95 border-brand-gold/35 shadow-[0_1px_0_rgba(184,148,79,0.12)]",
        ].join(" ")}
      >
        {children}
      </header>
    </div>
  )
}
