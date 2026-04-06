import { listOrders } from "@lib/data/orders"
import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import OrderOverview from "@modules/account/components/order-overview"
import Divider from "@modules/common/components/divider"
import TransferRequestForm from "@modules/account/components/transfer-request-form"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = { params: Promise<{ countryCode: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { countryCode } = await params
  const m = getStorefrontMessages(countryCode)
  return {
    title: m.account.orders,
    description: m.account.ordersMetaDescription,
  }
}

export default async function Orders({ params }: Props) {
  const { countryCode } = await params
  const m = getStorefrontMessages(countryCode)
  const orders = await listOrders()

  if (!orders) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="orders-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">{m.account.orders}</h1>
        <p className="text-base-regular">{m.account.ordersIntro}</p>
      </div>
      <div>
        <OrderOverview orders={orders} />
        <Divider className="my-16" />
        <TransferRequestForm />
      </div>
    </div>
  )
}
