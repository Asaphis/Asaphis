import type { Metadata } from "next"
import { PublicShell } from "@/components/public/PublicShell"
import { PublicHomePage } from "@/components/public/pages/PublicHomePage"
import { demoData } from "@/lib/mock-data"

export const metadata: Metadata = {
  title: "AsaPhis ORG · Knowledge, community, future",
  description: "A serious home for African education, community knowledge, and the people carrying it forward.",
}

export default function HomePage() {
  return <PublicShell><PublicHomePage content={demoData.publicContent} /></PublicShell>
}
