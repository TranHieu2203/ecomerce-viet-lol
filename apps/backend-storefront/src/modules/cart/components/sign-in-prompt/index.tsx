import type { StorefrontMessages } from "@lib/i18n/storefront-messages"
import { Button, Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SignInPrompt = ({
  messages: c,
}: {
  messages: StorefrontMessages["cart"]
}) => {
  return (
    <div className="bg-white flex items-center justify-between">
      <div>
        <Heading level="h2" className="txt-xlarge">
          {c.signInHeading}
        </Heading>
        <Text className="txt-medium text-ui-fg-subtle mt-2">
          {c.signInSub}
        </Text>
      </div>
      <div>
        <LocalizedClientLink href="/account">
          <Button variant="secondary" className="h-10" data-testid="sign-in-button">
            {c.signInCta}
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default SignInPrompt
