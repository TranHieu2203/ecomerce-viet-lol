/** Khớp payload resolve từ `GET /store/custom/nav-menu` (backend build-resolved-nav-menu). */
export type ResolvedNavChild =
  | { type: "collection"; handle: string; label: string; href: string }
  | { type: "link"; label: string; href: string }

export type ResolvedNavGroup = {
  id: string
  label: string
  children: ResolvedNavChild[]
}

export type NavMenuPublic = {
  locale: string
  items: ResolvedNavGroup[]
}
