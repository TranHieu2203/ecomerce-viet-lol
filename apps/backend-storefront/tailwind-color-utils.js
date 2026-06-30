/**
 * Bọc CSS variable dạng kênh RGB ("R G B") thành màu Tailwind hỗ trợ
 * opacity modifier (vd. bg-brand-gold/50). `--brand-*` PHẢI ở định dạng
 * "R G B" (xem src/styles/tay-a-brand.css) — không dùng hex/rgba() trực
 * tiếp, nếu không modifier opacity sẽ bị Tailwind âm thầm bỏ qua.
 */
function withOpacity(variableName, defaultOpacity = 1) {
  return ({ opacityValue }) =>
    `rgb(var(${variableName}) / ${opacityValue !== undefined ? opacityValue : defaultOpacity})`
}

module.exports = { withOpacity }
