export const publicNavItems = [
  { key: "home", label: "Home", href: "/" },
  { key: "about", label: "About", href: "/about" },
  { key: "message", label: "Message", href: "/message" },
  { key: "vision", label: "Vision", href: "/vision" },
  { key: "education", label: "Education", href: "/education" },
  { key: "support", label: "Support", href: "/support" },
] as const

export type PublicNavKey = (typeof publicNavItems)[number]["key"]
export type PublicRoute =
  | (typeof publicNavItems)[number]["href"]
  | "/join"
  | "/login"
  | "/member"

export function isPublicNavActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}
