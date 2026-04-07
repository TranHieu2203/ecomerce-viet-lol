import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  icons: {
    icon: [{ url: "/tay-a-logo.jpg", type: "image/jpeg", sizes: "any" }],
    apple: [{ url: "/tay-a-logo.jpg", type: "image/jpeg", sizes: "180x180" }],
    shortcut: "/tay-a-logo.jpg",
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="vi" data-mode="light">
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
