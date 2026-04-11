import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Badge,
  Button,
  Container,
  Heading,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import {
  AlertTriangle,
  BarChart3,
  Package,
  PackageX,
  RefreshCw,
  ShoppingCart,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { adminFetch } from "../storefront-cms/admin-fetch"

// ─── Types ────────────────────────────────────────────────────────────────────

type Dashboard = {
  total_skus: number
  out_of_stock: number
  in_shortage: number
  low_stock: number
  in_stock: number
  total_stocked: number
  total_reserved: number
  total_available: number
  by_location: Array<{
    location_id: string
    name: string
    stocked_quantity: number
    reserved_quantity: number
    incoming_quantity: number
    available_quantity: number
  }>
}

type ShortageVariant = {
  inventory_item_id: string
  sku: string | null
  product_title: string | null
  variant_title: string | null
  stocked_quantity: number
  reserved_quantity: number
  available_quantity: number
  shortage: number
  status: "shortage" | "out_of_stock"
  min_stock_threshold: number
  by_location: Array<{
    location_name: string
    stocked: number
    reserved: number
    available: number
  }>
}

type ShortageOrder = {
  order_id: string
  display_id: number
  status: string
  created_at: string
  customer_email: string | null
  affected_items: Array<{
    line_item_id: string
    product_title: string | null
    variant_title: string | null
    quantity_ordered: number
    sku: string | null
    shortage_quantity: number
  }>
  total_shortage_lines: number
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon,
  color,
  sub,
}: {
  label: string
  value: number
  icon: React.ReactNode
  color: "green" | "red" | "orange" | "yellow" | "grey"
  sub?: string
}) {
  const colorMap: Record<string, string> = {
    green: "text-green-600",
    red: "text-red-600",
    orange: "text-orange-500",
    yellow: "text-yellow-600",
    grey: "text-ui-fg-muted",
  }
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-ui-border-base bg-ui-bg-base p-4 shadow-sm min-w-[160px]">
      <div className={`flex items-center gap-2 ${colorMap[color]}`}>
        {icon}
        <Text size="small" weight="plus" className={colorMap[color]}>
          {label}
        </Text>
      </div>
      <Text className={`text-3xl font-bold ${colorMap[color]}`}>{value}</Text>
      {sub && (
        <Text size="xsmall" className="text-ui-fg-muted">
          {sub}
        </Text>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const InventoryDashboard = () => {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [shortageVariants, setShortageVariants] = useState<ShortageVariant[]>([])
  const [shortageOrders, setShortageOrders] = useState<ShortageOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [activeTab, setActiveTab] = useState<"variants" | "orders">("variants")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [dash, svRes, soRes] = await Promise.all([
        adminFetch("/admin/custom/inventory/dashboard") as Promise<{ dashboard: Dashboard }>,
        adminFetch("/admin/custom/inventory/shortage/variants?include_zero=true") as Promise<{
          shortage_variants: ShortageVariant[]
        }>,
        adminFetch("/admin/custom/inventory/shortage/orders") as Promise<{
          shortage_orders: ShortageOrder[]
        }>,
      ])
      setDashboard(dash.dashboard)
      setShortageVariants(svRes.shortage_variants ?? [])
      setShortageOrders(soRes.shortage_orders ?? [])
    } catch (e: unknown) {
      toast.error("Lỗi tải dữ liệu tồn kho", {
        description: e instanceof Error ? e.message : "Không xác định",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const downloadExcel = async () => {
    setDownloading(true)
    try {
      const res = await fetch("/admin/custom/inventory/report?format=xlsx", {
        credentials: "include",
      })
      if (!res.ok) throw new Error(res.statusText)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `inventory-report-${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Tải xuống thành công")
    } catch (e: unknown) {
      toast.error("Lỗi tải Excel", {
        description: e instanceof Error ? e.message : "Không xác định",
      })
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <Container>
        <Text className="text-ui-fg-muted">Đang tải dữ liệu tồn kho...</Text>
      </Container>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading level="h1">📦 Dashboard Tồn Kho</Heading>
          <Text size="small" className="text-ui-fg-muted mt-1">
            Tổng hợp tình trạng kho hàng — cập nhật theo thời gian thực
          </Text>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="small" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Làm mới
          </Button>
          <Button
            variant="primary"
            size="small"
            onClick={downloadExcel}
            disabled={downloading}
          >
            {downloading ? "Đang tải..." : "📥 Tải Excel"}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {dashboard && (
        <div className="flex flex-wrap gap-4">
          <KpiCard
            label="Tổng SKU"
            value={dashboard.total_skus}
            icon={<Package className="w-4 h-4" />}
            color="grey"
            sub={`Tồn: ${dashboard.total_stocked.toLocaleString("vi-VN")}`}
          />
          <KpiCard
            label="Thiếu hàng"
            value={dashboard.in_shortage}
            icon={<AlertTriangle className="w-4 h-4" />}
            color="red"
            sub="Đặt nhiều hơn tồn"
          />
          <KpiCard
            label="Hết hàng"
            value={dashboard.out_of_stock}
            icon={<PackageX className="w-4 h-4" />}
            color="orange"
            sub="available = 0"
          />
          <KpiCard
            label="Sắp hết"
            value={dashboard.low_stock}
            icon={<BarChart3 className="w-4 h-4" />}
            color="yellow"
            sub="≤ ngưỡng cảnh báo"
          />
          <KpiCard
            label="Đủ hàng"
            value={dashboard.in_stock}
            icon={<ShoppingCart className="w-4 h-4" />}
            color="green"
            sub={`Sẵn có: ${dashboard.total_available.toLocaleString("vi-VN")}`}
          />
        </div>
      )}

      {/* Breakdown theo kho */}
      {dashboard && dashboard.by_location.length > 0 && (
        <Container>
          <Heading level="h2" className="mb-3">
            Tổng hợp theo kho
          </Heading>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Kho</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Tồn kho</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Đang giữ</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Đang về</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Sẵn có</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {dashboard.by_location.map((loc) => (
                <Table.Row key={loc.location_id}>
                  <Table.Cell>{loc.name}</Table.Cell>
                  <Table.Cell className="text-right">
                    {loc.stocked_quantity.toLocaleString("vi-VN")}
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    {loc.reserved_quantity.toLocaleString("vi-VN")}
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    {loc.incoming_quantity.toLocaleString("vi-VN")}
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    <span
                      className={
                        loc.available_quantity < 0
                          ? "text-red-600 font-semibold"
                          : "text-green-600"
                      }
                    >
                      {loc.available_quantity.toLocaleString("vi-VN")}
                    </span>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Container>
      )}

      {/* Tabs: Variant thiếu / Đơn bị ảnh hưởng */}
      <div>
        <div className="flex gap-2 mb-4 border-b border-ui-border-base">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "variants"
                ? "border-ui-fg-base text-ui-fg-base"
                : "border-transparent text-ui-fg-muted hover:text-ui-fg-base"
            }`}
            onClick={() => setActiveTab("variants")}
          >
            Variant thiếu / hết hàng{" "}
            {shortageVariants.length > 0 && (
              <Badge color="red" size="xsmall">
                {shortageVariants.length}
              </Badge>
            )}
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "orders"
                ? "border-ui-fg-base text-ui-fg-base"
                : "border-transparent text-ui-fg-muted hover:text-ui-fg-base"
            }`}
            onClick={() => setActiveTab("orders")}
          >
            Đơn hàng bị ảnh hưởng{" "}
            {shortageOrders.length > 0 && (
              <Badge color="orange" size="xsmall">
                {shortageOrders.length}
              </Badge>
            )}
          </button>
        </div>

        {/* Tab: Variants */}
        {activeTab === "variants" && (
          <Container>
            <Heading level="h2" className="mb-3">
              Sản phẩm thiếu / hết hàng
            </Heading>
            {shortageVariants.length === 0 ? (
              <Text className="text-ui-fg-muted py-4 text-center">
                ✅ Không có sản phẩm nào thiếu hoặc hết hàng
              </Text>
            ) : (
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Sản phẩm</Table.HeaderCell>
                    <Table.HeaderCell>SKU</Table.HeaderCell>
                    <Table.HeaderCell className="text-right">Tồn</Table.HeaderCell>
                    <Table.HeaderCell className="text-right">Đang giữ</Table.HeaderCell>
                    <Table.HeaderCell className="text-right">Sẵn có</Table.HeaderCell>
                    <Table.HeaderCell className="text-right">Thiếu</Table.HeaderCell>
                    <Table.HeaderCell>Trạng thái</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {shortageVariants.map((sv) => (
                    <Table.Row key={sv.inventory_item_id}>
                      <Table.Cell>
                        <div>
                          <Text size="small" weight="plus">
                            {sv.product_title ?? sv.inventory_title ?? "—"}
                          </Text>
                          {sv.variant_title && (
                            <Text size="xsmall" className="text-ui-fg-muted">
                              {sv.variant_title}
                            </Text>
                          )}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="small" className="font-mono">
                          {sv.sku ?? "—"}
                        </Text>
                      </Table.Cell>
                      <Table.Cell className="text-right">{sv.stocked_quantity}</Table.Cell>
                      <Table.Cell className="text-right">{sv.reserved_quantity}</Table.Cell>
                      <Table.Cell className="text-right font-semibold text-red-600">
                        {sv.available_quantity}
                      </Table.Cell>
                      <Table.Cell className="text-right font-semibold text-red-600">
                        {sv.shortage > 0 ? sv.shortage : "—"}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          color={sv.status === "shortage" ? "red" : "orange"}
                          size="xsmall"
                        >
                          {sv.status === "shortage" ? "Thiếu hàng" : "Hết hàng"}
                        </Badge>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            )}
          </Container>
        )}

        {/* Tab: Đơn hàng bị ảnh hưởng */}
        {activeTab === "orders" && (
          <Container>
            <Heading level="h2" className="mb-3">
              Đơn hàng bị ảnh hưởng bởi thiếu hàng
            </Heading>
            {shortageOrders.length === 0 ? (
              <Text className="text-ui-fg-muted py-4 text-center">
                ✅ Không có đơn hàng nào bị ảnh hưởng
              </Text>
            ) : (
              <div className="flex flex-col gap-4">
                {shortageOrders.map((order) => (
                  <div
                    key={order.order_id}
                    className="rounded-lg border border-ui-border-base p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Text weight="plus">
                          Đơn #{order.display_id ?? order.order_id.slice(-8)}
                        </Text>
                        <Badge color="orange" size="xsmall">
                          {order.status}
                        </Badge>
                        <Text size="small" className="text-ui-fg-muted">
                          {new Date(order.created_at).toLocaleDateString("vi-VN")}
                        </Text>
                      </div>
                      {order.customer_email && (
                        <Text size="small" className="text-ui-fg-muted">
                          {order.customer_email}
                        </Text>
                      )}
                    </div>
                    <Table>
                      <Table.Header>
                        <Table.Row>
                          <Table.HeaderCell>Sản phẩm</Table.HeaderCell>
                          <Table.HeaderCell>SKU</Table.HeaderCell>
                          <Table.HeaderCell className="text-right">Đã đặt</Table.HeaderCell>
                          <Table.HeaderCell className="text-right">Cần thêm</Table.HeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {order.affected_items.map((item) => (
                          <Table.Row key={item.line_item_id}>
                            <Table.Cell>
                              <div>
                                <Text size="small">{item.product_title ?? "—"}</Text>
                                {item.variant_title && (
                                  <Text size="xsmall" className="text-ui-fg-muted">
                                    {item.variant_title}
                                  </Text>
                                )}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <Text size="small" className="font-mono">
                                {item.sku ?? "—"}
                              </Text>
                            </Table.Cell>
                            <Table.Cell className="text-right">{item.quantity_ordered}</Table.Cell>
                            <Table.Cell className="text-right font-semibold text-red-600">
                              {item.shortage_quantity > 0 ? `+${item.shortage_quantity}` : "—"}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  </div>
                ))}
              </div>
            )}
          </Container>
        )}
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Tồn Kho",
  icon: Package,
})

export default InventoryDashboard
