"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { JoinJourney } from "@/components/onboarding/JoinJourney";
import { createMockApi } from "@/lib/api/mock-api";
import { demoData } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth/auth-context";

export function JoinRoute() {
  const router = useRouter();
  const { completeSignup } = useAuth();
  const api = useMemo(() => createMockApi(demoData), []);

  return (
    <div className="app-root">
      <a className="skip-link" href="#app-main">
        Skip to main content
      </a>
      <main id="app-main" className="app-main">
        <JoinJourney
          api={api}
          onBackToPublic={() => router.push("/")}
          onActivated={(email) => {
            completeSignup(email);
            router.push("/member");
          }}
        />
      </main>
    </div>
  );
}
