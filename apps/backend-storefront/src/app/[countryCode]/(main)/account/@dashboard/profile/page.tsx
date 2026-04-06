import { retrieveCustomer } from "@lib/data/customer"
import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import { listRegions } from "@lib/data/regions"
import ProfilePhone from "@modules/account//components/profile-phone"
import ProfileBillingAddress from "@modules/account/components/profile-billing-address"
import ProfileEmail from "@modules/account/components/profile-email"
import ProfileName from "@modules/account/components/profile-name"
import ProfilePassword from "@modules/account/components/profile-password"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = { params: Promise<{ countryCode: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { countryCode } = await params
  const m = getStorefrontMessages(countryCode)
  return {
    title: m.account.profile,
    description: m.account.profileMetaDescription,
  }
}

export default async function Profile({ params }: Props) {
  const { countryCode } = await params
  const m = getStorefrontMessages(countryCode)
  const customer = await retrieveCustomer()
  const regions = await listRegions()

  if (!customer || !regions) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="profile-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">{m.account.profile}</h1>
        <p className="text-base-regular">{m.account.profileIntro}</p>
      </div>
      <div className="flex flex-col gap-y-8 w-full">
        <ProfileName customer={customer} />
        <Divider />
        <ProfileEmail customer={customer} />
        <Divider />
        <ProfilePhone customer={customer} />
        <Divider />
        {/* <ProfilePassword customer={customer} />
        <Divider /> */}
        <ProfileBillingAddress customer={customer} regions={regions} />
      </div>
    </div>
  )
}

const Divider = () => {
  return <div className="w-full h-px bg-gray-200" />
}
