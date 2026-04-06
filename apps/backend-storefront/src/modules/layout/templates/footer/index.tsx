import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import {
  getCmsSettingsPublic,
  resolveCmsSiteTitle,
  resolveCmsTagline,
} from "@lib/data/cms"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { displayCollection } from "@lib/util/i18n-catalog"
import { Text, clx } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import MedusaCTA from "@modules/layout/components/medusa-cta"

export default async function Footer({
  countryCode,
}: {
  countryCode: string
}) {
  const m = getStorefrontMessages(countryCode)
  const [cms, { collections }, productCategories] = await Promise.all([
    getCmsSettingsPublic(),
    listCollections({
      fields: "*products",
    }),
    listCategories(),
  ])

  const brandName = resolveCmsSiteTitle(countryCode, cms, m)
  const tagline = resolveCmsTagline(countryCode, cms, m)

  return (
    <footer className="border-t border-ui-border-base w-full bg-grey-5">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-10 xsmall:flex-row items-start justify-between py-16 xsmall:py-24">
          <div className="max-w-xs">
            <LocalizedClientLink
              href="/"
              className="txt-compact-xlarge-plus text-ui-fg-base hover:text-ui-fg-subtle font-semibold tracking-tight"
            >
              {brandName}
            </LocalizedClientLink>
            <p className="mt-3 text-ui-fg-muted text-small-regular leading-relaxed">
              {tagline}
            </p>
          </div>
          <div className="text-small-regular gap-x-8 gap-y-10 w-full xsmall:w-auto grid grid-cols-2 small:grid-cols-3 small:gap-x-16 max-w-2xl">
            {productCategories && productCategories?.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus txt-ui-fg-base">
                  {m.footer.categories}
                </span>
                <ul
                  className="grid grid-cols-1 gap-2"
                  data-testid="footer-categories"
                >
                  {productCategories?.slice(0, 6).map((c) => {
                    if (c.parent_category) {
                      return
                    }

                    const children =
                      c.category_children?.map((child) => ({
                        name: child.name,
                        handle: child.handle,
                        id: child.id,
                      })) || null

                    return (
                      <li
                        className="flex flex-col gap-2 text-ui-fg-subtle txt-small"
                        key={c.id}
                      >
                        <LocalizedClientLink
                          className={clx(
                            "hover:text-ui-fg-base",
                            children && "txt-small-plus"
                          )}
                          href={`/categories/${c.handle}`}
                          data-testid="category-link"
                        >
                          {c.name}
                        </LocalizedClientLink>
                        {children && (
                          <ul className="grid grid-cols-1 ml-3 gap-2">
                            {children &&
                              children.map((child) => (
                                <li key={child.id}>
                                  <LocalizedClientLink
                                    className="hover:text-ui-fg-base"
                                    href={`/categories/${child.handle}`}
                                    data-testid="category-link"
                                  >
                                    {child.name}
                                  </LocalizedClientLink>
                                </li>
                              ))}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            {collections && collections.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus txt-ui-fg-base">
                  {m.footer.collections}
                </span>
                <ul
                  className={clx(
                    "grid grid-cols-1 gap-2 text-ui-fg-subtle txt-small",
                    {
                      "grid-cols-2": (collections?.length || 0) > 3,
                    }
                  )}
                >
                  {collections?.slice(0, 6).map((c) => {
                    const { title: colTitle } = displayCollection(
                      countryCode,
                      c.title,
                      c.metadata
                    )
                    return (
                      <li key={c.id}>
                        <LocalizedClientLink
                          className="hover:text-ui-fg-base"
                          href={`/collections/${c.handle}`}
                        >
                          {colTitle}
                        </LocalizedClientLink>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-y-2 col-span-2 small:col-span-1">
              <span className="txt-small-plus txt-ui-fg-base">
                {m.footer.customerHeading}
              </span>
              <ul className="grid grid-cols-1 gap-y-2 text-ui-fg-subtle txt-small">
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base"
                    href="/store"
                  >
                    {m.footer.linkStore}
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base"
                    href="/cart"
                  >
                    {m.footer.linkCart}
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base"
                    href="/account"
                  >
                    {m.footer.linkAccount}
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-4 xsmall:flex-row w-full mb-12 xsmall:mb-16 justify-between items-start xsmall:items-center text-ui-fg-muted border-t border-ui-border-base pt-8">
          <Text className="txt-compact-small">
            © {new Date().getFullYear()} {brandName}
          </Text>
          <MedusaCTA />
        </div>
      </div>
    </footer>
  )
}
