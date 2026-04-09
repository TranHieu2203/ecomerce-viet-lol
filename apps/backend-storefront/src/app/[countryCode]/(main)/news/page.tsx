import {
  getCmsNewsCategories,
  getCmsNewsList,
  getCmsNewsTags,
  getCmsSettingsPublic,
  resolveCmsSiteTitle,
} from "@lib/data/cms"
import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import { Metadata } from "next"
import Link from "next/link"

const PAGE_SIZE = 12

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{
    page?: string
    category_slug?: string
    tag_slug?: string
  }>
}

function newsListHref(
  locale: string,
  opts: { page?: number; category_slug?: string; tag_slug?: string }
): string {
  const p = new URLSearchParams()
  if (opts.page && opts.page > 1) {
    p.set("page", String(opts.page))
  }
  if (opts.category_slug) {
    p.set("category_slug", opts.category_slug)
  }
  if (opts.tag_slug) {
    p.set("tag_slug", opts.tag_slug)
  }
  const qs = p.toString()
  return qs ? `/${locale}/news?${qs}` : `/${locale}/news`
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const cms = await getCmsSettingsPublic()
  const m = getStorefrontMessages(params.countryCode)
  const brand = resolveCmsSiteTitle(
    params.countryCode,
    cms,
    m,
    m.home.metaFallbackTitle
  )
  const title =
    params.countryCode === "en" ? `News | ${brand}` : `Tin tức | ${brand}`
  return {
    title,
    description:
      params.countryCode === "en"
        ? "News and updates from the store."
        : "Tin tức và cập nhật từ cửa hàng.",
  }
}

export default async function NewsIndexPage(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams
  const locale = params.countryCode
  const pageRaw = Number.parseInt(searchParams.page ?? "1", 10)
  const page =
    Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1
  const offset = (page - 1) * PAGE_SIZE

  const categorySlug =
    searchParams.category_slug?.trim().toLowerCase() || undefined
  const tagSlug = searchParams.tag_slug?.trim().toLowerCase() || undefined
  const listFilters =
    categorySlug || tagSlug
      ? {
          ...(categorySlug ? { category_slug: categorySlug } : {}),
          ...(tagSlug ? { tag_slug: tagSlug } : {}),
        }
      : undefined

  const [categories, tagNav, { articles, count }] = await Promise.all([
    getCmsNewsCategories(locale),
    getCmsNewsTags(locale),
    getCmsNewsList(locale, PAGE_SIZE, offset, listFilters),
  ])

  const m = getStorefrontMessages(locale)
  const isEn = locale === "en"
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const hasPrev = page > 1
  const hasNext = page < totalPages

  const filterBase = { category_slug: categorySlug, tag_slug: tagSlug }
  const prevHref = newsListHref(locale, {
    ...filterBase,
    page:
      page > 1 && page - 1 > 1
        ? page - 1
        : undefined,
  })
  const nextHref = newsListHref(locale, {
    ...filterBase,
    page: page + 1,
  })

  const rootCategories = categories.filter((c) => !c.parent_slug)

  return (
    <div className="flex flex-col w-full py-8 small:py-12 px-4 small:px-8 max-w-[1200px] mx-auto">
      <nav
        className="text-small-regular text-ui-fg-muted mb-6"
        aria-label="Breadcrumb"
      >
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <Link href={`/${locale}`} className="hover:text-ui-fg-base">
              {m.sideMenu.home}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-ui-fg-base">
            {isEn ? "News" : "Tin tức"}
          </li>
        </ol>
      </nav>

      <header className="max-w-4xl mb-8">
        <h1 className="text-3xl-semi text-ui-fg-base">
          {isEn ? "News" : "Tin tức"}
        </h1>
        {rootCategories.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2" aria-label={isEn ? "Categories" : "Chủ đề"}>
            <Link
              href={`/${locale}/news`}
              className={`text-xsmall-regular rounded-full border px-3 py-1 ${
                !categorySlug && !tagSlug
                  ? "border-ui-border-strong bg-ui-bg-subtle text-ui-fg-base"
                  : "border-ui-border-base text-ui-fg-muted hover:border-ui-border-strong"
              }`}
            >
              {isEn ? "All" : "Tất cả"}
            </Link>
            {rootCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/${locale}/news/category/${encodeURIComponent(c.slug)}`}
                className={`text-xsmall-regular rounded-full border px-3 py-1 ${
                  categorySlug === c.slug
                    ? "border-ui-border-strong bg-ui-bg-subtle text-ui-fg-base"
                    : "border-ui-border-base text-ui-fg-muted hover:border-ui-border-strong"
                }`}
              >
                {c.title}
              </Link>
            ))}
          </div>
        ) : null}
        {tagNav.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2" aria-label={isEn ? "Tags" : "Nhãn"}>
            {tagNav.map((t) => (
              <Link
                key={t.slug}
                href={newsListHref(locale, { tag_slug: t.slug })}
                className={`text-xsmall-regular rounded-full border border-dashed px-2.5 py-1 ${
                  tagSlug === t.slug
                    ? "border-ui-border-strong text-ui-fg-base"
                    : "border-ui-border-base text-ui-fg-muted hover:text-ui-fg-base"
                }`}
              >
                #{t.title}
              </Link>
            ))}
          </div>
        ) : null}
      </header>

      {articles.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-lg border border-dashed border-ui-border-base bg-ui-bg-subtle">
          <p className="text-ui-fg-muted mb-4">
            {isEn ? "No articles yet." : "Chưa có bài tin nào."}
          </p>
          <Link
            href={`/${locale}`}
            className="text-small-semi text-ui-fg-interactive hover:underline inline-flex min-h-[44px] items-center justify-center px-4"
          >
            {isEn ? "Back to home" : "Về trang chủ"}
          </Link>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 small:grid-cols-2 large:grid-cols-3 gap-6 w-full mb-10">
            {articles.map((a) => (
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
                      className="w-full h-full object-cover transition-transform duration-200 hover:scale-[1.02] motion-reduce:transform-none"
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
                  <h2 className="text-lg-semi text-ui-fg-base line-clamp-2">
                    <Link
                      href={`/${locale}/news/${encodeURIComponent(a.slug)}`}
                      className="hover:text-ui-fg-interactive"
                    >
                      {a.title || a.slug}
                    </Link>
                  </h2>
                  {a.excerpt ? (
                    <p className="text-small-regular text-ui-fg-muted line-clamp-3">
                      {a.excerpt}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>

          {totalPages > 1 ? (
            <nav
              className="flex flex-wrap items-center justify-center gap-3 pt-2"
              aria-label={isEn ? "News pagination" : "Phân trang tin"}
            >
              {hasPrev ? (
                <Link
                  href={prevHref}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-4 rounded-md border border-ui-border-base text-small-semi text-ui-fg-base hover:bg-ui-bg-subtle"
                >
                  {isEn ? "Previous" : "Trang trước"}
                </Link>
              ) : (
                <span className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-4 rounded-md border border-ui-border-base text-ui-fg-muted opacity-50 cursor-not-allowed">
                  {isEn ? "Previous" : "Trang trước"}
                </span>
              )}
              <span className="text-small-regular text-ui-fg-muted px-2">
                {isEn ? "Page" : "Trang"} {page} / {totalPages}
              </span>
              {hasNext ? (
                <Link
                  href={nextHref}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-4 rounded-md border border-ui-border-base text-small-semi text-ui-fg-base hover:bg-ui-bg-subtle"
                >
                  {isEn ? "Next" : "Trang sau"}
                </Link>
              ) : (
                <span className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-4 rounded-md border border-ui-border-base text-ui-fg-muted opacity-50 cursor-not-allowed">
                  {isEn ? "Next" : "Trang sau"}
                </span>
              )}
            </nav>
          ) : null}
        </>
      )}
    </div>
  )
}
