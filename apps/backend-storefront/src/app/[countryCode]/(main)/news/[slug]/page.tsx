import {
  getCmsNewsArticle,
  getCmsNewsList,
  getCmsSettingsPublic,
  resolveCmsSiteTitle,
} from "@lib/data/cms"
import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
  searchParams: Promise<{ cms_preview?: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const searchParams = await props.searchParams
  const preview =
    typeof searchParams.cms_preview === "string" &&
    searchParams.cms_preview.trim().length > 0
      ? searchParams.cms_preview.trim()
      : undefined

  const [article, cms] = await Promise.all([
    getCmsNewsArticle(params.slug, params.countryCode, preview),
    getCmsSettingsPublic(),
  ])

  if (!article) {
    notFound()
  }

  const m = getStorefrontMessages(params.countryCode)
  const brand = resolveCmsSiteTitle(
    params.countryCode,
    cms,
    m,
    m.home.metaFallbackTitle
  )
  const metaTitle = article.meta_title?.trim() || article.title
  const metaDesc =
    article.meta_description?.trim() ||
    article.excerpt?.trim() ||
    m.home.metaDescription

  const title = `${metaTitle} | ${brand}`
  const ogImages =
    article.featured_image_url && !preview
      ? [article.featured_image_url]
      : cms.og_image_url
        ? [cms.og_image_url]
        : []

  return {
    title,
    description: metaDesc,
    openGraph: {
      title,
      description: metaDesc,
      images: ogImages,
    },
  }
}

export default async function NewsArticlePage(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams
  const preview =
    typeof searchParams.cms_preview === "string" &&
    searchParams.cms_preview.trim().length > 0
      ? searchParams.cms_preview.trim()
      : undefined

  const article = await getCmsNewsArticle(
    params.slug,
    params.countryCode,
    preview
  )
  if (!article) {
    notFound()
  }

  const primaryCategorySlug = article.categories?.[0]?.slug
  const newsPool = await getCmsNewsList(
    params.countryCode,
    24,
    0,
    primaryCategorySlug
      ? { category_slug: primaryCategorySlug }
      : undefined
  )

  const m = getStorefrontMessages(params.countryCode)
  const isEn = params.countryCode === "en"
  const related = newsPool.articles
    .filter((a) => a.slug !== params.slug)
    .slice(0, 3)

  return (
    <div className="flex flex-col w-full py-8 small:py-12 px-4 small:px-8">
      {article.status === "draft" && preview ? (
        <p className="text-small-regular text-ui-fg-muted mb-4" role="status">
          {isEn ? "Preview — draft" : "Xem trước — bản nháp"}
        </p>
      ) : null}

      <nav
        className="text-small-regular text-ui-fg-muted mb-6"
        aria-label="Breadcrumb"
      >
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <Link
              href={`/${params.countryCode}`}
              className="hover:text-ui-fg-base"
            >
              {m.sideMenu.home}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link
              href={`/${params.countryCode}/news`}
              className="hover:text-ui-fg-base"
            >
              {isEn ? "News" : "Tin tức"}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-ui-fg-base line-clamp-1">{article.title}</li>
        </ol>
      </nav>

      <article className="max-w-3xl w-full mx-auto">
        {article.published_at ? (
          <time
            dateTime={article.published_at}
            className="text-small-regular text-ui-fg-muted block mb-3"
          >
            {new Date(article.published_at).toLocaleDateString(
              isEn ? "en-US" : "vi-VN"
            )}
          </time>
        ) : null}
        <h1 className="text-3xl-semi text-ui-fg-base mb-4">{article.title}</h1>
        {(article.categories?.length || article.tags?.length) ? (
          <div className="flex flex-wrap gap-2 mb-6">
            {article.categories?.map((c) => (
              <Link
                key={`c-${c.slug}`}
                href={`/${params.countryCode}/news/category/${encodeURIComponent(c.slug)}`}
                className="text-xsmall-regular rounded-full border border-ui-border-base bg-ui-bg-subtle px-2.5 py-1 text-ui-fg-base hover:border-ui-border-strong"
              >
                {c.title}
              </Link>
            ))}
            {article.tags?.map((t) => (
              <Link
                key={`t-${t.slug}`}
                href={`/${params.countryCode}/news?tag_slug=${encodeURIComponent(t.slug)}`}
                className="text-xsmall-regular rounded-full border border-dashed border-ui-border-base px-2.5 py-1 text-ui-fg-muted hover:text-ui-fg-base"
              >
                #{t.title}
              </Link>
            ))}
          </div>
        ) : null}
        {article.featured_image_url ? (
          <div className="mb-8 rounded-lg overflow-hidden border border-ui-border-base max-h-[min(50vh,420px)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.featured_image_url}
              alt=""
              className="w-full h-full max-h-[min(50vh,420px)] object-cover"
            />
          </div>
        ) : null}
        {article.excerpt ? (
          <p className="text-lg-regular text-ui-fg-muted mb-8 border-l-2 border-ui-border-strong pl-4">
            {article.excerpt}
          </p>
        ) : null}
        <div
          className="cms-page-body max-w-[72ch] text-base-regular text-ui-fg-base leading-[1.65] [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:underline [&_a]:text-ui-fg-interactive [&_table]:w-full [&_table]:my-4 [&_table]:text-sm [&_td]:border [&_td]:border-ui-border-base [&_td]:p-2 [&_th]:border [&_th]:border-ui-border-base [&_th]:bg-ui-bg-subtle [&_th]:p-2 [&_th]:text-left"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />

        <div className="mt-12 pt-8 border-t border-ui-border-base">
          <Link
            href={`/${params.countryCode}/news`}
            className="text-small-semi text-ui-fg-interactive hover:underline inline-flex min-h-[44px] items-center"
          >
            {isEn ? "← All news" : "← Tất cả tin tức"}
          </Link>
        </div>

        {related.length > 0 ? (
          <section
            className="mt-10 pt-8 border-t border-ui-border-base"
            aria-labelledby="related-news-heading"
          >
            <h2
              id="related-news-heading"
              className="text-xl-semi text-ui-fg-base mb-4"
            >
              {isEn ? "Related articles" : "Tin liên quan"}
            </h2>
            <ul className="flex flex-col gap-4">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/${params.countryCode}/news/${encodeURIComponent(r.slug)}`}
                    className="text-base-regular text-ui-fg-interactive hover:underline"
                  >
                    {r.title || r.slug}
                  </Link>
                  {r.excerpt ? (
                    <p className="text-small-regular text-ui-fg-muted line-clamp-2 mt-1">
                      {r.excerpt}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </div>
  )
}
