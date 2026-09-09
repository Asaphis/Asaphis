import type { MemberProfile } from "@/lib/types"

export type PermissionAction =
  | "read:member"
  | "download:document"
  | "submit:community"
  | "comment:community"
  | "request:travel"
  | "create:support"

export function createPermissions(member: MemberProfile) {
  return {
    can(action: PermissionAction) {
      if (member.accountStatus === "limited") {
        return ["read:member", "create:support", "request:travel"].includes(action)
      }
      return true
    },
  }
}
