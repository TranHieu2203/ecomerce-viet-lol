const test = require("node:test")
const assert = require("node:assert/strict")

const { withOpacity } = require("./tailwind-color-utils")

test("withOpacity dùng alpha từ modifier khi Tailwind cung cấp opacityValue", () => {
  const gold = withOpacity("--brand-gold")
  assert.equal(gold({ opacityValue: "0.5" }), "rgb(var(--brand-gold) / 0.5)")
  assert.equal(gold({ opacityValue: "98%" }), "rgb(var(--brand-gold) / 98%)")
})

test("withOpacity mặc định alpha = 1 khi không có modifier và không truyền defaultOpacity", () => {
  const cream = withOpacity("--brand-cream")
  assert.equal(cream({}), "rgb(var(--brand-cream) / 1)")
})

test("withOpacity hỗ trợ defaultOpacity tuỳ chỉnh (vd. biến thể muted)", () => {
  const goldMuted = withOpacity("--brand-gold-muted", 0.14)
  assert.equal(goldMuted({}), "rgb(var(--brand-gold-muted) / 0.14)")
  assert.equal(goldMuted({ opacityValue: "0.7" }), "rgb(var(--brand-gold-muted) / 0.7)")
})

test("withOpacity không bao giờ trả về CSS variable thô (bug gốc gây mất nền dropdown menu)", () => {
  const cream = withOpacity("--brand-cream")
  const out = cream({ opacityValue: "0.98" })
  assert.match(out, /^rgb\(var\(--brand-cream\) \/ 0\.98\)$/)
  assert.notEqual(out, "var(--brand-cream)")
})
