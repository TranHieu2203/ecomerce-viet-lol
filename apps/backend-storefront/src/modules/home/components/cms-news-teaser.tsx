import { CmsNewsListItem } from "@lib/data/cms"
import Link from "next/link"

const PAGE_SIZE = 4

type Props = {
  locale: string
  articles: CmsNewsListItem[]
  isEn: boolean
}

export default function CmsNewsTeaser({ locale, articles, isEn }: Props) {
  if (articles.length === 0) {
    return null
  }

  const slice = articles.slice(0, PAGE_SIZE)
  const title = isEn ? "Latest news" : "Tin mới"
  const subtitle = isEn
    ? "Updates and stories from our team."
    : "Cập nhật và bài viết từ cửa hàng."
  const seeAll = isEn ? "View all news" : "Xem tất cả tin"

  return (
    <section
      className="py-8 xsmall:py-12 px-4 small:px-8 max-w-[1200px] mx-auto w-full border-t border-ui-border-base"
      aria-labelledby="home-news-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h2
            id="home-news-heading"
            className="text-2xl-semi text-ui-fg-base"
          >
            {title}
          </h2>
          <p className="text-small-regular text-ui-fg-muted mt-1 max-w-xl">
            {subtitle}
          </p>
        </div>
        <Link
          href={`/${locale}/news`}
          className="text-small-semi text-ui-fg-interactive hover:underline"
        >
          {seeAll} →
        </Link>
      </div>
      <ul className="grid grid-cols-1 small:grid-cols-2 gap-6">
        {slice.map((a) => (
          <li
            key={a.slug}
            className="border border-ui-border-base rounded-lg overflow-hidden flex flex-col bg-ui-bg-subtle hover:border-ui-border-strong transition-colors"
          >
            {a.featured_image_url ? (
              <Link
                href={`/${locale}/news/${encodeURIComponent(a.slug)}`}
                className="block aspect-[16/9] bg-ui-bg-base overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.featured_image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </Link>
            ) : null}
            <div className="p-4 flex flex-col gap-2 flex-1">
              {a.published_at ? (
                <time
                  dateTime={a.published_at}
                  className="text-xsmall-regular text-ui-fg-muted"
                >
                  {new Date(a.published_at).toLocaleDateString(
                    isEn ? "en-US" : "vi-VN"
                  )}
                </time>
              ) : null}
              <h3 className="text-lg-semi text-ui-fg-base">
                <Link
                  href={`/${locale}/news/${encodeURIComponent(a.slug)}`}
                  className="hover:text-ui-fg-interactive"
                >
                  {a.title || a.slug}
                </Link>
              </h3>
              {a.excerpt ? (
                <p className="text-small-regular text-ui-fg-muted line-clamp-2">
                  {a.excerpt}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
