import type { Metadata } from "next"
import { PublicShell } from "@/components/public/PublicShell"
import { MessagePage } from "@/components/public/pages/MessagePage"
import { PublicSectionLoader } from "@/components/public/PublicSectionLoader"
import { demoData } from "@/lib/mock-data"

export const metadata: Metadata = { title: "Featured message · AsaPhis ORG", description: "Read and watch the AsaPhis featured message with its transcript." }

export default function MessageRoute() {
  // Dynamic: video + title + description from GET /content/published section=message.
  return <PublicShell><PublicSectionLoader fallback={demoData.publicContent}>{(content) => <MessagePage content={content} />}</PublicSectionLoader></PublicShell>
}
