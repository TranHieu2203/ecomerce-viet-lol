import { Suspense } from "react"

import { getCmsSettingsPublic } from "@lib/data/cms"
import { isSvgAssetUrl } from "@lib/util/cms-assets"
import { listCollections } from "@lib/data/collections"
import { getLocale } from "@lib/data/locale-actions"
import { listLocales } from "@lib/data/locales"
import { listRegions } from "@lib/data/regions"
import { displayCollection } from "@lib/util/i18n-catalog"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import LocaleSwitcher from "@modules/layout/components/locale-switcher"
import SideMenu from "@modules/layout/components/side-menu"
import Image from "next/image"

export default async function Nav({
  countryCode,
}: {
  countryCode: string
}) {
  const [regions, locales, currentLocale, { collections }, cms] =
    await Promise.all([
      listRegions().then((regions: StoreRegion[]) => regions),
      listLocales(),
      getLocale(),
      listCollections({
        limit: "100",
        offset: "0",
        fields: "id,handle,title,metadata",
      }),
      getCmsSettingsPublic(),
    ])

  const topCollections = (collections || []).filter(
    (c) => !(c.metadata && (c.metadata as { parent_collection_handle?: string }).parent_collection_handle)
  )

  const headerTitle =
    cms.site_title?.trim() ||
    process.env.NEXT_PUBLIC_STORE_DISPLAY_NAME?.trim() ||
    ""

  const logoSrc = cms.logo_url
  const logoIsSvg = isSvgAssetUrl(logoSrc)

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
                countryCode={countryCode}
                brandName={headerTitle}
                collectionLinks={topCollections.map((c) => ({
                  handle: c.handle!,
                  title: displayCollection(
                    countryCode,
                    c.title!,
                    c.metadata as Record<string, unknown> | null | undefined
                  ).title,
                }))}
              />
            </div>
            <nav
              aria-label="Collections"
              className="hidden small:flex items-center gap-4 text-ui-fg-subtle"
            >
              {topCollections.slice(0, 6).map((c) => (
                <LocalizedClientLink
                  key={c.id}
                  href={`/collections/${c.handle}`}
                  className="hover:text-ui-fg-base whitespace-nowrap"
                >
                  {displayCollection(
                    countryCode,
                    c.title!,
                    c.metadata as Record<string, unknown> | null | undefined
                  ).title}
                </LocalizedClientLink>
              ))}
            </nav>
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
                  alt=""
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
                  alt=""
                  className="h-7 w-auto xsmall:h-8 max-w-[120px] xsmall:max-w-[160px] object-contain object-center flex-shrink-0"
                />
              ) : null}
              {!logoSrc ? (
                <span className="truncate text-center uppercase tracking-wide text-sm xsmall:text-base font-semibold text-ui-fg-base">
                  {headerTitle}
                </span>
              ) : null}
              {logoSrc && headerTitle ? (
                <>
                  <span className="sr-only xsmall:hidden">{headerTitle}</span>
                  <span className="hidden xsmall:inline truncate font-semibold text-ui-fg-base normal-case tracking-tight text-sm small:text-base max-w-[5.5rem] small:max-w-[9rem] leading-tight">
                    {headerTitle}
                  </span>
                </>
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
                Account
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-ui-fg-base flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart (0)
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
