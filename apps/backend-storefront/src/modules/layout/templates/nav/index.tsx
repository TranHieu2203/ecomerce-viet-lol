import { Suspense } from "react"

import { getNavMenuPublic } from "@lib/data/nav-menu"
import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import { applyDesktopNavFr24 } from "@lib/nav/desktop-nav-fr24"
import {
  getCmsSettingsPublic,
  resolveCmsSiteTitle,
  resolveCmsSocialLinks,
} from "@lib/data/cms"
import { isSvgAssetUrl } from "@lib/util/cms-assets"
import { listLocales, type Locale } from "@lib/data/locales"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { resolveSocialIcon } from "@modules/common/icons/social"
import CartButton from "@modules/layout/components/cart-button"
import LocaleSwitcher from "@modules/layout/components/locale-switcher"
import MegaNav from "@modules/layout/components/mega-nav"
import NavStickyHeader from "@modules/layout/components/nav-sticky-header"
import SideMenu from "@modules/layout/components/side-menu"
import Image from "next/image"

export default async function Nav({
  countryCode,
}: {
  countryCode: string
}) {
  const m = getStorefrontMessages(countryCode)
  const [regions, locales, cms, navMenu] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getCmsSettingsPublic(),
    getNavMenuPublic(countryCode),
  ])

  const headerTitle = resolveCmsSiteTitle(countryCode, cms, m)
  const socialLinks = resolveCmsSocialLinks(
    cms,
    countryCode,
    m.footer.socialFallback
  )

  const enabledCmsLocales = Array.isArray(cms.enabled_locales)
    ? (cms.enabled_locales as unknown[]).filter(
        (x): x is string => typeof x === "string" && x.length > 0
      )
    : []
  const displayNames = new Intl.DisplayNames([countryCode], { type: "language" })
  const localesForMenu: Locale[] =
    enabledCmsLocales.length > 0
      ? enabledCmsLocales.map((code) => ({
          code,
          name: displayNames.of(code) ?? code.toUpperCase(),
        }))
      : (locales ?? [])

  const logoSrc = cms.logo_url
  const logoIsSvg = isSvgAssetUrl(logoSrc)

  const desktopNavGroups = applyDesktopNavFr24(navMenu.items, m.nav.viewMore)

  return (
    <NavStickyHeader>
      <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex items-center justify-between w-full min-h-[3.25rem] small:min-h-0 small:h-full text-small-regular gap-2">
          <div className="flex items-center gap-2 xsmall:gap-3 min-w-0 flex-1">
            <LocalizedClientLink
              href="/"
              className="txt-compact-xlarge-plus hover:text-ui-fg-base flex items-center justify-start shrink-0"
              data-testid="nav-store-link"
            >
              {logoSrc && !logoIsSvg ? (
                <Image
                  src={logoSrc}
                  alt={headerTitle}
                  width={180}
                  height={48}
                  className="h-8 w-auto xsmall:h-9 max-w-[140px] xsmall:max-w-[180px] object-contain object-left flex-shrink-0 drop-shadow-[0_1px_2px_rgba(184,148,79,0.35)]"
                  unoptimized={logoSrc.includes("localhost")}
                />
              ) : null}
              {logoSrc && logoIsSvg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoSrc}
                  alt={headerTitle}
                  className="h-8 w-auto xsmall:h-9 max-w-[140px] xsmall:max-w-[180px] object-contain object-left flex-shrink-0"
                />
              ) : null}
              {!logoSrc ? (
                <span className="truncate text-left uppercase tracking-wide text-sm xsmall:text-base font-semibold text-ui-fg-base max-w-[10rem]">
                  {headerTitle}
                </span>
              ) : null}
            </LocalizedClientLink>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="h-full shrink-0 block small:hidden">
                <SideMenu
                  regions={regions}
                  locales={localesForMenu.length ? localesForMenu : locales}
                  currentLocale={countryCode}
                  navItems={navMenu.items}
                  brandName={headerTitle}
                />
              </div>
              <MegaNav
                groups={desktopNavGroups}
                ariaLabel={m.nav.collectionsAria}
              />
            </div>
          </div>

          <div className="flex items-center gap-x-2 xsmall:gap-x-4 shrink-0 h-full">
            {socialLinks.length ? (
              <div className="hidden small:flex items-center gap-x-3 h-full">
                {socialLinks.slice(0, 3).map((s) => {
                  const Icon = resolveSocialIcon(s.hostname, s.href)
                  return (
                    <a
                      key={s.href}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center justify-center min-h-10 min-w-10 rounded-rounded hover:bg-ui-bg-subtle hover:text-ui-fg-base focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg-interactive"
                      aria-label={s.label}
                      title={s.label}
                    >
                      <Icon size={18} />
                      <span className="sr-only">{s.label}</span>
                    </a>
                  )
                })}
              </div>
            ) : null}
            <LocaleSwitcher
              current={countryCode}
              enabledLocales={
                enabledCmsLocales.length ? enabledCmsLocales : undefined
              }
            />
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
                  className="inline-flex items-center min-h-10 px-3.5 rounded-full text-small-regular font-medium bg-brand-gold-muted/80 hover:bg-brand-gold/20 ring-1 ring-inset ring-brand-gold/40"
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
    </NavStickyHeader>
  )
}
