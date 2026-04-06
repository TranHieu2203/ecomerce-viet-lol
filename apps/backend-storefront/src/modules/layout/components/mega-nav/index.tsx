"use client"

import type { ResolvedNavGroup } from "@lib/nav/nav-types"
import NavMenuChildLink from "@modules/layout/components/nav-menu-child-link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const CLOSE_DELAY_MS = 200

type MegaNavProps = {
  groups: ResolvedNavGroup[]
  ariaLabel: string
}

export default function MegaNav({ groups, ariaLabel }: MegaNavProps) {
  const rows = useMemo(
    () => groups.filter((g) => g.children.length > 0),
    [groups]
  )

  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRefs = useRef<Map<number, HTMLButtonElement | null>>(new Map())

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  const scheduleClose = useCallback(() => {
    clearCloseTimer()
    closeTimer.current = setTimeout(() => {
      setOpenIndex(null)
      closeTimer.current = null
    }, CLOSE_DELAY_MS)
  }, [clearCloseTimer])

  const openAtIndex = useCallback(
    (index: number) => {
      clearCloseTimer()
      setOpenIndex(index)
    },
    [clearCloseTimer]
  )

  useEffect(() => {
    return () => clearCloseTimer()
  }, [clearCloseTimer])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const prev = openIndex
        setOpenIndex(null)
        if (prev != null) {
          triggerRefs.current.get(prev)?.focus()
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [openIndex])

  if (rows.length === 0) {
    return null
  }

  return (
    <div
      role="navigation"
      aria-label={ariaLabel}
      className="hidden small:block"
    >
      <ul className="flex items-center gap-1 text-ui-fg-subtle" role="menubar">
        {rows.map((group, index) => {
          const isOpen = openIndex === index
          return (
            <li
              key={`mega-nav-${index}-${group.id}`}
              className="relative"
              role="none"
              onMouseEnter={() => openAtIndex(index)}
              onMouseLeave={scheduleClose}
            >
              <div className="flex flex-col items-stretch">
                <button
                  type="button"
                  ref={(el) => {
                    triggerRefs.current.set(index, el)
                  }}
                  className="flex items-center min-h-11 px-2 rounded-rounded hover:text-ui-fg-base whitespace-nowrap text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg-interactive"
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  onClick={() =>
                    setOpenIndex((cur) => (cur === index ? null : index))
                  }
                >
                  {group.label}
                </button>
                {isOpen ? (
                  <div
                    className="absolute left-0 top-full pt-1 z-50 min-w-[12rem]"
                    role="menu"
                    onMouseEnter={clearCloseTimer}
                    onMouseLeave={scheduleClose}
                  >
                    <ul className="py-2 px-1 rounded-rounded border border-ui-border-base bg-white shadow-lg">
                      {group.children.map((child, idx) => (
                        <li key={`${index}-${group.id}-${idx}`} role="none">
                          <NavMenuChildLink
                            child={child}
                            role="menuitem"
                            className="block px-3 py-2.5 min-h-11 text-small-regular hover:text-ui-fg-base hover:bg-ui-bg-subtle rounded-rounded"
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
