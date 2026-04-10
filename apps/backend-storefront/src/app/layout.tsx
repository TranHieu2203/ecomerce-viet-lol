import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Montserrat } from "next/font/google"
import "styles/globals.css"
import "styles/tay-a-brand.css"

const brandSans = Montserrat({
  subsets: ["latin", "vietnamese"],
  variable: "--font-brand-sans",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  icons: {
    icon: [{ url: "/tay-a-logo.png", type: "image/png", sizes: "any" }],
    apple: [{ url: "/tay-a-logo.png", type: "image/png", sizes: "180x180" }],
    shortcut: "/tay-a-logo.png",
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      data-mode="light"
      className={brandSans.variable}
      suppressHydrationWarning
    >
      {/* Extensions (e.g. some Chromium builds) may inject attributes on body before hydrate. */}
      <body
        className="font-sans antialiased bg-ui-bg-base text-ui-fg-base"
        suppressHydrationWarning
      >
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
