"use client"

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react"

import { DEFAULT_LOCALE, isAppLocale, type AppLocale } from "@lib/util/locales"
import { type StorefrontMessages, getStorefrontMessages } from "./storefront-messages"

const StorefrontMessagesContext = createContext<StorefrontMessages | null>(null)

export function StorefrontI18nProvider({
  locale,
  children,
}: {
  locale: string
  children: ReactNode
}) {
  const value = useMemo(() => {
    const l: AppLocale = isAppLocale(locale) ? locale : DEFAULT_LOCALE
    return getStorefrontMessages(l)
  }, [locale])

  return (
    <StorefrontMessagesContext.Provider value={value}>
      {children}
    </StorefrontMessagesContext.Provider>
  )
}

export function useStorefrontMessages(): StorefrontMessages {
  const ctx = useContext(StorefrontMessagesContext)
  if (!ctx) {
    throw new Error(
      "useStorefrontMessages must be used within StorefrontI18nProvider"
    )
  }
  return ctx
}
