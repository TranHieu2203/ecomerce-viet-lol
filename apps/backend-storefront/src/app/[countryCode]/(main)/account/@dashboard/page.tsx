import { retrieveCustomer } from "@lib/data/customer"
import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import { listOrders } from "@lib/data/orders"
import Overview from "@modules/account/components/overview"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = { params: Promise<{ countryCode: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { countryCode } = await params
  const m = getStorefrontMessages(countryCode)
  return {
    title: m.account.account,
    description: m.account.overviewMetaDescription,
  }
}

export default async function OverviewTemplate() {
  const customer = await retrieveCustomer().catch(() => null)
  const orders = (await listOrders().catch(() => null)) || null

  if (!customer) {
    notFound()
  }

  return <Overview customer={customer} orders={orders} />
}
