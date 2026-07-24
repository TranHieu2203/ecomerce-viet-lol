/**
 * `template.tsx` re-mount trên mỗi lần chuyển trang (khác `layout.tsx` — chỉ giữ Nav/Footer cố định),
 * nên animation ở đây tự phát lại mỗi khi vào trang mới (danh mục, chi tiết sản phẩm...).
 * `motion-safe:` tôn trọng `prefers-reduced-motion` — người dùng bật giảm chuyển động sẽ thấy nội dung ngay, không animate.
 */
export default function MainTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="motion-safe:animate-page-fade-in">{children}</div>
}
