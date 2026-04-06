import { Suspense } from "react"

import { getNavMenuPublic } from "@lib/data/nav-menu"
import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import { applyDesktopNavFr24 } from "@lib/nav/desktop-nav-fr24"
import { getCmsSettingsPublic, resolveCmsSiteTitle } from "@lib/data/cms"
import { isSvgAssetUrl } from "@lib/util/cms-assets"
import { getLocale } from "@lib/data/locale-actions"
import { listLocales } from "@lib/data/locales"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import LocaleSwitcher from "@modules/layout/components/locale-switcher"
import MegaNav from "@modules/layout/components/mega-nav"
import SideMenu from "@modules/layout/components/side-menu"
import Image from "next/image"

export default async function Nav({
  countryCode,
}: {
  countryCode: string
}) {
  const m = getStorefrontMessages(countryCode)
  const [regions, locales, currentLocale, cms, navMenu] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
    getCmsSettingsPublic(),
    getNavMenuPublic(countryCode),
  ])

  const headerTitle = resolveCmsSiteTitle(countryCode, cms, m)

  const logoSrc = cms.logo_url
  const logoIsSvg = isSvgAssetUrl(logoSrc)

  const desktopNavGroups = applyDesktopNavFr24(navMenu.items, m.nav.viewMore)

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative min-h-14 h-auto py-2 small:h-16 small:py-0 mx-auto border-b border-ui-border-base bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 shadow-[0_1px_0_0_rgba(15,23,42,0.06)] duration-200">
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex items-center justify-between w-full min-h-[3.25rem] small:min-h-0 small:h-full text-small-regular gap-2">
          <div className="flex-1 basis-0 h-full flex items-center gap-4">
            <div className="h-full">
              <SideMenu
                regions={regions}
                locales={locales}
                currentLocale={currentLocale}
                navItems={navMenu.items}
                brandName={headerTitle}
              />
            </div>
            <MegaNav groups={desktopNavGroups} ariaLabel={m.nav.collectionsAria} />
          </div>

          <div className="flex items-center h-full min-w-0 justify-center px-1 shrink">
            <LocalizedClientLink
              href="/"
              className="txt-compact-xlarge-plus hover:text-ui-fg-base flex items-center justify-center gap-1.5 xsmall:gap-2 min-w-0 max-w-[min(100%,12rem)] xsmall:max-w-[min(100%,16rem)] small:max-w-[min(100%,20rem)]"
              data-testid="nav-store-link"
            >
              {logoSrc && !logoIsSvg ? (
                <Image
                  src={logoSrc}
                  alt={headerTitle}
                  width={160}
                  height={40}
                  className="h-7 w-auto xsmall:h-8 max-w-[120px] xsmall:max-w-[160px] object-contain object-center flex-shrink-0"
                  unoptimized={logoSrc.includes("localhost")}
                />
              ) : null}
              {logoSrc && logoIsSvg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoSrc}
                  alt={headerTitle}
                  className="h-7 w-auto xsmall:h-8 max-w-[120px] xsmall:max-w-[160px] object-contain object-center flex-shrink-0"
                />
              ) : null}
              {!logoSrc ? (
                <span className="truncate text-center uppercase tracking-wide text-sm xsmall:text-base font-semibold text-ui-fg-base">
                  {headerTitle}
                </span>
              ) : null}
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-2 xsmall:gap-x-4 small:flex h-full flex-1 basis-0 justify-end min-w-0">
            <LocaleSwitcher current={countryCode} />
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <LocalizedClientLink
                className="hover:text-ui-fg-base"
                href="/account"
                data-testid="nav-account-link"
              >
                {m.nav.account}
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-ui-fg-base flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  {m.nav.cartFallback} (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
