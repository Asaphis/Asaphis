import type { Metadata } from "next"
import { PublicShell } from "@/components/public/PublicShell"
import { SupportPage } from "@/components/public/pages/SupportPage"
import { PublicSectionLoader } from "@/components/public/PublicSectionLoader"
import { demoData } from "@/lib/mock-data"

export const metadata: Metadata = { title: "Support AsaPhis · AsaPhis ORG", description: "Support public education, moderation, and secure member access." }

export default function SupportRoute() {
  // Dynamic: section=support from GET /content/published, managed in admin /content.
  return <PublicShell><PublicSectionLoader fallback={demoData.publicContent}>{(content) => <SupportPage content={content} />}</PublicSectionLoader></PublicShell>
}
