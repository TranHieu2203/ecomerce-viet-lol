"use client"

import { useStorefrontMessages } from "@lib/i18n/storefront-i18n-provider"
import { Heading } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import React from "react"

const Help = () => {
  const sup = useStorefrontMessages().support

  return (
    <div className="mt-6">
      <Heading className="text-base-semi">{sup.needHelp}</Heading>
      <div className="text-base-regular my-2">
        <ul className="gap-y-2 flex flex-col">
          <li>
            <LocalizedClientLink href="/contact">{sup.contact}</LocalizedClientLink>
          </li>
          <li>
            <LocalizedClientLink href="/contact">
              {sup.returnsExchanges}
            </LocalizedClientLink>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Help
