"use client"

import { useActionState } from "react"
import Input from "@modules/common/components/input"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useStorefrontMessages } from "@lib/i18n/storefront-i18n-provider"
import { signup } from "@lib/data/customer"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const m = useStorefrontMessages()
  const a = m.auth
  const store =
    process.env.NEXT_PUBLIC_STORE_DISPLAY_NAME?.trim() ||
    m.checkout.storeFallback
  const [message, formAction] = useActionState(signup, null)

  return (
    <div
      className="max-w-sm flex flex-col items-center"
      data-testid="register-page"
    >
      <h1 className="text-large-semi uppercase mb-6">
        {a.becomeMemberTitle.replace("{store}", store)}
      </h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-4">
        {a.createProfileBlurb.replace("{store}", store)}
      </p>
      <form className="w-full flex flex-col" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label={a.firstName}
            name="first_name"
            required
            autoComplete="given-name"
            data-testid="first-name-input"
          />
          <Input
            label="Last name"
            name="last_name"
            required
            autoComplete="family-name"
            data-testid="last-name-input"
          />
          <Input
            label={a.email}
            name="email"
            required
            type="email"
            autoComplete="email"
            data-testid="email-input"
          />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            data-testid="phone-input"
          />
          <Input
            label={a.password}
            name="password"
            required
            type="password"
            autoComplete="new-password"
            data-testid="password-input"
          />
        </div>
        <ErrorMessage error={message} data-testid="register-error" />
        <span className="text-center text-ui-fg-base text-small-regular mt-6">
          {a.agreePrefix}{" "}
          {a.agreePossessiveStore.replace("{store}", store)}
          <LocalizedClientLink
            href="/content/privacy-policy"
            className="underline"
          >
            {a.privacyPolicy}
          </LocalizedClientLink>{" "}
          {a.termsConnector}{" "}
          <LocalizedClientLink
            href="/content/terms-of-use"
            className="underline"
          >
            {a.termsOfUse}
          </LocalizedClientLink>
          .
        </span>
        <SubmitButton className="w-full mt-6" data-testid="register-button">
          {a.join}
        </SubmitButton>
      </form>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        {a.alreadyMember}{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="underline"
        >
          {a.signInLink}
        </button>
        .
      </span>
    </div>
  )
}

export default Register
