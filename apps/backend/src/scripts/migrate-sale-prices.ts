/**
 * Tạo hiển thị "giá cũ gạch ngang — giá mới" cho toàn bộ sản phẩm: giá hiện
 * tại (đã lấy trực tiếp qua Store API — đúng số khách đang thấy) giữ nguyên
 * làm giá bán (qua price list loại sale), giá gốc mới = giá hiện tại × 1.18
 * (làm tròn nghìn) làm giá gạch ngang.
 *
 * Chạy: npx medusa exec ./src/scripts/migrate-sale-prices.ts
 * (chỉ chạy 1 lần — script tự bỏ qua nếu price list đã tồn tại; xoá price
 * list "Giá gốc (tự động)" trong Admin nếu cần chạy lại với hệ số khác)
 */
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  updateProductVariantsWorkflow,
  createPriceListsWorkflow,
} from "@medusajs/medusa/core-flows"

const MARKUP = 1.18
const ROUND_TO = 1000
const SALE_PRICE_LIST_TITLE = "Giá gốc (tự động)"

// Giá VND hiện tại theo variant — lấy trực tiếp từ Store API (calculated_price
// thật, đúng số khách đang thấy) để tránh phụ thuộc lại vào ngữ cảnh tính giá
// bên trong script.
const CURRENT_PRICES: { variant_id: string; title: string; amount: number }[] = [
  { variant_id: "variant_01KNW3W9YJ7H8XDJ34TDM10P2D", title: "Saffron", amount: 439000 },
  { variant_id: "variant_01KNW3WA4SN5WB7RCT4N25F8SA", title: "KEM CHỐNG NẮNG KIỀM DẦU NÂNG TÔNG SPF50+ PA++++", amount: 550000 },
  { variant_id: "variant_01KNW3WA9QVXPD802V9VP68D5Z", title: "TINH CHẤT NHỤY HOA NGHỆ TÂY VITAMIN B5", amount: 1045000 },
  { variant_id: "variant_01KNW3WAEJE54GH7GWJXJP368V", title: "Bột rửa mặt", amount: 605000 },
  { variant_id: "variant_01KNW3WAS5QKTJ2MYBVKAAK62V", title: "XỊT KHOÁNG NHỤY HOA NGHỆ TÂY 3 TRONG 1", amount: 439000 },
  { variant_id: "variant_01KNW3WB2VT1VSWGMRG8QN0JVJ", title: "Quà Trung Thu", amount: 685000 },
  { variant_id: "variant_01KNW3WB7BJBQDXY9FDKYVZ2DQ", title: "Quà Tết", amount: 1014000 },
  { variant_id: "variant_01KNW3WBSBYTCZHF8AZBQ1YPNH", title: "Gia công bánh Trung Thu", amount: 1461000 },
  { variant_id: "variant_01KNW3WCGWY0ZZDJJD17P65ZMC", title: "Mật Ong Rừng", amount: 1311000 },
  { variant_id: "variant_01KNW3WCT0H6JGNNJF7NTT4H4Z", title: "Hạt Điều", amount: 382000 },
  { variant_id: "variant_01KNW3WCYJVYGVZ2JNHY43E81H", title: "Hạt Macca", amount: 1260000 },
  { variant_id: "variant_01KNW3WD2RWRM3586NF3X6Y6AF", title: "Dừa sấy", amount: 1355000 },
  { variant_id: "variant_01KNW3WD6KNXGS2PTMD2SARXYJ", title: "Xoài Sấy Dẻo", amount: 1204000 },
  { variant_id: "variant_01KNW3WDFCARMRJCK9RA3SAZMW", title: "Đu Đủ Sấy Dẻo", amount: 655000 },
  { variant_id: "variant_01KT3R0JAMPPN7GE3AG1J4Q6CQ", title: "KEM CHỐNG NẮNG DƯỠNG ẨM SPF50+ PA++++", amount: 550000 },
  { variant_id: "variant_01KY7NE1HTARC6VPR68ZCJC0FF", title: "Bánh Nướng Thập Cẩm", amount: 65000 },
  { variant_id: "variant_01KYBKV9RV7SVFD1VNYPTAFX4V", title: "Bánh Nướng Đậu Xanh", amount: 60000 },
]

function roundTo(amount: number, step: number): number {
  return Math.round(amount / step) * step
}

export default async function migrateSalePricesScript({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const pricingModule = container.resolve(Modules.PRICING)

  const existingLists = await pricingModule.listPriceLists({
    q: SALE_PRICE_LIST_TITLE,
  })
  if (existingLists.length > 0) {
    logger.warn(
      `Price list "${SALE_PRICE_LIST_TITLE}" đã tồn tại (id=${existingLists[0].id}) — bỏ qua để tránh tạo trùng. Xoá thủ công trong Admin nếu muốn chạy lại.`
    )
    return
  }

  const variantUpdates = CURRENT_PRICES.map((p) => ({
    id: p.variant_id,
    prices: [{ amount: roundTo(p.amount * MARKUP, ROUND_TO), currency_code: "vnd" }],
  }))
  const salePrices = CURRENT_PRICES.map((p) => ({
    variant_id: p.variant_id,
    amount: p.amount,
    currency_code: "vnd",
  }))

  for (const p of CURRENT_PRICES) {
    const original = roundTo(p.amount * MARKUP, ROUND_TO)
    logger.info(
      `${p.title}: ${p.amount.toLocaleString("vi-VN")}đ (bán) ← ${original.toLocaleString("vi-VN")}đ (gốc, gạch ngang)`
    )
  }

  logger.info(`Cập nhật giá gốc (base price) cho ${variantUpdates.length} variant...`)
  await updateProductVariantsWorkflow(container).run({
    input: { product_variants: variantUpdates },
  })

  logger.info(
    `Tạo price list "sale" giữ nguyên giá bán hiện tại cho ${salePrices.length} variant...`
  )
  await createPriceListsWorkflow(container).run({
    input: {
      price_lists_data: [
        {
          title: SALE_PRICE_LIST_TITLE,
          description:
            "Tự động tạo — giữ nguyên giá bán hiện tại làm giá sale sau khi nâng giá gốc để hiển thị giá gạch ngang.",
          status: "active" as const,
          prices: salePrices,
        },
      ],
    },
  })

  logger.info("Hoàn tất migrate giá gốc/giá sale.")
}
