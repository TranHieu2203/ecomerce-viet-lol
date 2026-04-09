"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import { ArrowRightMini, BarsThree, XMark } from "@medusajs/icons"
import { Text, clx, useToggleState } from "@medusajs/ui"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import type { ResolvedNavGroup } from "@lib/nav/nav-types"
import { Fragment, useEffect, useState } from "react"
import { createPortal } from "react-dom"

import { useStorefrontMessages } from "@lib/i18n/storefront-i18n-provider"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import NavMenuChildLink from "@modules/layout/components/nav-menu-child-link"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"
import { HttpTypes } from "@medusajs/types"
import { Locale } from "@lib/data/locales"

const SIDE_LINKS: { key: "home" | "store" | "account" | "cart"; href: string }[] =
  [
    { key: "home", href: "/" },
    { key: "store", href: "/store" },
    { key: "account", href: "/account" },
    { key: "cart", href: "/cart" },
  ]

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
  /** Cây menu CMS (cùng payload với desktop MegaNav). */
  navItems: ResolvedNavGroup[]
  /** Tên thương hiệu (CMS / env), dùng footer menu. */
  brandName?: string
}

const SideMenu = ({
  regions,
  locales,
  currentLocale,
  navItems,
  brandName = "",
}: SideMenuProps) => {
  const m = useStorefrontMessages()
  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => (
            <>
              <div className="relative flex h-full">
                <Popover.Button
                  data-testid="nav-menu-button"
                  className="relative min-h-11 min-w-11 flex items-center justify-center rounded-full bg-brand-gold-muted/90 ring-1 ring-inset ring-brand-gold/45 text-brand-gold-hover transition-all duration-200 focus:outline-none hover:bg-brand-gold/20 focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream"
                  aria-label={m.sideMenu.button}
                >
                  <BarsThree className="w-[22px] h-[22px]" aria-hidden />
                  <span className="sr-only">{m.sideMenu.button}</span>
                </Popover.Button>
              </div>

              {mounted &&
                open &&
                createPortal(
                  <div
                    className="fixed inset-0 z-[200] bg-[rgba(20,17,13,0.45)]"
                    onClick={close}
                    data-testid="side-menu-backdrop"
                    aria-hidden
                  />,
                  document.body
                )}

              {/* Headless UI v2: Transition bọc ngoài → PopoverPanel cần `static` để không bị ẩn nội dung */}
              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 -translate-x-2"
                enterTo="opacity-100 translate-x-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-x-0"
                leaveTo="opacity-0 -translate-x-2"
              >
                <PopoverPanel
                  static
                  portal
                  className="flex flex-col fixed top-2 left-2 bottom-2 z-[210] w-[min(100vw-1rem,22rem)] max-h-[calc(100dvh-1rem)] min-h-0 text-sm text-ui-fg-base rounded-rounded overflow-hidden shadow-xl shadow-[0_12px_40px_-12px_rgba(184,148,79,0.35)] border border-brand-gold/35 bg-brand-cream outline-none"
                >
                  <div
                    data-testid="nav-menu-popup"
                    className="grid grid-rows-[auto_minmax(0,1fr)_auto] h-full min-h-0 max-h-[calc(100dvh-1rem)] bg-gradient-to-b from-white to-brand-cream/90 rounded-rounded p-5 pt-3 border-t-[3px] border-brand-gold"
                  >
                    <div className="flex justify-end shrink-0" id="xmark">
                      <button
                        type="button"
                        data-testid="close-menu-button"
                        className="min-h-11 min-w-11 flex items-center justify-center rounded-full text-ui-fg-base hover:bg-brand-gold-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                        onClick={close}
                        aria-label={m.sideMenu.closeMenu}
                      >
                        <XMark />
                      </button>
                    </div>
                    <div className="flex flex-col gap-6 min-h-0 overflow-y-auto overflow-x-hidden py-2 -mx-1 px-1">
                      {navItems.length > 0 ? (
                        <AccordionPrimitive.Root
                          type="multiple"
                          className="w-full flex flex-col gap-2"
                        >
                          {navItems.map((group, index) => {
                            const onlyChild =
                              group.children.length === 1
                                ? group.children[0]
                                : null

                            if (onlyChild?.href) {
                              return (
                                <div
                                  key={`nav-drawer-${index}-${group.id}`}
                                  className="border-b border-brand-gold/20 pb-2 last:border-0"
                                >
                                  <LocalizedClientLink
                                    href={onlyChild.href}
                                    className="flex w-full min-h-11 items-center justify-between gap-2 py-2 px-2 -mx-2 text-left text-xl leading-tight font-medium text-ui-fg-base hover:text-brand-gold-hover hover:bg-brand-gold-muted/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded-soft"
                                    onClick={close}
                                  >
                                    <span>{group.label}</span>
                                    <span className="text-brand-gold text-sm shrink-0">
                                      →
                                    </span>
                                  </LocalizedClientLink>
                                </div>
                              )
                            }

                            return (
                              <AccordionPrimitive.Item
                                key={`nav-drawer-${index}-${group.id}`}
                                value={`nav-acc-${index}`}
                                className="border-b border-brand-gold/20 pb-2 last:border-0"
                              >
                                <AccordionPrimitive.Header>
                                  <AccordionPrimitive.Trigger className="flex w-full min-h-11 items-center justify-between gap-2 py-2 px-2 -mx-2 text-left text-xl font-semibold text-ui-fg-base leading-tight hover:text-brand-gold-hover hover:bg-brand-gold-muted/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded-soft">
                                    <span>{group.label}</span>
                                    <span className="text-brand-gold text-sm shrink-0">
                                      ▾
                                    </span>
                                  </AccordionPrimitive.Trigger>
                                </AccordionPrimitive.Header>
                                <AccordionPrimitive.Content className="overflow-hidden radix-state-closed:animate-accordion-close radix-state-open:animate-accordion-open radix-state-closed:pointer-events-none">
                                  <ul className="mt-2 flex flex-col gap-1 pl-1">
                                    {group.children.map((child, idx) => (
                                      <li key={`${index}-${group.id}-${idx}`}>
                                        <NavMenuChildLink
                                          child={child}
                                          className="block min-h-11 py-2 px-2 -mx-1 text-base leading-snug text-ui-fg-base rounded-soft hover:text-brand-gold-hover hover:bg-brand-gold-muted/60"
                                          onNavigate={close}
                                        />
                                      </li>
                                    ))}
                                  </ul>
                                </AccordionPrimitive.Content>
                              </AccordionPrimitive.Item>
                            )
                          })}
                        </AccordionPrimitive.Root>
                      ) : null}
                      <ul className="flex flex-col gap-2 items-start justify-start">
                        {SIDE_LINKS.map(({ key, href }) => {
                          const label = m.sideMenu[key]
                          return (
                            <li key={key}>
                              <LocalizedClientLink
                                href={href}
                                className="block min-h-11 text-xl font-medium leading-10 text-ui-fg-base py-1 px-2 -mx-2 rounded-soft hover:text-brand-gold-hover hover:bg-brand-gold-muted/70"
                                onClick={close}
                                data-testid={`${key}-link`}
                              >
                                {label}
                              </LocalizedClientLink>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                    <div className="flex flex-col gap-y-4 pt-4 border-t border-brand-gold/25 shrink-0">
                      {!!locales?.length && (
                        <div
                          className="flex justify-between min-h-11 items-center gap-2 rounded-soft px-2 py-1 -mx-2 hover:bg-brand-gold-muted/50"
                          onMouseEnter={languageToggleState.open}
                          onMouseLeave={languageToggleState.close}
                        >
                          <LanguageSelect
                            toggleState={languageToggleState}
                            locales={locales}
                            currentLocale={currentLocale}
                          />
                          <ArrowRightMini
                            className={clx(
                              "shrink-0 text-brand-gold transition-transform duration-150",
                              languageToggleState.state ? "-rotate-90" : ""
                            )}
                          />
                        </div>
                      )}
                      <div
                        className="flex justify-between min-h-11 items-center gap-2 rounded-soft px-2 py-1 -mx-2 hover:bg-brand-gold-muted/50"
                        onMouseEnter={countryToggleState.open}
                        onMouseLeave={countryToggleState.close}
                      >
                        {regions && (
                          <CountrySelect
                            toggleState={countryToggleState}
                            regions={regions}
                          />
                        )}
                        <ArrowRightMini
                          className={clx(
                            "shrink-0 text-brand-gold transition-transform duration-150",
                            countryToggleState.state ? "-rotate-90" : ""
                          )}
                        />
                      </div>
                      <Text className="flex justify-between txt-compact-small text-ui-fg-muted">
                        © {new Date().getFullYear()} {brandName}
                      </Text>
                    </div>
                  </div>
                </PopoverPanel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu
