import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import LoginTemplate from "@modules/account/templates/login-template"
import { Metadata } from "next"

type Props = { params: Promise<{ countryCode: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { countryCode } = await params
  const m = getStorefrontMessages(countryCode)
  return {
    title: m.auth.signIn,
    description: m.auth.signInBlurb,
  }
}

export default function Login() {
  return <LoginTemplate />
}
