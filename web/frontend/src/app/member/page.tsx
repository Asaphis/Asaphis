import type { Metadata } from "next"
import { MemberRoute } from "@/components/routes/MemberRoute"

export const metadata: Metadata = { title: "Member platform · AsaPhis ORG", description: "Open your AsaPhis member platform." }

export default function MemberPage() {
  return <MemberRoute />
}
