/**
 * Widget: Tồn Kho — hiển thị trong sidebar trang Product Detail
 *
 * Story 14-4: Hiển thị per-variant: tồn / reserved / available / trạng thái
 * Story 14-5: Cấu hình min_stock_threshold + incoming_quantity per location
 */

import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { ChevronDown, ChevronRight, Package } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { adminFetch } from "../routes/storefront-cms/admin-fetch"

// ─── Types ────────────────────────────────────────────────────────────────────

type LocationLevel = {
  inventory_level_id: string
  location_id: string
  location_name: string
  stocked: number
  reserved: number
  incoming: number
  available: number
}

type InventoryRow = {
  variant_id: string
  variant_title: string | null
  sku: string | null
  manage_inventory: boolean
  allow_backorder: boolean
  inventory_item_id: string | null
  min_stock_threshold: number
  stocked_quantity: number
  reserved_quantity: number
  incoming_quantity: number
  available_quantity: number
  status: "in_stock" | "low_stock" | "out_of_stock" | "shortage" | "untracked"
  by_location: LocationLevel[]
}

type ApiResponse = {
  inventory_items: InventoryRow[]
  locations: Array<{ id: string; name: string }>
}

// ─── Badge helper ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: InventoryRow["status"] }) {
  const map: Record<InventoryRow["status"], { label: string; color: "green" | "orange" | "red" | "grey" | "blue" }> = {
    in_stock: { label: "Đủ hàng", color: "green" },
    low_stock: { label: "Sắp hết", color: "blue" },
    out_of_stock: { label: "Hết hàng", color: "orange" },
    shortage: { label: "Thiếu hàng", color: "red" },
    untracked: { label: "Chưa theo dõi", color: "grey" },
  }
  const { label, color } = map[status] ?? { label: status, color: "grey" }
  return (
    <Badge color={color} size="xsmall">
      {label}
    </Badge>
  )
}

// ─── Main widget ──────────────────────────────────────────────────────────────

const InventoryProductWidget = () => {
  const { id: productId } = useParams<{ id: string }>()
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set())
  const [editingThreshold, setEditingThreshold] = useState<Record<string, number>>({})
  const [savingThreshold, setSavingThreshold] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    if (!productId) return
    setLoading(true)
    try {
      const res = await adminFetch(
        `/admin/custom/inventory/items?product_id=${productId}`
      ) as ApiResponse
      setData(res)
      // Init threshold edit values
      const initial: Record<string, number> = {}
      for (const item of res.inventory_items ?? []) {
        if (item.inventory_item_id) {
          initial[item.inventory_item_id] = item.min_stock_threshold
        }
      }
      setEditingThreshold(initial)
    } catch (e: unknown) {
      toast.error("Không tải được dữ liệu tồn kho", {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    load()
  }, [load])

  const toggleExpand = (variantId: string) => {
    setExpandedVariants((prev) => {
      const next = new Set(prev)
      if (next.has(variantId)) next.delete(variantId)
      else next.add(variantId)
      return next
    })
  }

  const saveThreshold = async (inventoryItemId: string) => {
    const value = editingThreshold[inventoryItemId]
    if (value == null) return
    setSavingThreshold((prev) => new Set(prev).add(inventoryItemId))
    try {
      await adminFetch("/admin/custom/inventory/items", {
        method: "PATCH",
        body: JSON.stringify({
          inventory_item_id: inventoryItemId,
          min_stock_threshold: value,
        }),
      })
      toast.success("Cập nhật ngưỡng thành công")
      await load()
    } catch (e: unknown) {
      toast.error("Lỗi lưu ngưỡng", {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setSavingThreshold((prev) => {
        const next = new Set(prev)
        next.delete(inventoryItemId)
        return next
      })
    }
  }

  const saveIncoming = async (
    inventoryItemId: string,
    levels: Array<{ inventory_level_id: string; incoming_quantity: number }>
  ) => {
    try {
      await adminFetch("/admin/custom/inventory/items", {
        method: "PATCH",
        body: JSON.stringify({
          inventory_item_id: inventoryItemId,
          location_levels: levels,
        }),
      })
      toast.success("Cập nhật hàng đang về thành công")
      await load()
    } catch (e: unknown) {
      toast.error("Lỗi lưu incoming", {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  if (loading) {
    return (
      <Container>
        <Text size="small" className="text-ui-fg-muted">
          Đang tải tồn kho...
        </Text>
      </Container>
    )
  }

  if (!data || !data.inventory_items.length) {
    return (
      <Container>
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-4 h-4 text-ui-fg-muted" />
          <Heading level="h3">Tồn Kho</Heading>
        </div>
        <Text size="small" className="text-ui-fg-muted">
          Sản phẩm chưa có variants.
        </Text>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4" />
          <Heading level="h3">Tồn Kho</Heading>
        </div>
        <Button variant="transparent" size="small" onClick={load}>
          Làm mới
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {data.inventory_items.map((row) => (
          <div key={row.variant_id} className="rounded-lg border border-ui-border-base p-3">
            {/* Variant header */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <Text size="small" weight="plus">
                  {row.variant_title ?? "—"}
                </Text>
                {row.sku && (
                  <Text size="xsmall" className="text-ui-fg-muted font-mono">
                    {row.sku}
                  </Text>
                )}
              </div>
              <StatusBadge status={row.status} />
            </div>

            {/* Summary numbers */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { label: "Tồn", value: row.stocked_quantity },
                { label: "Đang giữ", value: row.reserved_quantity },
                {
                  label: "Sẵn có",
                  value: row.available_quantity,
                  highlight: row.available_quantity < 0 ? "red" : undefined,
                },
                {
                  label: "Thiếu",
                  value: row.available_quantity < 0 ? Math.abs(row.available_quantity) : 0,
                  highlight: row.available_quantity < 0 ? "red" : undefined,
                },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="text-center">
                  <Text size="xsmall" className="text-ui-fg-muted">
                    {label}
                  </Text>
                  <Text
                    size="small"
                    weight="plus"
                    className={highlight === "red" ? "text-red-600" : ""}
                  >
                    {value}
                  </Text>
                </div>
              ))}
            </div>

            {/* Threshold config */}
            {row.inventory_item_id && (
              <div className="flex items-center gap-2 mb-3">
                <Label htmlFor={`threshold-${row.inventory_item_id}`} className="text-xs whitespace-nowrap">
                  Ngưỡng cảnh báo:
                </Label>
                <Input
                  id={`threshold-${row.inventory_item_id}`}
                  type="number"
                  size="small"
                  min={0}
                  className="w-20"
                  value={editingThreshold[row.inventory_item_id] ?? row.min_stock_threshold}
                  onChange={(e) =>
                    setEditingThreshold((prev) => ({
                      ...prev,
                      [row.inventory_item_id!]: parseInt(e.target.value) || 0,
                    }))
                  }
                />
                <Button
                  variant="secondary"
                  size="small"
                  disabled={savingThreshold.has(row.inventory_item_id)}
                  onClick={() => saveThreshold(row.inventory_item_id!)}
                >
                  {savingThreshold.has(row.inventory_item_id) ? "Lưu..." : "Lưu"}
                </Button>
              </div>
            )}

            {/* Breakdown theo kho (collapsible) */}
            {row.by_location.length > 0 && (
              <div>
                <button
                  className="flex items-center gap-1 text-xs text-ui-fg-muted hover:text-ui-fg-base transition-colors"
                  onClick={() => toggleExpand(row.variant_id)}
                >
                  {expandedVariants.has(row.variant_id) ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                  Chi tiết theo kho
                </button>

                {expandedVariants.has(row.variant_id) && (
                  <div className="mt-2">
                    <Table>
                      <Table.Header>
                        <Table.Row>
                          <Table.HeaderCell>Kho</Table.HeaderCell>
                          <Table.HeaderCell className="text-right">Tồn</Table.HeaderCell>
                          <Table.HeaderCell className="text-right">Giữ</Table.HeaderCell>
                          <Table.HeaderCell className="text-right">Sẵn</Table.HeaderCell>
                          <Table.HeaderCell className="text-right">Đang về</Table.HeaderCell>
                          <Table.HeaderCell></Table.HeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {row.by_location.map((loc) => (
                          <IncomingRow
                            key={loc.location_id}
                            loc={loc}
                            inventoryItemId={row.inventory_item_id!}
                            onSave={saveIncoming}
                          />
                        ))}
                      </Table.Body>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Container>
  )
}

// ─── IncomingRow — editable incoming_quantity per location ────────────────────

function IncomingRow({
  loc,
  inventoryItemId,
  onSave,
}: {
  loc: LocationLevel
  inventoryItemId: string
  onSave: (
    itemId: string,
    levels: Array<{ inventory_level_id: string; incoming_quantity: number }>
  ) => Promise<void>
}) {
  const [incoming, setIncoming] = useState(loc.incoming)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave(inventoryItemId, [
      { inventory_level_id: loc.inventory_level_id, incoming_quantity: incoming },
    ])
    setSaving(false)
  }

  return (
    <Table.Row>
      <Table.Cell>{loc.location_name}</Table.Cell>
      <Table.Cell className="text-right">{loc.stocked}</Table.Cell>
      <Table.Cell className="text-right">{loc.reserved}</Table.Cell>
      <Table.Cell className="text-right">
        <span className={loc.available < 0 ? "text-red-600 font-semibold" : ""}>
          {loc.available}
        </span>
      </Table.Cell>
      <Table.Cell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Input
            type="number"
            size="small"
            min={0}
            className="w-16"
            value={incoming}
            onChange={(e) => setIncoming(parseInt(e.target.value) || 0)}
          />
        </div>
      </Table.Cell>
      <Table.Cell>
        <Button
          variant="transparent"
          size="small"
          disabled={saving || incoming === loc.incoming}
          onClick={handleSave}
        >
          {saving ? "..." : "Lưu"}
        </Button>
      </Table.Cell>
    </Table.Row>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.after",
})

export default InventoryProductWidget
