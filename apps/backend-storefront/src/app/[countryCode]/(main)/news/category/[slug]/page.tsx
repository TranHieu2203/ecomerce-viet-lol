import {
  getCmsNewsCategories,
  getCmsNewsList,
  getCmsSettingsPublic,
  resolveCmsSiteTitle,
} from "@lib/data/cms"
import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

const PAGE_SIZE = 12

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
  searchParams: Promise<{ page?: string }>
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
  const cats = await getCmsNewsCategories(params.countryCode)
  const cat = cats.find((c) => c.slug === params.slug)
  const label = cat?.title ?? params.slug
  const isEn = params.countryCode === "en"
  const title = isEn ? `${label} | News | ${brand}` : `${label} | Tin tức | ${brand}`
  return {
    title,
    description: isEn ? `Articles in ${label}.` : `Bài viết trong chủ đề ${label}.`,
  }
}

function hrefNews(
  locale: string,
  page: number,
  categorySlug: string
): string {
  const p = new URLSearchParams()
  if (page > 1) {
    p.set("page", String(page))
  }
  const qs = p.toString()
  return qs
    ? `/${locale}/news/category/${encodeURIComponent(categorySlug)}?${qs}`
    : `/${locale}/news/category/${encodeURIComponent(categorySlug)}`
}

export default async function NewsCategoryPage(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams
  const locale = params.countryCode
  const categorySlug = decodeURIComponent(params.slug).toLowerCase()

  const cats = await getCmsNewsCategories(locale)
  if (!cats.some((c) => c.slug === categorySlug)) {
    notFound()
  }

  const pageRaw = Number.parseInt(searchParams.page ?? "1", 10)
  const page =
    Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1
  const offset = (page - 1) * PAGE_SIZE

  const { articles: pageArticles, count: total } = await getCmsNewsList(
    locale,
    PAGE_SIZE,
    offset,
    { category_slug: categorySlug }
  )

  const m = getStorefrontMessages(locale)
  const isEn = locale === "en"
  const catMeta = cats.find((c) => c.slug === categorySlug)
  const titleLabel = catMeta?.title ?? categorySlug
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasPrev = page > 1
  const hasNext = page < totalPages

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
          <li>
            <Link href={`/${locale}/news`} className="hover:text-ui-fg-base">
              {isEn ? "News" : "Tin tức"}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-ui-fg-base line-clamp-1">{titleLabel}</li>
        </ol>
      </nav>

      <header className="max-w-4xl mb-8">
        <h1 className="text-3xl-semi text-ui-fg-base">{titleLabel}</h1>
        <p className="text-base-regular text-ui-fg-muted mt-2">
          {isEn
            ? "Posts in this category (including subcategories)."
            : "Bài trong chủ đề này (gồm cả chủ đề con)."}
        </p>
        <Link
          href={`/${locale}/news`}
          className="text-small-semi text-ui-fg-interactive hover:underline inline-block mt-3"
        >
          {isEn ? "← All news" : "← Tất cả tin"}
        </Link>
      </header>

      {pageArticles.length === 0 ? (
        <p className="text-ui-fg-muted">
          {isEn ? "No articles in this category." : "Chưa có bài trong chủ đề này."}
        </p>
      ) : (
        <>
          <ul className="grid grid-cols-1 small:grid-cols-2 large:grid-cols-3 gap-6 w-full mb-10">
            {pageArticles.map((a) => (
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
            <nav className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {hasPrev ? (
                <Link
                  href={hrefNews(locale, page - 1, categorySlug)}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-4 rounded-md border border-ui-border-base text-small-semi text-ui-fg-base hover:bg-ui-bg-subtle"
                >
                  {isEn ? "Previous" : "Trang trước"}
                </Link>
              ) : (
                <span className="min-h-[44px] inline-flex items-center justify-center px-4 rounded-md border border-ui-border-base text-ui-fg-muted opacity-50">
                  {isEn ? "Previous" : "Trang trước"}
                </span>
              )}
              <span className="text-small-regular text-ui-fg-muted px-2">
                {isEn ? "Page" : "Trang"} {page} / {totalPages}
              </span>
              {hasNext ? (
                <Link
                  href={hrefNews(locale, page + 1, categorySlug)}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-4 rounded-md border border-ui-border-base text-small-semi text-ui-fg-base hover:bg-ui-bg-subtle"
                >
                  {isEn ? "Next" : "Trang sau"}
                </Link>
              ) : (
                <span className="min-h-[44px] inline-flex items-center justify-center px-4 rounded-md border border-ui-border-base text-ui-fg-muted opacity-50">
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
