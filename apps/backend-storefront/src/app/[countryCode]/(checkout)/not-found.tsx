import { resolveNotFoundLocale } from "@lib/not-found-cms"
import InteractiveLink from "@modules/common/components/interactive-link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "404",
  description: "Không tìm thấy nội dung",
}

export default async function NotFound() {
  const locale = await resolveNotFoundLocale()
  const isEn = locale === "en"

  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)] px-4">
      <h1 className="text-2xl-semi text-ui-fg-base">
        {isEn ? "Page not found" : "Không tìm thấy trang"}
      </h1>
      <p className="text-small-regular text-ui-fg-base text-center max-w-md">
        {isEn
          ? "The page you tried to access does not exist."
          : "Trang bạn truy cập không tồn tại."}
      </p>
      <InteractiveLink href="/">
        {isEn ? "Go to frontpage" : "Về trang chủ"}
      </InteractiveLink>
    </div>
  )
}
