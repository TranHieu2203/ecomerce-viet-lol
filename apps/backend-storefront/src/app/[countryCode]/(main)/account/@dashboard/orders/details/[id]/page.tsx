import { retrieveOrder } from "@lib/data/orders"
import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import OrderDetailsTemplate from "@modules/order/templates/order-details-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ countryCode: string; id: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    notFound()
  }

  const m = getStorefrontMessages(params.countryCode)
  const idStr = String(order.display_id ?? order.id)
  return {
    title: m.metadata.orderDetailTitle.replace("{id}", idStr),
    description: m.metadata.orderDetailDescription,
  }
}

export default async function OrderDetailPage(props: Props) {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    notFound()
  }

  return <OrderDetailsTemplate order={order} />
}
