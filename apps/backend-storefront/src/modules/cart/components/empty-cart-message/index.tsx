import type { StorefrontMessages } from "@lib/i18n/storefront-messages"
import { Heading, Text } from "@medusajs/ui"

import InteractiveLink from "@modules/common/components/interactive-link"

const EmptyCartMessage = ({
  messages: c,
}: {
  messages: StorefrontMessages["cart"]
}) => {
  return (
    <div className="py-48 px-2 flex flex-col justify-center items-start" data-testid="empty-cart-message">
      <Heading
        level="h1"
        className="flex flex-row text-3xl-regular gap-x-2 items-baseline"
      >
        {c.emptyTitle}
      </Heading>
      <Text className="text-base-regular mt-4 mb-6 max-w-[32rem]">
        {c.emptyBody}
      </Text>
      <div>
        <InteractiveLink href="/store">{c.exploreProducts}</InteractiveLink>
      </div>
    </div>
  )
}

export default EmptyCartMessage
