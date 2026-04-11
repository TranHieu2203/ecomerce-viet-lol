/**
 * GET /store/custom/inventory/variant-status?variant_ids=id1,id2,...
 *
 * Public (AUTHENTICATE=false) — trả trạng thái tồn kho per variant.
 * Không expose số lượng cụ thể — chỉ trả status label.
 *
 * Response:
 * {
 *   statuses: {
 *     [variant_id]: {
 *       status: "in_stock" | "low_stock" | "out_of_stock" | "backorder" | "untracked"
 *       label_vi: "Còn hàng" | "Sắp hết" | "Hết hàng tạm thời" | "Đặt trước"
 *       label_en: "In Stock" | "Low Stock" | "Temporarily Out of Stock" | "Pre-order"
 *       allow_backorder: boolean
 *     }
 *   }
 * }
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const AUTHENTICATE = false

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const variantIdsParam = req.query.variant_ids as string | undefined
  if (!variantIdsParam) {
    return res.status(400).json({ message: "Thiếu variant_ids" })
  }

  const variantIds = variantIdsParam
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 50) // tối đa 50 variants mỗi request

  if (!variantIds.length) {
    return res.json({ statuses: {} })
  }

  // Lấy inventory data cho các variants này
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: [
      "id",
      "manage_inventory",
      "allow_backorder",
      "inventory_items.inventory.id",
      "inventory_items.inventory.metadata",
      "inventory_items.inventory.stocked_quantity",
      "inventory_items.inventory.reserved_quantity",
    ],
    filters: { id: variantIds },
  })

  type InvItem = {
    id: string
    metadata?: { min_stock_threshold?: number } | null
    stocked_quantity?: number | null
    reserved_quantity?: number | null
  }

  type VariantData = {
    id: string
    manage_inventory?: boolean
    allow_backorder?: boolean
    inventory_items?: Array<{
      inventory?: InvItem | null
    }>
  }

  const variantList = (variants ?? []) as VariantData[]

  const statuses: Record<
    string,
    {
      status: string
      label_vi: string
      label_en: string
      allow_backorder: boolean
    }
  > = {}

  for (const variant of variantList) {
    const allowBackorder = variant.allow_backorder ?? false

    if (!variant.manage_inventory) {
      statuses[variant.id] = {
        status: "in_stock",
        label_vi: "Còn hàng",
        label_en: "In Stock",
        allow_backorder: allowBackorder,
      }
      continue
    }

    const inv = variant.inventory_items?.[0]?.inventory
    if (!inv) {
      statuses[variant.id] = {
        status: "untracked",
        label_vi: "Còn hàng",
        label_en: "In Stock",
        allow_backorder: allowBackorder,
      }
      continue
    }

    const threshold = inv.metadata?.min_stock_threshold ?? 19
    const stocked = inv.stocked_quantity ?? 0
    const reserved = inv.reserved_quantity ?? 0
    const available = stocked - reserved

    let status: string
    let labelVi: string
    let labelEn: string

    if (available > threshold) {
      status = "in_stock"
      labelVi = "Còn hàng"
      labelEn = "In Stock"
    } else if (available > 0) {
      status = "low_stock"
      labelVi = "Sắp hết"
      labelEn = "Low Stock"
    } else if (available === 0) {
      status = allowBackorder ? "backorder" : "out_of_stock"
      labelVi = allowBackorder ? "Đặt trước" : "Hết hàng tạm thời"
      labelEn = allowBackorder ? "Pre-order" : "Temporarily Out of Stock"
    } else {
      // available < 0
      status = allowBackorder ? "backorder" : "out_of_stock"
      labelVi = allowBackorder ? "Đặt trước" : "Hết hàng tạm thời"
      labelEn = allowBackorder ? "Pre-order" : "Temporarily Out of Stock"
    }

    statuses[variant.id] = { status, label_vi: labelVi, label_en: labelEn, allow_backorder: allowBackorder }
  }

  res.json({ statuses })
}
