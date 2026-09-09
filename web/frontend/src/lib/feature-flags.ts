export type FeatureFlag = "memberChat" | "trustedLowRiskPublishing"

export const demoFeatureFlags: Record<FeatureFlag, boolean> = {
  memberChat: false,
  trustedLowRiskPublishing: false,
}
