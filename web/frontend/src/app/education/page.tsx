import type { Metadata } from "next"
import { PublicShell } from "@/components/public/PublicShell"
import { EducationPage } from "@/components/public/pages/EducationPage"
import { demoData } from "@/lib/mock-data"

export const metadata: Metadata = { title: "Education preview · AsaPhis ORG", description: "Browse public AsaPhis education resources and preview the member library." }

export default function EducationRoute() {
  return <PublicShell><EducationPage content={demoData.publicContent} /></PublicShell>
}
