import type { Metadata } from "next"
import { PublicShell } from "@/components/public/PublicShell"
import { VisionPage } from "@/components/public/pages/VisionPage"
import { PublicSectionLoader } from "@/components/public/PublicSectionLoader"
import { demoData } from "@/lib/mock-data"

export const metadata: Metadata = { title: "Our vision · AsaPhis ORG", description: "See AsaPhis current work and future goals for African knowledge infrastructure." }

export default function VisionRoute() {
  // Dynamic: section=vision from GET /content/published, managed in admin /content.
  return <PublicShell><PublicSectionLoader fallback={demoData.publicContent}>{(content) => <VisionPage content={content} />}</PublicSectionLoader></PublicShell>
}
