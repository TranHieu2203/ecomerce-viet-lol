import { model } from "@medusajs/framework/utils"

export const MOVEMENT_TYPE = {
  /** Nhập kho — hàng về. */
  IN: "nhap",
  /** Xuất kho thủ công — hỏng, biếu tặng, trả nhà cung cấp... */
  OUT: "xuat",
  /** Điều chỉnh sau kiểm kê — đặt lại tồn về đúng số đếm được. */
  ADJUST: "dieu_chinh",
} as const

export type MovementType = (typeof MOVEMENT_TYPE)[keyof typeof MOVEMENT_TYPE]

/**
 * Sổ kho — Medusa chỉ lưu số tồn HIỆN TẠI, không lưu biến động, nên không
 * truy lại được "hôm qua nhập bao nhiêu, xuất bao nhiêu".
 *
 * Mỗi dòng là một lần kho thay đổi do thao tác thủ công (nhập / xuất / điều
 * chỉnh). Phần xuất do bán hàng KHÔNG ghi ở đây mà lấy từ đơn hàng, vì đơn
 * hàng đã lưu sẵn số lượng và giá tại thời điểm bán.
 */
const StockMovement = model.define("stock_movement", {
  id: model.id().primaryKey(),
  inventory_item_id: model.text().index(),
  variant_id: model.text().nullable(),
  product_id: model.text().index().nullable(),
  /** Chụp lại tên tại thời điểm ghi sổ, để sau này đổi tên vẫn đọc hiểu được. */
  product_title: model.text().nullable(),
  variant_title: model.text().nullable(),
  sku: model.text().nullable(),
  location_id: model.text().index(),
  location_name: model.text().nullable(),
  /** "nhap" | "xuat" | "dieu_chinh". */
  type: model.text(),
  /** Dương là tăng kho, âm là giảm kho. */
  quantity: model.number(),
  /** Tồn ngay sau khi ghi sổ — để dò lại khi số liệu lệch. */
  balance_after: model.number(),
  /** Giá vốn mỗi đơn vị khi nhập, nếu có nhập. */
  unit_cost: model.number().nullable(),
  note: model.text().nullable(),
  actor_id: model.text().nullable(),
})

export default StockMovement
