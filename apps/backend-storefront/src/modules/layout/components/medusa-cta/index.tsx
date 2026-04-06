import { Text } from "@medusajs/ui"

import Medusa from "../../../common/icons/medusa"
import NextJs from "../../../common/icons/nextjs"

function isDevBrandingEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_SHOW_DEV_BRANDING?.trim().toLowerCase()
  return v === "true" || v === "1" || v === "yes"
}

const MedusaCTA = () => {
  const showDevBranding =
    process.env.NODE_ENV !== "production" || isDevBrandingEnabled()

  if (!showDevBranding) {
    return null
  }

  return (
    <Text className="flex gap-x-2 txt-compact-small-plus items-center">
      Powered by
      <a href="https://www.medusajs.com" target="_blank" rel="noreferrer">
        <Medusa fill="#9ca3af" className="fill-[#9ca3af]" />
      </a>
      &
      <a href="https://nextjs.org" target="_blank" rel="noreferrer">
        <NextJs fill="#9ca3af" />
      </a>
    </Text>
  )
}

export default MedusaCTA
