import type { Metadata } from "next"
import { PublicShell } from "@/components/public/PublicShell"
import { VisionPage } from "@/components/public/pages/VisionPage"
import { demoData } from "@/lib/mock-data"

export const metadata: Metadata = { title: "Our vision · AsaPhis ORG", description: "See AsaPhis current work and future goals for African knowledge infrastructure." }

export default function VisionRoute() {
  return <PublicShell><VisionPage content={demoData.publicContent} /></PublicShell>
}
