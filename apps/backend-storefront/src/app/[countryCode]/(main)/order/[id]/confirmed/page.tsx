import { retrieveOrder } from "@lib/data/orders"
import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ countryCode: string; id: string }>
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { countryCode } = await params
  const m = getStorefrontMessages(countryCode)
  return {
    title: m.metadata.orderConfirmedTitle,
    description: m.metadata.orderConfirmedDescription,
  }
}

export default async function OrderConfirmedPage(props: Props) {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    return notFound()
  }

  return (
    <OrderCompletedTemplate
      order={order}
      countryCode={params.countryCode}
    />
  )
}
