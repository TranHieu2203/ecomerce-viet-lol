import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  batchPriceListPricesWorkflow,
  createPriceListsWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows"

const CURRENCY = "vnd"
const DEFAULT_PRICE_LIST_TITLE = "Giá khuyến mãi"

type VariantPricing = {
  id: string
  title: string
  price_set_id: string | null
  /** Giá gốc — số bị gạch ngang trên web. */
  base_amount: number | null
  /** Giá bán thực tế; null nghĩa là không giảm giá. */
  sale_amount: number | null
  sale_price_id: string | null
  price_list_id: string | null
  price_list_title: string | null
}

/** Giá gốc + giá bán của từng phiên bản, gom từ hai nơi khác nhau của Medusa. */
async function readPricing(
  req: AuthenticatedMedusaRequest,
  productId: string
): Promise<VariantPricing[]> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const pricingModule = req.scope.resolve(Modules.PRICING)

  const { data: variants } = await query.graph({
    entity: "variant",
    fields: [
      "id",
      "title",
      "price_set.id",
      "price_set.prices.id",
      "price_set.prices.amount",
      "price_set.prices.currency_code",
    ],
    filters: { product_id: productId },
  })

  // Giá khuyến mãi nằm trong price list, gắn theo price_set chứ không theo
  // variant — phải lấy riêng rồi ghép lại.
  const priceLists = await pricingModule.listPriceLists(
    {},
    { relations: ["prices"] }
  )

  const saleByPriceSet = new Map<
    string,
    { priceId: string; amount: number; listId: string; listTitle: string }
  >()
  for (const pl of priceLists) {
    for (const p of (pl as unknown as { prices?: unknown[] }).prices ?? []) {
      const price = p as {
        id: string
        amount: number
        currency_code: string
        price_set_id?: string
      }
      if (!price.price_set_id || price.currency_code !== CURRENCY) {
        continue
      }
      saleByPriceSet.set(price.price_set_id, {
        priceId: price.id,
        amount: Number(price.amount),
        listId: pl.id,
        listTitle: pl.title ?? "",
      })
    }
  }

  return variants.map((v: Record<string, unknown>) => {
    const ps = v.price_set as
      | { id: string; prices?: { amount: number; currency_code: string }[] }
      | null
      | undefined
    const base = ps?.prices?.find((p) => p.currency_code === CURRENCY)
    const sale = ps?.id ? saleByPriceSet.get(ps.id) : undefined

    return {
      id: String(v.id),
      title: String(v.title ?? ""),
      price_set_id: ps?.id ?? null,
      base_amount: base ? Number(base.amount) : null,
      sale_amount: sale ? sale.amount : null,
      sale_price_id: sale ? sale.priceId : null,
      price_list_id: sale ? sale.listId : null,
      price_list_title: sale ? sale.listTitle : null,
    }
  })
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { productId } = req.params
  res.json({ currency_code: CURRENCY, variants: await readPricing(req, productId) })
}

/**
 * Lưu giá cho nhiều phiên bản một lượt.
 *
 * Body: { variants: [{ id, base_amount, sale_amount }] }
 *  - `sale_amount` là null hoặc rỗng => bỏ khuyến mãi, web chỉ hiện một giá.
 *  - `sale_amount` >= `base_amount` bị từ chối, vì như vậy web sẽ hiện giá gạch
 *    ngang thấp hơn giá bán — nhìn như tăng giá.
 */
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { productId } = req.params
  const pricingModule = req.scope.resolve(Modules.PRICING)
  const body = (req.body ?? {}) as {
    variants?: { id: string; base_amount?: unknown; sale_amount?: unknown }[]
  }

  const rows = Array.isArray(body.variants) ? body.variants : []
  if (!rows.length) {
    return res.status(400).json({ message: "Không có phiên bản nào để lưu" })
  }

  const current = await readPricing(req, productId)
  const byId = new Map(current.map((c) => [c.id, c]))

  const num = (v: unknown): number | null => {
    if (v === null || v === undefined || v === "") {
      return null
    }
    const n = Number(v)
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : null
  }

  // ----- kiểm tra trước khi ghi, tránh sửa được một nửa rồi lỗi -----
  const baseUpdates: { id: string; prices: { amount: number; currency_code: string }[] }[] = []
  const wanted: { row: VariantPricing; base: number; sale: number | null }[] = []

  for (const r of rows) {
    const cur = byId.get(r.id)
    if (!cur) {
      return res.status(400).json({ message: `Không tìm thấy phiên bản ${r.id}` })
    }
    const base = num(r.base_amount) ?? cur.base_amount
    if (base === null || base <= 0) {
      return res
        .status(400)
        .json({ message: `"${cur.title}": giá gốc phải lớn hơn 0` })
    }
    const sale = num(r.sale_amount)
    if (sale !== null && sale >= base) {
      return res.status(400).json({
        message: `"${cur.title}": giá bán phải nhỏ hơn giá gốc, nếu không web sẽ hiện giá gạch ngang thấp hơn giá bán`,
      })
    }
    wanted.push({ row: cur, base, sale })
    if (base !== cur.base_amount) {
      baseUpdates.push({
        id: cur.id,
        prices: [{ amount: base, currency_code: CURRENCY }],
      })
    }
  }

  // ----- 1) giá gốc -----
  if (baseUpdates.length) {
    await updateProductVariantsWorkflow(req.scope).run({
      input: { product_variants: baseUpdates },
    })
  }

  // ----- 2) giá khuyến mãi -----
  const needList = wanted.some((w) => w.sale !== null && !w.row.price_list_id)
  let fallbackListId: string | null = null

  if (needList) {
    const lists = await pricingModule.listPriceLists({})
    const existing = lists.find((l) => l.title === DEFAULT_PRICE_LIST_TITLE)
    if (existing) {
      fallbackListId = existing.id
    } else {
      const { result } = await createPriceListsWorkflow(req.scope).run({
        input: {
          price_lists_data: [
            {
              title: DEFAULT_PRICE_LIST_TITLE,
              description:
                "Tự động tạo khi đặt giá khuyến mãi từ trang chi tiết sản phẩm.",
              status: "active" as const,
              prices: [],
            },
          ],
        },
      })
      fallbackListId = (result as { id: string }[])[0]?.id ?? null
    }
  }

  // Gom thao tác theo từng price list vì workflow chỉ nhận một list mỗi lần.
  const ops = new Map<
    string,
    {
      create: { amount: number; currency_code: string; variant_id: string }[]
      update: { id: string; amount: number; currency_code: string; variant_id: string }[]
      delete: string[]
    }
  >()
  const opFor = (listId: string) => {
    if (!ops.has(listId)) {
      ops.set(listId, { create: [], update: [], delete: [] })
    }
    return ops.get(listId)!
  }

  for (const w of wanted) {
    const { row, sale } = w

    if (sale === null) {
      if (row.sale_price_id && row.price_list_id) {
        opFor(row.price_list_id).delete.push(row.sale_price_id)
      }
      continue
    }
    if (sale === row.sale_amount) {
      continue
    }

    if (row.sale_price_id && row.price_list_id) {
      opFor(row.price_list_id).update.push({
        id: row.sale_price_id,
        amount: sale,
        currency_code: CURRENCY,
        variant_id: row.id,
      })
    } else if (fallbackListId) {
      opFor(fallbackListId).create.push({
        amount: sale,
        currency_code: CURRENCY,
        variant_id: row.id,
      })
    }
  }

  for (const [listId, op] of ops.entries()) {
    if (!op.create.length && !op.update.length && !op.delete.length) {
      continue
    }
    await batchPriceListPricesWorkflow(req.scope).run({
      input: { data: { id: listId, ...op } as never },
    })
  }

  res.json({ variants: await readPricing(req, productId) })
}
