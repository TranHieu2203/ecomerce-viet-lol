import { Metadata } from "next"

import { getCmsSettingsPublic } from "@lib/data/cms"
import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { StorefrontI18nProvider } from "@lib/i18n/storefront-i18n-provider"
import { getBaseURL } from "@lib/util/env"
import { StoreCartShippingOption } from "@medusajs/types"
import AnnouncementBar from "@modules/layout/components/announcement-bar"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import { DocumentLang } from "@modules/layout/components/document-lang"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: {
  children: React.ReactNode
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const customer = await retrieveCustomer()
  const cart = await retrieveCart()
  let shippingOptions: StoreCartShippingOption[] = []

  if (cart) {
    const { shipping_options } = await listCartOptions()

    shippingOptions = shipping_options
  }

  const cms = await getCmsSettingsPublic()

  return (
    <StorefrontI18nProvider locale={params.countryCode}>
      <DocumentLang locale={params.countryCode} />
      <Nav countryCode={params.countryCode} />
      <AnnouncementBar
        locale={params.countryCode}
        announcement={cms.announcement}
      />
      {customer && cart && (
        <CartMismatchBanner customer={customer} cart={cart} />
      )}

      {cart && (
        <FreeShippingPriceNudge
          variant="popup"
          cart={cart}
          shippingOptions={shippingOptions}
        />
      )}
      {props.children}
      <Footer countryCode={params.countryCode} />
    </StorefrontI18nProvider>
  )
}
