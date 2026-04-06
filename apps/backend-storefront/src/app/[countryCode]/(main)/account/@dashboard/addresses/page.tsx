import { retrieveCustomer } from "@lib/data/customer"
import { getRegion } from "@lib/data/regions"
import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import AddressBook from "@modules/account/components/address-book"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = { params: Promise<{ countryCode: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { countryCode } = await params
  const m = getStorefrontMessages(countryCode)
  return {
    title: m.account.shippingAddressesTitle,
    description: m.account.addressesMetaDescription,
  }
}

export default async function Addresses({ params }: Props) {
  const { countryCode } = await params
  const m = getStorefrontMessages(countryCode)
  const customer = await retrieveCustomer()
  const region = await getRegion(countryCode)

  if (!customer || !region) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="addresses-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">{m.account.shippingAddressesTitle}</h1>
        <p className="text-base-regular">{m.account.addressesIntro}</p>
      </div>
      <AddressBook customer={customer} region={region} />
    </div>
  )
}
