import type { Metadata } from "next"
import { PublicShell } from "@/components/public/PublicShell"
import { PublicSectionLoader } from "@/components/public/PublicSectionLoader"
import { demoData } from "@/lib/mock-data"

export const metadata: Metadata = { title: "Education preview · AsaPhis ORG", description: "Browse public AsaPhis education resources and preview the member library." }

export default function EducationRoute() {
  // Dynamic: section=education items from GET /content/published + /content/education.
  return <PublicShell><PublicSectionLoader fallback={demoData.publicContent} section="education" /></PublicShell>
}
