import { getSiteBackground } from "@lib/data/site-background"

/**
 * Lớp nền của toàn site, do Admin chọn trong "Nền website".
 *
 * Đặt `fixed` + `z-index: -1` nên nằm dưới mọi nội dung nhưng trên nền canvas;
 * body phải trong suốt (xem src/app/layout.tsx) thì lớp này mới hiện ra.
 * Không bật nền nào thì component trả về null và web giữ nền trắng.
 */
export default async function SiteBackground() {
  const bg = await getSiteBackground()

  if (!bg) {
    return null
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ backgroundColor: bg.base_color }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${bg.image_url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: bg.opacity / 100,
          filter: `saturate(${bg.saturate}%)`,
        }}
      />
    </div>
  )
}
