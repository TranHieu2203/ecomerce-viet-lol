import { getCmsSettingsPublic, resolveCmsSiteTitle } from "@lib/data/cms"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import { displayProduct } from "@lib/util/i18n-catalog"
import { normalizeMedusaAssetUrl } from "@lib/util/cms-assets"
import { getBaseURL } from "@lib/util/env"
import { getProductPrice } from "@lib/util/get-product-price"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"

/** Serialize JSON-LD an toàn: tránh `</script>` cắt sớm thẻ script khi dữ liệu chứa chuỗi lạ. */
function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}

// Layout uses cookies() (cart, auth) → force dynamic to avoid DYNAMIC_SERVER_USAGE
// in ISR context caused by generateStaticParams + cookies() conflict.
export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}


function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
): HttpTypes.StoreProductImage[] {
  if (!selectedVariantId || !product.variants) {
    return product.images ?? []
  }

  const variant = product.variants!.find((v) => v.id === selectedVariantId)
  const vImages = variant?.images
  if (!variant || !vImages?.length) {
    return product.images ?? []
  }

  const imageIdsMap = new Map(vImages.map((i) => [i.id, true]))
  return (product.images ?? []).filter((i) => imageIdsMap.has(i.id))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const [product, cms] = await Promise.all([
    listProducts({
      countryCode: params.countryCode,
      queryParams: { handle },
    }).then(({ response }) => response.products[0]),
    getCmsSettingsPublic(),
  ])

  if (!product) {
    notFound()
  }

  const m = getStorefrontMessages(params.countryCode)
  const brand = resolveCmsSiteTitle(params.countryCode, cms, m)
  const { title: metaTitle, description: metaDesc } = displayProduct(
    params.countryCode,
    product.title,
    product.description,
    product.metadata as Record<string, unknown> | null | undefined
  )
  const pageTitle = `${metaTitle} | ${brand}`
  const description = (metaDesc || metaTitle).trim() || metaTitle
  const canonical = `${getBaseURL()}/${params.countryCode}/products/${handle}`

  return {
    title: pageTitle,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: pageTitle,
      description,
      url: canonical,
      images: product.thumbnail
        ? [normalizeMedusaAssetUrl(product.thumbnail) || product.thumbnail]
        : [],
    },
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const region = await getRegion(params.countryCode)
  const searchParams = await props.searchParams

  const selectedVariantId = searchParams.v_id

  if (!region) {
    notFound()
  }

  const pricedProduct = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle: params.handle },
  }).then(({ response }) => response.products[0])

  if (!pricedProduct) {
    notFound()
  }

  const images = getImagesForVariant(pricedProduct, selectedVariantId)

  const cms = await getCmsSettingsPublic()
  const m = getStorefrontMessages(params.countryCode)
  const brand = resolveCmsSiteTitle(params.countryCode, cms, m)
  const { title, description } = displayProduct(
    params.countryCode,
    pricedProduct.title,
    pricedProduct.description,
    pricedProduct.metadata as Record<string, unknown> | null | undefined
  )
  const { cheapestPrice } = getProductPrice({ product: pricedProduct })
  const canonical = `${getBaseURL()}/${params.countryCode}/products/${params.handle}`
  const inStock = (pricedProduct.variants ?? []).some(
    (v) =>
      v.inventory_quantity == null ||
      v.inventory_quantity > 0 ||
      v.allow_backorder
  )

  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    description: description || title,
    url: canonical,
    ...(images[0]?.url
      ? { image: images.map((i) => normalizeMedusaAssetUrl(i.url) || i.url) }
      : {}),
    ...(pricedProduct.variants?.[0]?.sku
      ? { sku: pricedProduct.variants[0].sku }
      : {}),
    brand: {
      "@type": "Brand",
      name: brand,
    },
    ...(cheapestPrice
      ? {
          offers: {
            "@type": "Offer",
            url: canonical,
            priceCurrency: cheapestPrice.currency_code.toUpperCase(),
            price: cheapestPrice.calculated_price_number,
            availability: inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
          },
        }
      : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(productJsonLd) }}
      />
      <ProductTemplate
        product={pricedProduct}
        region={region}
        countryCode={params.countryCode}
        images={images}
      />
    </>
  )
}
