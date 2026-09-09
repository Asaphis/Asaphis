import type { Metadata } from "next"
import { PublicShell } from "@/components/public/PublicShell"
import { SupportPage } from "@/components/public/pages/SupportPage"
import { demoData } from "@/lib/mock-data"

export const metadata: Metadata = { title: "Support AsaPhis · AsaPhis ORG", description: "Support public education, moderation, and secure member access." }

export default function SupportRoute() {
  return <PublicShell><SupportPage content={demoData.publicContent} /></PublicShell>
}
