import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import CartTemplate from "@modules/cart/templates"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await params
  const m = getStorefrontMessages(countryCode)
  return {
    title: m.metadata.cartTitle,
    description: m.metadata.cartDescription,
  }
}

export default async function Cart({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const cart = await retrieveCart().catch((error) => {
    console.error(error)
    return notFound()
  })

  const customer = await retrieveCustomer()

  return (
    <CartTemplate
      cart={cart}
      customer={customer}
      countryCode={countryCode}
    />
  )
}
