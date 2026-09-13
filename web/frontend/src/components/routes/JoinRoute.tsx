"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { JoinJourney } from "@/components/onboarding/JoinJourney";
import { createApi } from "@/lib/api/api-factory";
import { useAuth } from "@/lib/auth/auth-context";

export function JoinRoute() {
  const router = useRouter();
  const { completeSignup } = useAuth();
  // Real API when env is set so onboarding (phone/identity/payment) is live.
  const api = useMemo(() => createApi(), []);

  return (
    <div className="app-root">
      <a className="skip-link" href="#app-main">
        Skip to main content
      </a>
      <main id="app-main" className="app-main">
        <JoinJourney
          api={api}
          onBackToPublic={() => router.push("/")}
          onActivated={async (email) => {
            await completeSignup(email);
            router.push("/member");
          }}
        />
      </main>
    </div>
  );
}
