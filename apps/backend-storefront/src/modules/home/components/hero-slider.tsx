"use client"

import { useStorefrontMessages } from "@lib/i18n/storefront-i18n-provider"
import { ArrowLeftMini, ArrowRightMini } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import type { BannerSlideResolved } from "@lib/data/cms"
import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

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
    // eslint-disable-next-line deprecation/deprecation
    m.addListener(onChange)
    // eslint-disable-next-line deprecation/deprecation
    return () => m.removeListener(onChange)
  }, [])
  return reduced
}

export default function HeroSlider({
  slides,
  locale,
}: {
  slides: BannerSlideResolved[]
  locale: string
}) {
  const h = useStorefrontMessages().home
  const [i, setI] = useState(0)
  const safe = slides.length ? i % slides.length : 0
  const slide = slides[safe]
  const reducedMotion = usePrefersReducedMotion()

  const next = useCallback(() => {
    if (!slides.length) {
      return
    }
    setI((v) => (v + 1) % slides.length)
  }, [slides.length])

  const prev = useCallback(() => {
    if (!slides.length) {
      return
    }
    setI((v) => (v - 1 + slides.length) % slides.length)
  }, [slides.length])

  useEffect(() => {
    if (slides.length < 2 || reducedMotion) {
      return
    }
    const t = setInterval(next, 6500)
    return () => clearInterval(t)
  }, [slides.length, next, reducedMotion])

  if (!slides.length || !slide) {
    return (
      <section
        className="w-full border-b border-ui-border-base bg-ui-bg-subtle min-h-[40vh] flex items-center justify-center"
        aria-label={h.hero}
      >
        <p className="text-ui-fg-muted text-small-regular">
          {h.heroEmpty}
        </p>
      </section>
    )
  }

  const srcDesktop = slide.image?.desktop || slide.image?.mobile || ""
  const srcMobile = slide.image?.mobile || slide.image?.desktop || ""
  const hasDistinctMobile =
    Boolean(srcMobile && srcDesktop && srcMobile !== srcDesktop)
  const unoptimized =
    srcDesktop.includes("localhost") || srcMobile.includes("localhost")

  return (
    <section
      className="relative w-full border-b border-ui-border-base bg-ui-bg-subtle overflow-hidden"
      aria-roledescription="carousel"
      aria-label={h.heroBanners}
    >
      <div className="relative w-full aspect-[4/5] xsmall:aspect-[3/4] small:aspect-[16/9] max-h-[min(85vh,920px)] small:max-h-[75vh]">
        {(() => {
          // Render đúng 2 layer để fade mượt nhưng không load tất cả ảnh.
          const prevIdx = slides.length > 1 ? (safe - 1 + slides.length) % slides.length : safe
          const order = prevIdx === safe ? [safe] : [prevIdx, safe]
          return order.map((idx) => {
            const s = slides[idx]
            const isActive = idx === safe
            const sd = s.image?.desktop || s.image?.mobile || ""
            const sm = s.image?.mobile || s.image?.desktop || ""
            const distinct = Boolean(sm && sd && sm !== sd)
            const alt = s.alt || s.title || h.bannerImageAlt
            const layerClass =
              "absolute inset-0 transition-opacity duration-240 ease-friendly motion-reduce:transition-none"
            const opacity = isActive ? "opacity-100" : "opacity-0"
            return (
              <div
                key={s.id ?? `${idx}-${sd}-${sm}`}
                className={`${layerClass} ${opacity}`}
                aria-hidden={!isActive}
              >
                {sd && distinct ? (
                  <>
                    <Image
                      src={sm}
                      alt={alt}
                      fill
                      priority={isActive}
                      sizes="100vw"
                      className="object-cover small:hidden"
                      unoptimized={unoptimized}
                    />
                    <Image
                      src={sd}
                      alt={alt}
                      fill
                      priority={isActive}
                      sizes="(max-width: 1023px) 100vw, min(1280px, 100vw)"
                      className="object-cover hidden small:block"
                      unoptimized={unoptimized}
                    />
                  </>
                ) : sd ? (
                  <Image
                    src={sd}
                    alt={alt}
                    fill
                    priority={isActive}
                    sizes="100vw"
                    className="object-cover"
                    unoptimized={unoptimized}
                  />
                ) : null}
              </div>
            )
          })
        })()}
      </div>
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-black/20 to-transparent small:from-black/50">
        <div className="content-container pb-6 pt-4 xsmall:pb-8 xsmall:pt-5 small:pb-10 small:pt-6 text-white flex flex-col gap-2 xsmall:gap-3 max-w-2xl">
          <h1 className="text-2xl xsmall:text-3xl small:text-4xl font-semibold drop-shadow-md leading-tight">
            {slide.title}
          </h1>
          {slide.subtitle ? (
            <p className="text-sm xsmall:text-base small:text-lg opacity-95 drop-shadow max-w-prose">
              {slide.subtitle}
            </p>
          ) : null}
          {slide.target_url ? (
            slide.target_url.startsWith("http://") ||
            slide.target_url.startsWith("https://") ? (
              <a
                href={slide.target_url}
                target="_blank"
                rel="noopener noreferrer"
                className={clx(
                  "inline-flex items-center justify-center rounded-full bg-brand-gold text-white px-6 py-3 w-fit text-small-regular font-medium",
                  "min-h-11 shadow-sm hover:bg-brand-gold-hover transition-colors",
                  "ring-1 ring-brand-accent/25"
                )}
              >
                {slide.cta_label || h.ctaFallback}
              </a>
            ) : (
              <Link
                href={`/${locale}${slide.target_url.startsWith("/") ? slide.target_url : `/${slide.target_url}`}`}
                className={clx(
                  "inline-flex items-center justify-center rounded-full bg-brand-gold text-white px-6 py-3 w-fit text-small-regular font-medium",
                  "min-h-11 shadow-sm hover:bg-brand-gold-hover transition-colors",
                  "ring-1 ring-brand-accent/25"
                )}
              >
                {slide.cta_label || h.ctaFallback}
              </Link>
            )
          ) : null}
        </div>
      </div>
      {slides.length > 1 ? (
        <>
          <button
            type="button"
            aria-label={h.heroPrev}
            onClick={prev}
            className="absolute left-2 small:left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow hover:bg-white min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeftMini />
          </button>
          <button
            type="button"
            aria-label={h.heroNext}
            onClick={next}
            className="absolute right-2 small:right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow hover:bg-white min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowRightMini />
          </button>
          <div
            className="absolute bottom-3 left-0 right-0 flex justify-center gap-2"
            role="tablist"
            aria-label={h.heroSlides}
          >
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={idx === safe}
                aria-label={h.heroGoToSlide.replace(
                  "{n}",
                  String(idx + 1)
                )}
                className={clx(
                  "p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full",
                  "-m-2"
                )}
                onClick={() => setI(idx)}
              >
                <span
                  className={clx(
                    "block rounded-full h-2.5 w-2.5 transition-transform",
                    idx === safe ? "bg-white scale-125" : "bg-white/50"
                  )}
                />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </section>
  )
}
