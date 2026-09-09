"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MemberPlatform } from "@/components/member/MemberPlatform";
import { createMockApi } from "@/lib/api/mock-api";
import { demoData } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth/auth-context";

export function MemberRoute() {
  const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const api = useMemo(() => createMockApi(demoData), []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login?next=/member");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="app-root">
        <main id="app-main" className="app-main auth-loading">
          <p>Checking your session…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app-root">
      <a className="skip-link" href="#app-main">
        Skip to main content
      </a>
      <main id="app-main" className="app-main">
        <MemberPlatform
          api={api}
          data={demoData}
          onPublic={() => router.push("/")}
          onLogout={async () => {
            await logout();
            router.push("/login");
          }}
        />
      </main>
    </div>
  );
}
