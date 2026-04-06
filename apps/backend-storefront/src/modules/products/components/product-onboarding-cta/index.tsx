import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import { Button, Container, Text } from "@medusajs/ui"
import { cookies as nextCookies } from "next/headers"

async function ProductOnboardingCta({
  countryCode,
}: {
  countryCode: string
}) {
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"

  if (!isOnboarding) {
    return null
  }

  const m = getStorefrontMessages(countryCode)

  return (
    <Container className="max-w-4xl h-full bg-ui-bg-subtle w-full p-8">
      <div className="flex flex-col gap-y-4 center">
        <Text className="text-ui-fg-base text-xl">
          {m.product.onboardingSuccess}
        </Text>
        <Text className="text-ui-fg-subtle text-small-regular">
          {m.product.onboardingSub}
        </Text>
        <a href="http://localhost:7001/a/orders?onboarding_step=create_order_nextjs">
          <Button className="w-full">{m.product.continueSetupAdmin}</Button>
        </a>
      </div>
    </Container>
  )
}

export default ProductOnboardingCta
