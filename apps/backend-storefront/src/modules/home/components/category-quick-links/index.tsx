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
    "inline-flex items-center h-10 px-4 rounded-full border border-brand-gold/30 bg-white text-small-regular text-ui-fg-subtle hover:border-brand-gold hover:text-brand-ink hover:bg-brand-cream/60 transition-colors duration-150 whitespace-nowrap"

  return (
    <div className="content-container py-4 xsmall:py-5">
      <div className="flex items-center gap-2 xsmall:gap-3 overflow-x-auto">
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
