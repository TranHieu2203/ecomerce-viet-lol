import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await params
  const m = getStorefrontMessages(countryCode)
  return { title: m.checkout.pageTitle }
}

export default async function Checkout({
  params,
  searchParams,
}: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { countryCode } = await params
  const sp = await searchParams
  const stepParam = sp.step
  const step =
    typeof stepParam === "string"
      ? stepParam
      : Array.isArray(stepParam)
        ? stepParam[0]
        : undefined
  if (!step) {
    redirect(`/${countryCode}/checkout?step=address`)
  }

  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  if (step === "delivery" || step === "review") {
    const nextStep =
      cart.shipping_address?.address_1 &&
      cart.email &&
      (cart.shipping_methods?.length ?? 0) > 0
        ? "confirm"
        : "address"
    redirect(`/${countryCode}/checkout?step=${nextStep}`)
  }

  const customer = await retrieveCustomer()

  return (
    <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-40 py-12">
      <PaymentWrapper cart={cart}>
        <CheckoutForm cart={cart} customer={customer} />
      </PaymentWrapper>
      <CheckoutSummary cart={cart} />
    </div>
  )
}
