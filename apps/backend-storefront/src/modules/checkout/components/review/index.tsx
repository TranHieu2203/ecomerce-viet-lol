"use client"

import { useStorefrontMessages } from "@lib/i18n/storefront-i18n-provider"
import { Text } from "@medusajs/ui"

import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"

const Review = ({ cart }: { cart: any }) => {
  const m = useStorefrontMessages()
  const s = m.checkoutSteps
  const searchParams = useSearchParams()

  const isOpen = searchParams.get("step") === "confirm"

  const previousStepsCompleted =
    !!cart.shipping_address &&
    cart.shipping_methods.length > 0

  return (
    <div className="bg-white">
      <h2 className="sr-only">{s.confirmPlaceOrderSection}</h2>
      {isOpen && previousStepsCompleted && (
        <>
          <div className="flex items-start gap-x-1 w-full mb-6">
            <div className="w-full">
              <Text className="txt-medium text-ui-fg-muted mb-3">
                {m.checkout.codNotice}
              </Text>
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                {s.reviewLegal}
              </Text>
            </div>
          </div>
          <PaymentButton cart={cart} data-testid="submit-order-button" />
        </>
      )}
    </div>
  )
}

export default Review
