/**
 * Tiếp tục migrate-sale-prices.ts cho các variant CHƯA có giá sale (chủ yếu
 * là các sản phẩm bánh Trung Thu được thêm sau đợt migrate đầu). Cùng công
 * thức: giá hiện tại (lấy trực tiếp qua Store API) giữ nguyên làm giá bán,
 * giá gốc mới = giá hiện tại × 1.18 (làm tròn nghìn) làm giá gạch ngang.
 *
 * Chạy: npx medusa exec ./src/scripts/migrate-sale-prices-round2.ts
 * (chỉ chạy 1 lần — script tự bỏ qua nếu price list đã tồn tại; xoá price
 * list "Giá gốc (tự động) — đợt 2" trong Admin nếu cần chạy lại)
 */
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  updateProductVariantsWorkflow,
  createPriceListsWorkflow,
} from "@medusajs/medusa/core-flows"

const MARKUP = 1.18
const ROUND_TO = 1000
const SALE_PRICE_LIST_TITLE = "Giá gốc (tự động) — đợt 2"

// Giá VND hiện tại theo variant — lấy trực tiếp từ Store API (calculated_price
// thật, đúng số khách đang thấy) cho các variant CHƯA nằm trong price list sale
// đầu tiên (chủ yếu là bánh Trung Thu thêm sau).
const CURRENT_PRICES: { variant_id: string; title: string; amount: number }[] = [
  { variant_id: "variant_01KYBMYGBE7JDE5YQJN089M47S", title: "Bánh Nướng Trà Xanh", amount: 60000 },
  { variant_id: "variant_01KYBQ0EHJJ4EPWEJPWABZZZJ1", title: "Bánh Nướng Khoai Môn", amount: 60000 },
  { variant_id: "variant_01KYBQW93J0WWAWJBEB2P9JAJF", title: "Bánh Nướng Đậu Đỏ", amount: 60000 },
  { variant_id: "variant_01KYBR276N5YY27K1CD62GDHTS", title: "Bánh Nướng Cốm Dừa", amount: 65000 },
  { variant_id: "variant_01KYBR8STXCC91VZRAWGHWQKMK", title: "Bánh Nướng Sen Nhuyễn", amount: 65000 },
  { variant_id: "variant_01KYBREBPVBG01VF1HPFF3BQT8", title: "Bánh Nướng Thập Cẩm Gà Quay", amount: 70000 },
  { variant_id: "variant_01KYBSDC452E22GT00RVPBN6PW", title: "Bánh Nướng Đậu Xanh Trứng Muối", amount: 60000 },
  { variant_id: "variant_01KYBSF24G7JWWCTXSYS6E3Q72", title: "Bánh Nướng Thập Cẩm Trứng Muối", amount: 70000 },
  { variant_id: "variant_01KYBSNAR6ZPAMKQ2TQWZ3YNFG", title: "Bánh Khoai Môn Mochi Chà Bông Trứng Muối", amount: 70000 },
  { variant_id: "variant_01KYBSQYEYQHNRXXY3JMXDMGJ7", title: "Bánh Nướng Matcha Dừa Non", amount: 70000 },
  { variant_id: "variant_01KYBSSM61J24D93T34T1PEHZ3", title: "Bánh Nướng Cafe Sữa Dừa", amount: 70000 },
  { variant_id: "variant_01KYBSV9315AWT3B16ZSS05YGV", title: "Bánh Nướng Dưa Lưới Xoài Dẻo", amount: 75000 },
  { variant_id: "variant_01KYBSYYTHZ34HMYT7STP869MG", title: "Bánh Nướng Nam Việt Quất", amount: 75000 },
  { variant_id: "variant_01KYBT2VZ7KRPC8YR68FP2GH8M", title: "Bánh Nướng Matcha Lava", amount: 70000 },
  { variant_id: "variant_01KYBT455N900FXM9XJ4YYJ541", title: "Bánh Nướng Socola Lava", amount: 70000 },
  { variant_id: "variant_01KYBT6VX813VK3SRCGH329XFT", title: "Bánh Dẻo Đậu Xanh", amount: 60000 },
  { variant_id: "variant_01KYBT9D11GBS7W86K2Q2TK00D", title: "Bánh Dẻo Trà Xanh", amount: 60000 },
  { variant_id: "variant_01KYBTAQYDT0Q29JF60C3WYXQ2", title: "Bánh Dẻo Khoai Môn", amount: 60000 },
  { variant_id: "variant_01KYBTNT9FD6T6EGW20KH7PESQ", title: "Bánh Dẻo Cốm Dừa", amount: 65000 },
  { variant_id: "variant_01KYBTQ0NQP9MQ635VWYRDTMWN", title: "Bánh Dẻo Thập Cẩm", amount: 65000 },
  { variant_id: "variant_01KYBTT4ZJ3ET3J2TQB7PRWX1F", title: "Bánh Dẻo Sen Nhuyễn", amount: 65000 },
  { variant_id: "variant_01KYBTYNSKWYGSVD7D4VV925XJ", title: "Bánh Dẻo Sen Trứng Muối", amount: 70000 },
  { variant_id: "variant_01KYBV0EKWJ2T427SQA48RR925", title: "Bánh Dẻo Đậu Xanh Trứng Muối", amount: 65000 },
  { variant_id: "variant_01KYBV3HFHR8DYM7WAQWZCXRE0", title: "Bánh Dẻo Kem Trứng", amount: 75000 },
  { variant_id: "variant_01KYBV5NKNDF291A5GDG565J3N", title: "Bánh Dẻo Chay", amount: 40000 },
]

function roundTo(amount: number, step: number): number {
  return Math.round(amount / step) * step
}

export default async function migrateSalePricesRound2Script({
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
            "Tự động tạo — giữ nguyên giá bán hiện tại làm giá sale sau khi nâng giá gốc để hiển thị giá gạch ngang (đợt 2 — bánh Trung Thu).",
          status: "active" as const,
          prices: salePrices,
        },
      ],
    },
  })

  logger.info("Hoàn tất migrate giá gốc/giá sale (đợt 2).")
}
