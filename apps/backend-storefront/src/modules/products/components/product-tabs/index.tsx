"use client"

import { useStorefrontMessages } from "@lib/i18n/storefront-i18n-provider"
import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const t = useStorefrontMessages().productTabs
  const tabs = [
    {
      label: t.productInformation,
      component: <ProductInfoTab product={product} />,
    },
    {
      label: t.shippingReturns,
      component: <ShippingInfoTab />,
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple">
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const ProductInfoTab = ({ product }: ProductTabsProps) => {
  const t = useStorefrontMessages().productTabs
  const empty = t.emptyValue
  const weightText = product.weight
    ? t.weightGrams.replace("{n}", String(product.weight))
    : empty

  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-2 gap-x-8">
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-semibold">{t.material}</span>
            <p>{product.material ? product.material : empty}</p>
          </div>
          <div>
            <span className="font-semibold">{t.countryOfOrigin}</span>
            <p>{product.origin_country ? product.origin_country : empty}</p>
          </div>
          <div>
            <span className="font-semibold">{t.type}</span>
            <p>{product.type ? product.type.value : empty}</p>
          </div>
        </div>
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-semibold">{t.weight}</span>
            <p>{weightText}</p>
          </div>
          <div>
            <span className="font-semibold">{t.dimensions}</span>
            <p>
              {product.length && product.width && product.height
                ? `${product.length}L x ${product.width}W x ${product.height}H`
                : empty}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const ShippingInfoTab = () => {
  const t = useStorefrontMessages().productTabs
  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-1 gap-y-8">
        <div className="flex items-start gap-x-2">
          <FastDelivery />
          <div>
            <span className="font-semibold">{t.shipFastTitle}</span>
            <p className="max-w-sm">{t.shipFastBody}</p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Refresh />
          <div>
            <span className="font-semibold">{t.exchangeTitle}</span>
            <p className="max-w-sm">{t.exchangeBody}</p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Back />
          <div>
            <span className="font-semibold">{t.returnsTitle}</span>
            <p className="max-w-sm">{t.returnsBody}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
