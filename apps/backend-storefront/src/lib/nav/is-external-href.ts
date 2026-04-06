/** true → render `<a>`, không dùng LocalizedClientLink (tránh prefix locale). */
export function isExternalOrAbsoluteHref(href: string): boolean {
  const t = href.trim()
  if (!t) return false
  return (
    /^https?:\/\//i.test(t) ||
    t.startsWith("//") ||
    t.startsWith("mailto:") ||
    t.startsWith("tel:")
  )
}
