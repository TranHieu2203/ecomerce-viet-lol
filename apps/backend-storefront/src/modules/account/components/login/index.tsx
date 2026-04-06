"use client"

import { login } from "@lib/data/customer"
import { useStorefrontMessages } from "@lib/i18n/storefront-i18n-provider"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useActionState } from "react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const a = useStorefrontMessages().auth
  const [message, formAction] = useActionState(login, null)

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="login-page"
    >
      <h1 className="text-large-semi uppercase mb-6">{a.welcomeBack}</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        {a.signInBlurb}
      </p>
      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label={a.email}
            name="email"
            type="email"
            title={a.emailValidationTitle}
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label={a.password}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        <ErrorMessage error={message} data-testid="login-error-message" />
        <SubmitButton data-testid="sign-in-button" className="w-full mt-6">
          {a.signIn}
        </SubmitButton>
      </form>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        {a.notMember}{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="underline"
          data-testid="register-button"
        >
          {a.joinUs}
        </button>
        .
      </span>
    </div>
  )
}

export default Login
