import type { Metadata } from "next"
import { PublicShell } from "@/components/public/PublicShell"
import { AboutPage } from "@/components/public/pages/AboutPage"
import { demoData } from "@/lib/mock-data"

export const metadata: Metadata = { title: "About AsaPhis · AsaPhis ORG", description: "Learn what AsaPhis is building and how it handles knowledge and participation." }

export default function AboutRoute() {
  return <PublicShell><AboutPage content={demoData.publicContent} /></PublicShell>
}
