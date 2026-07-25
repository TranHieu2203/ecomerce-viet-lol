/**
 * Tạo sẵn bộ nền website để Admin chọn ngay, không phải tự tải ảnh lên.
 *
 * Ảnh nằm trong storefront tại `public/backgrounds/` nên `image_url` là đường
 * dẫn tương đối — storefront tự phục vụ, không qua backend.
 *
 * Chạy: npx medusa exec ./src/scripts/seed-backgrounds.js
 * (chạy lại được — cập nhật nền dựng sẵn theo tên file, giữ nguyên nền do
 * Admin tự thêm và giữ nguyên nền đang bật)
 */
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { STORE_CMS_MODULE } from "../modules/store-cms"
import type StoreCmsModuleService from "../modules/store-cms/service"

type Preset = {
  name: string
  image_url: string
  opacity: number
  saturate: number
}

const PRESETS: Preset[] = [
  {
    name: "Bánh trung thu tông kem",
    image_url: "/backgrounds/01-banh-tong-kem.webp",
    opacity: 30,
    saturate: 80,
  },
  {
    name: "Bánh dẻo hoa văn",
    image_url: "/backgrounds/02-banh-deo-hoa-van.webp",
    opacity: 42,
    saturate: 100,
  },
  {
    name: "Bánh nướng vàng",
    image_url: "/backgrounds/03-banh-nuong-vang.webp",
    opacity: 38,
    saturate: 100,
  },
  {
    name: "Đèn lồng Hội An",
    image_url: "/backgrounds/04-den-long-hoi-an.webp",
    opacity: 20,
    saturate: 90,
  },
  {
    name: "Trăng mây",
    image_url: "/backgrounds/05-trang-may.webp",
    opacity: 26,
    saturate: 95,
  },
  {
    name: "Bánh dẻo trắng tinh",
    image_url: "/backgrounds/06-banh-deo-trang.webp",
    opacity: 45,
    saturate: 100,
  },
  {
    name: "Bàn trà ấm",
    image_url: "/backgrounds/07-ban-tra-am.webp",
    opacity: 22,
    saturate: 90,
  },
  {
    name: "Trăng rằm đầy sao",
    image_url: "/backgrounds/08-trang-ram-sao.webp",
    opacity: 18,
    saturate: 100,
  },
  {
    name: "Hoa và trà nền tối",
    image_url: "/backgrounds/09-hoa-tra-nen-toi.jpg",
    opacity: 20,
    saturate: 95,
  },
  {
    name: "Cá chép vàng",
    image_url: "/backgrounds/10-ca-chep-vang.jpg",
    opacity: 22,
    saturate: 95,
  },
]

export default async function seedBackgroundsScript({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const cms = container.resolve(STORE_CMS_MODULE) as StoreCmsModuleService

  const existing = await cms.listStoreBackgrounds({})
  const byUrl = new Map(existing.map((b) => [b.image_url, b]))

  let created = 0
  let updated = 0

  for (let i = 0; i < PRESETS.length; i++) {
    const p = PRESETS[i]
    const current = byUrl.get(p.image_url)

    if (current) {
      // Giữ nguyên độ mờ / độ rực nếu Admin đã chỉnh tay, chỉ đồng bộ tên và thứ tự.
      await cms.updateStoreBackgrounds([
        {
          id: current.id,
          name: p.name,
          sort_order: i,
          is_preset: true,
        } as never,
      ])
      updated++
      logger.info(`Cập nhật nền dựng sẵn: ${p.name}`)
      continue
    }

    await cms.createStoreBackgrounds([
      {
        name: p.name,
        image_url: p.image_url,
        image_file_id: null,
        opacity: p.opacity,
        saturate: p.saturate,
        base_color: "#FAF7F2",
        sort_order: i,
        is_active: false,
        is_preset: true,
      },
    ])
    created++
    logger.info(`Tạo nền dựng sẵn: ${p.name}`)
  }

  logger.info(
    `Hoàn tất — tạo mới ${created}, cập nhật ${updated}. Vào Admin → "Nền website" để chọn.`
  )
}
