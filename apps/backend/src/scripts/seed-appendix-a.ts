import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  createProductsWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import type { CreateProductOptionDTO } from "@medusajs/types"

const I18N = (vi: { title: string; description?: string }, en?: { title: string; description?: string }) => ({
  i18n: {
    vi: { title: vi.title, description: vi.description ?? "" },
    ...(en
      ? { en: { title: en.title, description: en.description ?? "" } }
      : {}),
  },
})

export async function seedAppendixA({
  container,
  salesChannelId,
  shippingProfileId,
}: {
  container: MedusaContainer
  salesChannelId: string
  shippingProfileId: string
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const productModule = container.resolve(Modules.PRODUCT)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info("Seeding Phụ lục A (collections + catalog)…")

  const collectionDefs: {
    handle: string
    title: string
    metadata?: Record<string, unknown>
  }[] = [
    {
      handle: "saffron",
      title: "Saffron",
      metadata: I18N(
        { title: "Saffron", description: "Saffron cao cấp" },
        { title: "Saffron", description: "Premium saffron" }
      ),
    },
    {
      handle: "my-pham",
      title: "Mỹ phẩm",
      metadata: I18N(
        { title: "Mỹ phẩm", description: "Chăm sóc da" },
        { title: "Cosmetics", description: "Skincare" }
      ),
    },
    {
      handle: "qua-doanh-nghiep",
      title: "Quà doanh nghiệp",
      metadata: I18N(
        {
          title: "Quà doanh nghiệp",
          description: "Quà tặng doanh nghiệp",
        },
        { title: "Corporate gifts" }
      ),
    },
    {
      handle: "qua-theo-nhu-cau",
      title: "Quà theo nhu cầu",
      metadata: I18N(
        { title: "Quà theo nhu cầu" },
        { title: "Custom gifts" }
      ),
    },
    {
      handle: "nong-san-viet",
      title: "Nông sản Việt",
      metadata: I18N(
        { title: "Nông sản Việt" },
        { title: "Vietnamese agricultural" }
      ),
    },
    {
      handle: "qua-theo-nhu-cau-duoi-500k",
      title: "Ngân sách dưới 500k",
      metadata: {
        ...I18N(
          { title: "Ngân sách dưới 500k" },
          { title: "Under 500k VND" }
        ),
        parent_collection_handle: "qua-theo-nhu-cau",
      },
    },
    {
      handle: "qua-theo-nhu-cau-500-1000k",
      title: "Ngân sách 500–1000k",
      metadata: {
        ...I18N(
          { title: "Ngân sách 500–1000k" },
          { title: "500k–1M VND" }
        ),
        parent_collection_handle: "qua-theo-nhu-cau",
      },
    },
    {
      handle: "qua-theo-nhu-cau-tren-1000k",
      title: "Ngân sách trên 1000k",
      metadata: {
        ...I18N(
          { title: "Ngân sách trên 1000k" },
          { title: "Over 1M VND" }
        ),
        parent_collection_handle: "qua-theo-nhu-cau",
      },
    },
  ]

  for (const c of collectionDefs) {
    const { data: found } = await query.graph({
      entity: "product_collection",
      fields: ["id"],
      filters: { handle: c.handle },
    })
    const existing = found?.[0] as { id: string } | undefined
    if (existing?.id) {
      await productModule.updateProductCollections(existing.id, {
        title: c.title,
        metadata: c.metadata ?? {},
      })
    } else {
      await productModule.createProductCollections({
        handle: c.handle,
        title: c.title,
        metadata: c.metadata ?? {},
      })
    }
  }

  const byHandle = async (handle: string) => {
    const { data: cols } = await query.graph({
      entity: "product_collection",
      fields: ["id", "handle"],
      filters: { handle },
    })
    return (cols?.[0] as { id?: string } | undefined)?.id
  }

  const ensureProductType = async (value: string) => {
    const { data: existing } = await query.graph({
      entity: "product_type",
      fields: ["id", "value"],
      filters: { value },
    })
    const row = existing?.[0] as { id: string; value?: string } | undefined
    if (row?.id) {
      return { id: row.id, value: row.value ?? value }
    }
    const [created] = await productModule.createProductTypes([{ value }])
    return { id: created.id, value }
  }

  const typeTrungThu = await ensureProductType("Quà Trung Thu")
  const typeTet = await ensureProductType("Quà Tết")

  type ProductSeed = {
    handle: string
    title: string
    collectionHandle: string
    description?: string
    metadata?: Record<string, unknown>
    typeId?: string
    options?: CreateProductOptionDTO[]
    // workflow accepts prices on variants though DTO type omits them
    variants?: Record<string, unknown>[]
  }

  const currencyPrices = (amountVnd: number) => [
    { amount: amountVnd, currency_code: "vnd" },
  ]

  const simpleProduct = (
    handle: string,
    titleVi: string,
    titleEn: string,
    col: string,
    priceVnd: number,
    descVi?: string,
    descEn?: string
  ): ProductSeed => ({
    handle,
    title: titleVi,
    collectionHandle: col,
    description: descVi ?? "",
    metadata: I18N(
      { title: titleVi, description: descVi ?? "" },
      { title: titleEn, description: descEn ?? descVi ?? "" }
    ),
    options: [{ title: "Default", values: ["Default"] }],
    variants: [
      {
        title: "Default",
        sku: handle.toUpperCase().replace(/-/g, "_"),
        options: { Default: "Default" },
        prices: currencyPrices(priceVnd),
      },
    ],
  })

  const products: ProductSeed[] = [
    simpleProduct(
      "saffron-cao-cap",
      "Saffron cao cấp",
      "Premium Saffron",
      "saffron",
      890000,
      "Saffron nguyên chất.",
      "Pure saffron."
    ),
    simpleProduct(
      "kem-chong-nang",
      "Kem chống nắng",
      "Sunscreen",
      "my-pham",
      350000
    ),
    simpleProduct(
      "serum-b5",
      "Serum B5",
      "B5 Serum",
      "my-pham",
      420000
    ),
    simpleProduct(
      "bot-rua-mat",
      "Bột rửa mặt",
      "Cleansing powder",
      "my-pham",
      180000
    ),
    simpleProduct("mash", "Mash", "Mash", "my-pham", 95000),
    simpleProduct(
      "xit-khoang-3in1",
      "Xịt khoáng 3in1",
      "3in1 facial mist",
      "my-pham",
      220000
    ),
    {
      handle: "gia-cong-banh-trung-thu",
      title: "Gia công bánh Trung Thu",
      collectionHandle: "qua-doanh-nghiep",
      description: "Đặt làm bánh Trung Thu theo yêu cầu.",
      metadata: I18N(
        {
          title: "Gia công bánh Trung Thu",
          description: "Đặt làm bánh Trung Thu theo yêu cầu.",
        },
        {
          title: "Mooncake OEM",
          description: "Custom mooncake production.",
        }
      ),
      typeId: typeTrungThu.id,
      options: [{ title: "Box", values: ["2", "4", "6"] }],
      variants: [
        {
          title: "Hộp 2 bánh",
          sku: "TET-2",
          options: { Box: "2" },
          prices: currencyPrices(250000),
        },
        {
          title: "Hộp 4 bánh",
          sku: "TET-4",
          options: { Box: "4" },
          prices: currencyPrices(480000),
        },
        {
          title: "Hộp 6 bánh",
          sku: "TET-6",
          options: { Box: "6" },
          prices: currencyPrices(690000),
        },
      ],
    },
    simpleProduct(
      "mat-ong-rung",
      "Mật ong rừng",
      "Wild honey",
      "nong-san-viet",
      210000
    ),
    simpleProduct(
      "hat-dieu",
      "Hạt điều",
      "Cashews",
      "nong-san-viet",
      165000
    ),
    simpleProduct(
      "hat-macca",
      "Hạt macca",
      "Macadamia",
      "nong-san-viet",
      195000
    ),
    simpleProduct("dua-say", "Dừa sấy", "Dried coconut", "nong-san-viet", 85000),
    simpleProduct(
      "xoai-say-deo",
      "Xoài sấy dẻo",
      "Dried mango",
      "nong-san-viet",
      75000
    ),
    simpleProduct("mit-say", "Mít sấy", "Dried jackfruit", "nong-san-viet", 72000),
    simpleProduct(
      "du-du-say-deo",
      "Đu đủ sấy dẻo",
      "Dried papaya",
      "nong-san-viet",
      68000
    ),
  ]

  const upsertProduct = async (p: ProductSeed) => {
    const collectionId = await byHandle(p.collectionHandle)
    if (!collectionId) {
      logger.warn(`Skip product ${p.handle}: collection missing`)
      return
    }
    const existing = await productModule.listProducts({ handle: p.handle })
    const body = {
      title: p.title,
      description: p.description ?? "",
      handle: p.handle,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      collection_id: collectionId,
      metadata: p.metadata,
      ...(p.typeId ? { type_id: p.typeId } : {}),
      ...(p.options ? { options: p.options } : {}),
      ...(p.variants ? { variants: p.variants } : {}),
      sales_channels: [{ id: salesChannelId }],
    }

    if (existing.length) {
      await updateProductsWorkflow(container).run({
        input: {
          selector: { id: existing[0].id },
          update: {
            title: body.title,
            description: body.description,
            metadata: body.metadata,
            collection_id: collectionId,
            ...(p.typeId ? { type_id: p.typeId } : {}),
          },
        },
      })
      return
    }

    await createProductsWorkflow(container).run({
      input: { products: [body as never] },
    })
  }

  for (const p of products) {
    await upsertProduct(p)
  }

  logger.info(
    `Phụ lục A seed completed. Product type placeholder: ${typeTet?.value ?? "Quà Tết"}.`
  )
}
