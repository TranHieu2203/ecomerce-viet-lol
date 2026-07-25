import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function CategoryQuickLinks({
  categories,
  locale,
}: {
  categories: { id: string; name: string }[]
  locale: string
}) {
  const m = getStorefrontMessages(locale)

  if (!categories.length) {
    return null
  }

  const chipClass =
    "inline-flex items-center h-8 px-3 rounded-full text-xsmall-regular text-ui-fg-subtle bg-white border border-transparent hover:border-brand-gold hover:text-brand-ink transition-colors duration-150 whitespace-nowrap"

  return (
    <div className="content-container py-3 xsmall:py-4">
      <div className="flex items-center gap-1.5 xsmall:gap-2 overflow-x-auto px-3 py-2 rounded-xl border border-brand-gold/20 bg-brand-cream/30">
        <LocalizedClientLink href="/store" className={chipClass}>
          {m.store.allProducts}
        </LocalizedClientLink>
        {categories.map((c) => (
          <LocalizedClientLink
            key={c.id}
            href={`/store?categoryId=${c.id}`}
            className={chipClass}
          >
            {c.name}
          </LocalizedClientLink>
        ))}
      </div>
    </div>
  )
}
