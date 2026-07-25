/**
 * Tạo sẵn bộ nền website để Admin chọn ngay, không phải tự tải ảnh lên.
 *
 * Ảnh nằm trong storefront tại `public/backgrounds/` nên `image_url` là đường
 * dẫn tương đối — storefront tự phục vụ, không đi qua backend.
 *
 * Chạy: npx medusa exec ./src/scripts/seed-backgrounds.js
 *
 * Chạy lại được và an toàn:
 *  - Nền đã có (khớp theo image_url): chỉ đồng bộ tên / chủ đề / thứ tự,
 *    GIỮ NGUYÊN độ mờ và độ rực nếu Admin đã chỉnh tay.
 *  - Nền dựng sẵn cũ không còn trong danh sách: xoá đi cho gọn.
 *  - Nền Admin tự thêm: không đụng tới.
 */
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { STORE_CMS_MODULE } from "../modules/store-cms"
import type StoreCmsModuleService from "../modules/store-cms/service"
import { BACKGROUND_PRESETS } from "./backgrounds-data"

export default async function seedBackgroundsScript({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const cms = container.resolve(STORE_CMS_MODULE) as StoreCmsModuleService

  const existing = await cms.listStoreBackgrounds({})
  const byUrl = new Map(existing.map((b) => [b.image_url, b]))
  const wantedUrls = new Set(BACKGROUND_PRESETS.map((p) => p.image_url))

  let created = 0
  let updated = 0

  for (const p of BACKGROUND_PRESETS) {
    const current = byUrl.get(p.image_url)

    if (current) {
      await cms.updateStoreBackgrounds([
        {
          id: current.id,
          name: p.name,
          theme: p.theme,
          sort_order: p.sort_order,
          is_preset: true,
        } as never,
      ])
      updated++
      continue
    }

    await cms.createStoreBackgrounds([
      {
        name: p.name,
        theme: p.theme,
        image_url: p.image_url,
        image_file_id: null,
        opacity: p.opacity,
        saturate: p.saturate,
        base_color: "#FAF7F2",
        sort_order: p.sort_order,
        is_active: false,
        is_preset: true,
      },
    ])
    created++
  }

  // Dọn nền dựng sẵn cũ đã bị bỏ khỏi danh sách (vd ảnh đổi đuôi file).
  const stale = existing.filter(
    (b) => b.is_preset && b.image_url && !wantedUrls.has(b.image_url)
  )
  if (stale.length) {
    await cms.deleteStoreBackgrounds(stale.map((b) => b.id))
    logger.info(
      `Đã dọn ${stale.length} nền dựng sẵn cũ: ${stale
        .map((b) => b.name)
        .join(", ")}`
    )
  }

  const byTheme = BACKGROUND_PRESETS.reduce<Record<string, number>>((acc, p) => {
    acc[p.theme] = (acc[p.theme] ?? 0) + 1
    return acc
  }, {})

  logger.info(
    `Hoàn tất — tạo mới ${created}, cập nhật ${updated}. Theo chủ đề: ${Object.entries(
      byTheme
    )
      .map(([t, n]) => `${t}=${n}`)
      .join(", ")}. Vào Admin → "Nền website" để chọn.`
  )
}
