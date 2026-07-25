import { model } from "@medusajs/framework/utils"

/**
 * Nền website (theo mùa / theo chiến dịch).
 *
 * Mỗi bản ghi là một lựa chọn nền; chỉ một bản ghi được `is_active` tại một
 * thời điểm — Admin bấm chọn là đổi, không cần deploy lại.
 *
 * Ảnh có thể đến từ hai nguồn:
 *  - `image_url`: ảnh đóng gói sẵn trong storefront (vd "/backgrounds/x.webp").
 *  - `image_file_id`: ảnh Admin tự tải lên qua thư viện ảnh CMS.
 */
const StoreBackground = model.define("store_background", {
  id: model.id().primaryKey(),
  name: model.text(),
  /** Nhóm nền theo dịp: "trung-thu" | "saffron" | "tet" | "khac". */
  theme: model.text().default("khac"),
  image_url: model.text().nullable(),
  image_file_id: model.text().nullable(),
  /** Độ mờ của ảnh, tính theo phần trăm (0–100). */
  opacity: model.number().default(30),
  /** Độ bão hoà màu, phần trăm (100 = giữ nguyên). */
  saturate: model.number().default(100),
  /** Màu nền phía dưới ảnh — mặc định là kem thương hiệu. */
  base_color: model.text().default("#FAF7F2"),
  is_active: model.boolean().default(false),
  sort_order: model.number().default(0),
  /** Nền dựng sẵn khi seed — không cho xoá để tránh mất lựa chọn gốc. */
  is_preset: model.boolean().default(false),
})

export default StoreBackground
