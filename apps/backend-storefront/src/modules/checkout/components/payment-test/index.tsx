"use client"

import { useStorefrontMessages } from "@lib/i18n/storefront-i18n-provider"
import { Badge } from "@medusajs/ui"

const PaymentTest = ({ className }: { className?: string }) => {
  const m = useStorefrontMessages()
  return (
    <Badge color="orange" className={className}>
      <span className="font-semibold">{m.checkout.paymentTestAttention}</span>{" "}
      {m.checkout.paymentTestBody}
    </Badge>
  )
}

export default PaymentTest
