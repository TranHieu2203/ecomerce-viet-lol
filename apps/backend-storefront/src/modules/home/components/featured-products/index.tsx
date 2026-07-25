import { HttpTypes } from "@medusajs/types"
import ProductRail from "@modules/home/components/featured-products/product-rail"

/**
 * Thứ tự trang chủ lấy theo `metadata.homepage_rank` (số, nhỏ hơn = ưu tiên hơn) —
 * chỉnh trong Admin → Bộ sưu tập → Metadata. Collection chưa gán rank thì xếp sau,
 * theo đúng thứ tự API trả về (không đảo lộn không cần thiết).
 */
function homepageRank(collection: HttpTypes.StoreCollection): number {
  const raw = (collection.metadata as Record<string, unknown> | null)?.[
    "homepage_rank"
  ]
  const n = typeof raw === "number" ? raw : Number(raw)
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER
}

export default async function FeaturedProducts({
  collections,
  region,
  countryCode,
}: {
  collections: HttpTypes.StoreCollection[]
  region: HttpTypes.StoreRegion
  countryCode: string
}) {
  const ordered = collections
    .map((collection, index) => ({ collection, index }))
    .sort((a, b) => {
      const rankDiff = homepageRank(a.collection) - homepageRank(b.collection)
      return rankDiff !== 0 ? rankDiff : a.index - b.index
    })
    .map(({ collection }) => collection)

  return ordered.map((collection) => (
    <li key={collection.id}>
      <ProductRail
        collection={collection}
        region={region}
        countryCode={countryCode}
      />
    </li>
  ))
}
