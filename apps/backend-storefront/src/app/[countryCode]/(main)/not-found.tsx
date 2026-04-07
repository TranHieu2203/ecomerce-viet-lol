import { getNotFoundCopy, resolveNotFoundLocale } from "@lib/not-found-cms"
import { ArrowUpRightMini } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import { Metadata } from "next"
import Link from "next/link"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveNotFoundLocale()
  const copy = await getNotFoundCopy(locale)
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
  }
}

export default async function MainNotFound() {
  const locale = await resolveNotFoundLocale()
  const copy = await getNotFoundCopy(locale)

  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)] px-4">
      <h1 className="text-2xl-semi text-ui-fg-base">{copy.title}</h1>
      <div
        className="text-small-regular text-ui-fg-base text-center max-w-md [&_p]:mb-2"
        dangerouslySetInnerHTML={{ __html: copy.bodyHtml }}
      />
      <Link
        className="flex gap-x-1 items-center group"
        href={`/${locale}`}
      >
        <Text className="text-ui-fg-interactive">
          {locale === "en" ? "Go to frontpage" : "Về trang chủ"}
        </Text>
        <ArrowUpRightMini
          className="group-hover:rotate-45 ease-in-out duration-150"
          color="var(--fg-interactive)"
        />
      </Link>
    </div>
  )
}
