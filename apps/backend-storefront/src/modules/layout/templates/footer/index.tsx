import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import {
  getCmsSettingsPublic,
  resolveCmsFooterContactPlain,
  resolveCmsSiteTitle,
  resolveCmsTagline,
  resolveCmsSocialLinks,
  listCmsPagesPublic,
} from "@lib/data/cms"
import { getNavMenuPublic } from "@lib/data/nav-menu"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { displayCollection } from "@lib/util/i18n-catalog"
import { Text, clx } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import MedusaCTA from "@modules/layout/components/medusa-cta"
import { resolveSocialIcon } from "@modules/common/icons/social"

/** Ưu tiên xuống dòng sau @ và sau dấu chấm trong domain (tránh cắt giữa từ). */
function formatFooterEmailDisplay(email: string) {
  const at = email.indexOf("@")
  if (at <= 0) {
    return email
  }
  const domain = email.slice(at + 1)
  const domainBreakable = domain.includes(".")
    ? domain.split(".").join(".\u200b")
    : domain
  return (
    <>
      {email.slice(0, at)}
      @<wbr />
      {domainBreakable}
    </>
  )
}

export default async function Footer({
  countryCode,
}: {
  countryCode: string
}) {
  const m = getStorefrontMessages(countryCode)
  const [cms, navMenu, cmsPages, { collections }, productCategories] = await Promise.all([
    getCmsSettingsPublic(),
    getNavMenuPublic(countryCode),
    listCmsPagesPublic(countryCode),
    listCollections({
      fields: "*products",
    }),
    listCategories(),
  ])

  const brandName = resolveCmsSiteTitle(countryCode, cms, m)
  const tagline = resolveCmsTagline(countryCode, cms, m)
  const socialLinks = resolveCmsSocialLinks(
    cms,
    countryCode,
    m.footer.socialFallback
  )
  const { hotline, email } = resolveCmsFooterContactPlain(cms)
  const telHref = hotline
    ? `tel:${hotline.replace(/[\s().-]/g, "")}`
    : ""
  const hasContactBlock = Boolean(hotline || email || socialLinks.length)

  const cmsPageLinksFromNav = Array.isArray(navMenu?.items)
    ? navMenu.items
        .flatMap((g) => g.children ?? [])
        .filter((c) => c?.type === "link")
        .map((c) => c as { type: "link"; label: string; href: string })
        .filter((c) => typeof c.href === "string" && c.href.startsWith("/p/"))
        .filter((c, idx, arr) => arr.findIndex((x) => x.href === c.href) === idx)
        .slice(0, 8)
    : []

  const cmsPagesResolved =
    Array.isArray(cmsPages) && cmsPages.length
      ? cmsPages
          .filter((p) => p?.slug && p?.title)
          .map((p) => ({ href: `/p/${p.slug}`, label: p.title }))
          .slice(0, 8)
      : []

  const cmsPageLinks = cmsPagesResolved.length ? cmsPagesResolved : cmsPageLinksFromNav

  return (
    <footer className="border-t border-brand-gold/20 w-full bg-brand-cream">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-10 xsmall:flex-row xsmall:items-start xsmall:justify-between py-16 xsmall:py-24 gap-x-10">
          <div className="max-w-xs shrink-0">
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
          <div
            className={clx(
              "text-small-regular w-full min-w-0 flex-1",
              "grid gap-x-10 gap-y-10",
              "[grid-template-columns:repeat(auto-fit,minmax(11.5rem,1fr))]"
            )}
          >
            {productCategories && productCategories?.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus text-brand-gold font-medium">
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
            {hasContactBlock ? (
              <div className="flex flex-col gap-y-2 min-w-0">
                <span className="txt-small-plus text-brand-gold font-medium">
                  {m.footer.socialHeading}
                </span>
                {hotline && telHref ? (
                  <a
                    className="block text-ui-fg-subtle txt-small hover:text-ui-fg-base"
                    href={telHref}
                  >
                    <span className="text-ui-fg-muted">
                      {m.footer.hotlineLabel}:{" "}
                    </span>
                    {hotline}
                  </a>
                ) : null}
                {email ? (
                  <a
                    className="block text-ui-fg-subtle txt-small hover:text-ui-fg-base break-words"
                    href={`mailto:${email}`}
                  >
                    <span className="text-ui-fg-muted">
                      {m.footer.emailLabel}:{" "}
                    </span>
                    {formatFooterEmailDisplay(email)}
                  </a>
                ) : null}
                {socialLinks.length ? (
                  <ul className="flex flex-wrap gap-2 text-ui-fg-subtle">
                    {socialLinks.slice(0, 6).map((s) => {
                      const Icon = resolveSocialIcon(s.hostname, s.href)
                      return (
                        <li key={s.href}>
                          <a
                            className="inline-flex items-center justify-center min-h-10 min-w-10 rounded-rounded hover:bg-ui-bg-subtle hover:text-ui-fg-base focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg-interactive"
                            href={s.href}
                            target="_blank"
                            rel="noreferrer noopener"
                            aria-label={s.label}
                            title={s.label}
                          >
                            <Icon size={18} />
                            <span className="sr-only">{s.label}</span>
                          </a>
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
              </div>
            ) : null}
            {collections && collections.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus text-brand-gold font-medium">
                  {m.footer.collections}
                </span>
                <ul className="flex flex-col gap-2 text-ui-fg-subtle txt-small">
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
            {cmsPageLinks.length ? (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus text-brand-gold font-medium">
                  {countryCode === "en" ? "Pages" : "Trang thông tin"}
                </span>
                <ul className="flex flex-col gap-2 text-ui-fg-subtle txt-small">
                  {cmsPageLinks.map((c) => (
                    <li key={c.href}>
                      <LocalizedClientLink
                        className="hover:text-ui-fg-base"
                        href={c.href}
                      >
                        {c.label}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="flex flex-col gap-y-2">
              <span className="txt-small-plus text-brand-gold font-medium">
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
        <div className="flex flex-col-reverse gap-4 xsmall:flex-row w-full mb-12 xsmall:mb-16 justify-between items-start xsmall:items-center text-ui-fg-muted border-t border-brand-gold/15 pt-8">
          <Text className="txt-compact-small">
            © {new Date().getFullYear()} {brandName}
          </Text>
          <MedusaCTA />
        </div>
      </div>
    </footer>
  )
}
