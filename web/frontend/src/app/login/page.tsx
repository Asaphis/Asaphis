import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginRoute } from "@/components/auth/LoginRoute";

export const metadata: Metadata = {
  title: "Member login · AsaPhis ORG",
  description: "Log in to open your AsaPhis member platform.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginRoute />
    </Suspense>
  );
}
