"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import { ArrowRightMini, XMark } from "@medusajs/icons"
import { Text, clx, useToggleState } from "@medusajs/ui"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import type { ResolvedNavGroup } from "@lib/nav/nav-types"
import { Fragment } from "react"

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

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => (
            <>
              <div className="relative flex h-full">
                <Popover.Button
                  data-testid="nav-menu-button"
                  className="relative min-h-11 min-w-11 flex items-center justify-center px-2 -mx-2 transition-all ease-out duration-200 focus:outline-none hover:text-ui-fg-base focus-visible:ring-2 focus-visible:ring-ui-fg-interactive rounded-rounded"
                >
                  {m.sideMenu.button}
                </Popover.Button>
              </div>

              {open && (
                <div
                  className="fixed inset-0 z-[50] bg-black/0 pointer-events-auto"
                  onClick={close}
                  data-testid="side-menu-backdrop"
                />
              )}

              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="opacity-0"
                enterTo="opacity-100 backdrop-blur-2xl"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 backdrop-blur-2xl"
                leaveTo="opacity-0"
              >
                <PopoverPanel className="flex flex-col absolute w-[calc(100vw-1rem)] max-w-md small:w-1/3 2xl:w-1/4 small:max-w-none small:min-w-min h-[calc(100dvh-1rem)] max-h-[calc(100vh-1rem)] z-[51] left-0 right-auto text-sm text-ui-fg-on-color m-2 rounded-rounded overflow-hidden shadow-xl border border-white/10 backdrop-blur-2xl">
                  <div
                    data-testid="nav-menu-popup"
                    className="flex flex-col h-full bg-[rgba(3,7,18,0.5)] rounded-rounded justify-between p-6"
                  >
                    <div className="flex justify-end" id="xmark">
                      <button
                        type="button"
                        data-testid="close-menu-button"
                        className="min-h-11 min-w-11 flex items-center justify-center rounded-rounded hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                        onClick={close}
                        aria-label={m.sideMenu.closeMenu}
                      >
                        <XMark />
                      </button>
                    </div>
                    <div className="flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto">
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
                                  className="border-b border-white/10 pb-2 last:border-0"
                                >
                                  <LocalizedClientLink
                                    href={onlyChild.href}
                                    className="flex w-full min-h-11 items-center justify-between gap-2 py-2 text-left text-2xl leading-tight hover:text-ui-fg-disabled focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 rounded-rounded"
                                    onClick={close}
                                  >
                                    <span>{group.label}</span>
                                    <span className="text-ui-fg-muted text-sm shrink-0">
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
                                className="border-b border-white/10 pb-2 last:border-0"
                              >
                                <AccordionPrimitive.Header>
                                  <AccordionPrimitive.Trigger className="flex w-full min-h-11 items-center justify-between gap-2 py-2 text-left text-2xl leading-tight hover:text-ui-fg-disabled focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 rounded-rounded">
                                    <span>{group.label}</span>
                                    <span className="text-ui-fg-muted text-sm shrink-0">
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
                                          className="block min-h-11 py-2 text-lg leading-snug hover:text-ui-fg-disabled"
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
                                className="block min-h-11 text-2xl leading-10 hover:text-ui-fg-disabled py-1"
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
                    <div className="flex flex-col gap-y-6 pt-4">
                      {!!locales?.length && (
                        <div
                          className="flex justify-between min-h-11 items-center"
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
                              "transition-transform duration-150",
                              languageToggleState.state ? "-rotate-90" : ""
                            )}
                          />
                        </div>
                      )}
                      <div
                        className="flex justify-between min-h-11 items-center"
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
                            "transition-transform duration-150",
                            countryToggleState.state ? "-rotate-90" : ""
                          )}
                        />
                      </div>
                      <Text className="flex justify-between txt-compact-small">
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
