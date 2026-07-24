import { getBaseURL } from "@lib/util/env"
import { getCmsNewsList, getCmsSettingsPublic, listCmsPagesPublic } from "@lib/data/cms"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"
import type { MetadataRoute } from "next"

const PRODUCT_PAGE_LIMIT = 100
const PRODUCT_PAGE_SAFETY_CAP = 50 // ~5000 sản phẩm, đủ dư cho catalog hiện tại
const NEWS_PAGE_SIZE = 100

async function resolveEnabledLocales(): Promise<string[]> {
  const cms = await getCmsSettingsPublic()
  const raw = Array.isArray(cms.enabled_locales) ? cms.enabled_locales : []
  const enabled = raw.filter(
    (x): x is string => typeof x === "string" && x.length > 0
  )
  return enabled.length > 0 ? enabled : ["vi", "en"]
}

async function listAllProductHandles(
  countryCode: string
): Promise<{ handle: string; updatedAt?: string }[]> {
  const out: { handle: string; updatedAt?: string }[] = []
  let page = 1

  while (page <= PRODUCT_PAGE_SAFETY_CAP) {
    const { response, nextPage } = await listProducts({
      pageParam: page,
      countryCode,
      queryParams: {
        limit: PRODUCT_PAGE_LIMIT,
        fields: "id,handle,updated_at",
      },
    })

    for (const p of response.products) {
      if (p.handle) {
        out.push({ handle: p.handle, updatedAt: p.updated_at ?? undefined })
      }
    }

    if (!nextPage) {
      break
    }
    page = nextPage
  }

  return out
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseURL().replace(/\/$/, "")
  const locales = await resolveEnabledLocales()
  const defaultLocale = locales[0]

  const [productHandles, { collections }, categories, cmsPagesByLocale, newsByLocale] =
    await Promise.all([
      listAllProductHandles(defaultLocale).catch(() => []),
      listCollections({ fields: "id, handle, updated_at" }).catch(() => ({
        collections: [],
        count: 0,
      })),
      listCategories({ limit: 200, fields: "id, handle, updated_at" }).catch(
        () => []
      ),
      Promise.all(
        locales.map((locale) =>
          listCmsPagesPublic(locale).then(
            (pages) => [locale, pages] as const
          )
        )
      ).then((entries) => new Map(entries)),
      Promise.all(
        locales.map((locale) =>
          getCmsNewsList(locale, NEWS_PAGE_SIZE, 0).then(
            ({ articles }) => [locale, articles] as const
          )
        )
      ).then((entries) => new Map(entries)),
    ])

  const entries: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    entries.push({
      url: `${baseUrl}/${locale}`,
      changeFrequency: "daily",
      priority: 1,
    })
    entries.push({
      url: `${baseUrl}/${locale}/store`,
      changeFrequency: "daily",
      priority: 0.8,
    })
    entries.push({
      url: `${baseUrl}/${locale}/news`,
      changeFrequency: "daily",
      priority: 0.6,
    })

    for (const p of productHandles) {
      entries.push({
        url: `${baseUrl}/${locale}/products/${p.handle}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
        changeFrequency: "weekly",
        priority: 0.9,
      })
    }

    for (const c of collections) {
      if (!c.handle) {
        continue
      }
      entries.push({
        url: `${baseUrl}/${locale}/collections/${c.handle}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : undefined,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    }

    for (const c of categories) {
      if (!c.handle) {
        continue
      }
      entries.push({
        url: `${baseUrl}/${locale}/categories/${c.handle}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : undefined,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    }

    for (const page of cmsPagesByLocale.get(locale) ?? []) {
      entries.push({
        url: `${baseUrl}/${locale}/p/${page.slug}`,
        changeFrequency: "monthly",
        priority: 0.5,
      })
    }

    for (const article of newsByLocale.get(locale) ?? []) {
      entries.push({
        url: `${baseUrl}/${locale}/news/${encodeURIComponent(article.slug)}`,
        lastModified: article.published_at
          ? new Date(article.published_at)
          : undefined,
        changeFrequency: "monthly",
        priority: 0.5,
      })
    }
  }

  return entries
}
