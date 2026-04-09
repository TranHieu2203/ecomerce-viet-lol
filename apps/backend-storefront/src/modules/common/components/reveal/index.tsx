"use client"

import { clx } from "@medusajs/ui"
import { useEffect, useMemo, useRef, useState } from "react"

export type RevealVariant = "fade" | "up" | "down" | "left" | "right"

type Props = {
  children: React.ReactNode
  variant?: RevealVariant
  /** Default: true (reveal một lần để tránh nhấp nháy khi scroll). */
  once?: boolean
  /** Delay nhỏ để tạo stagger; nên <= 300ms. */
  delayMs?: number
  /**
   * Tránh “blank until hydration” cho content near-fold (đặc biệt above-the-fold).
   * Khi true, SSR sẽ render ở trạng thái đã reveal.
   */
  initialInView?: boolean
  className?: string
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return
    }
    const m = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onChange = () => setReduced(Boolean(m.matches))
    onChange()
    if (typeof m.addEventListener === "function") {
      m.addEventListener("change", onChange)
      return () => m.removeEventListener("change", onChange)
    }
    // Safari fallback
    m.addListener(onChange)
    return () => m.removeListener(onChange)
  }, [])
  return reduced
}

function variantHiddenClass(variant: RevealVariant) {
  switch (variant) {
    case "left":
      return "reveal-left"
    case "right":
      return "reveal-right"
    case "down":
      return "reveal-down"
    case "up":
      return "reveal-up"
    case "fade":
    default:
      return "reveal-fade"
  }
}

export default function Reveal({
  children,
  variant = "up",
  once = true,
  delayMs = 0,
  initialInView = false,
  className,
}: Props) {
  const reducedMotion = usePrefersReducedMotion()
  const ref = useRef<HTMLDivElement | null>(null)
  const [inView, setInView] = useState<boolean>(initialInView)

  const style = useMemo(() => {
    if (reducedMotion) {
      return undefined
    }
    const d = Number.isFinite(delayMs) ? Math.max(0, Math.floor(delayMs)) : 0
    return d > 0 ? ({ transitionDelay: `${d}ms` } as const) : undefined
  }, [delayMs, reducedMotion])

  useEffect(() => {
    if (reducedMotion) {
      setInView(true)
      return
    }
    const el = ref.current
    if (!el) {
      return
    }
    if (typeof window === "undefined" || typeof window.IntersectionObserver !== "function") {
      setInView(true)
      return
    }

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) {
          return
        }
        if (entry.isIntersecting) {
          setInView(true)
          if (once) {
            obs.unobserve(el)
            obs.disconnect()
          }
        } else if (!once) {
          setInView(false)
        }
      },
      {
        root: null,
        // Reveal sớm một chút để cảm giác “mượt” khi scroll.
        rootMargin: "80px 0px",
        threshold: 0.12,
      }
    )

    obs.observe(el)
    return () => {
      try {
        obs.unobserve(el)
      } catch {}
      obs.disconnect()
    }
  }, [once, reducedMotion])

  useEffect(() => {
    const el = ref.current as (HTMLDivElement & { inert?: boolean }) | null
    if (!el) {
      return
    }
    // Prevent focus/click on visually hidden content.
    if (!inView && !reducedMotion) {
      el.inert = true
    } else {
      el.inert = false
    }
  }, [inView, reducedMotion])

  return (
    <div
      ref={ref}
      style={style}
      aria-hidden={!inView && !reducedMotion}
      className={clx(
        "reveal-transition",
        !inView && !reducedMotion && "pointer-events-none",
        !inView && !reducedMotion && "will-change-transform",
        inView ? "reveal-in" : variantHiddenClass(variant),
        className
      )}
    >
      {children}
    </div>
  )
}

