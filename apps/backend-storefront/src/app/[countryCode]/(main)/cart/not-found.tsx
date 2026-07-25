import { resolveNotFoundLocale } from "@lib/not-found-cms"
import { Metadata } from "next"

import InteractiveLink from "@modules/common/components/interactive-link"

export const metadata: Metadata = {
  title: "404",
  description: "Không tìm thấy nội dung",
}

export default async function NotFound() {
  const locale = await resolveNotFoundLocale()
  const isEn = locale === "en"

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 gap-2">
      <h1 className="text-2xl-semi text-ui-fg-base">
        {isEn ? "Cart not found" : "Không tìm thấy giỏ hàng"}
      </h1>
      <p className="text-small-regular text-ui-fg-base text-center max-w-md">
        {isEn
          ? "The cart you tried to access does not exist. Clear your cookies and try again."
          : "Giỏ hàng bạn truy cập không tồn tại. Hãy xóa cookie trình duyệt và thử lại."}
      </p>
      <InteractiveLink href="/">
        {isEn ? "Go to frontpage" : "Về trang chủ"}
      </InteractiveLink>
    </div>
  )
}
