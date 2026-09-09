import type { Metadata } from "next"
import { MemberRoute } from "@/components/routes/MemberRoute"

export const metadata: Metadata = { title: "Member platform · AsaPhis ORG", description: "Explore the AsaPhis member platform prototype." }

export default function MemberPage() {
  return <MemberRoute />
}
