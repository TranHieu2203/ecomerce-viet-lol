import { getCmsSettingsPublic, resolveCmsSiteTitle } from "@lib/data/cms"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import { displayProduct } from "@lib/util/i18n-catalog"
import { SUPPORTED_LOCALES } from "@lib/util/locales"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

export async function generateStaticParams() {
  try {
    const promises = SUPPORTED_LOCALES.map(async (country) => {
      const { response } = await listProducts({
        countryCode: country,
        queryParams: { limit: 100, fields: "handle" },
      })

      return {
        country,
        products: response.products,
      }
    })

    const countryProducts = await Promise.all(promises)

    return countryProducts
      .flatMap((countryData) =>
        countryData.products.map((product) => ({
          countryCode: countryData.country,
          handle: product.handle,
        }))
      )
      .filter((param) => param.handle)
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
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

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
      images: product.thumbnail ? [product.thumbnail] : [],
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

  return (
    <ProductTemplate
      product={pricedProduct}
      region={region}
      countryCode={params.countryCode}
      images={images}
    />
  )
}
