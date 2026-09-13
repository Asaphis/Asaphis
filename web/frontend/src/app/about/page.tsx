import type { Metadata } from "next"
import { PublicShell } from "@/components/public/PublicShell"
import { PublicSectionLoader } from "@/components/public/PublicSectionLoader"
import { demoData } from "@/lib/mock-data"

export const metadata: Metadata = { title: "About AsaPhis · AsaPhis ORG", description: "Learn what AsaPhis is building and how it handles knowledge and participation." }

export default function AboutRoute() {
  // Dynamic: content (title/body/image) comes from GET /content/published
  // section=about, edited in admin /content. Falls back to seed until published.
  return <PublicShell><PublicSectionLoader fallback={demoData.publicContent} section="about" /></PublicShell>
}
