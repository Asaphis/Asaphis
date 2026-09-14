"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SocialApp } from "@/components/app/SocialApp";
import { createApi } from "@/lib/api/api-factory";
import { useAuth } from "@/lib/auth/auth-context";

export function MemberRoute() {
  const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAuth();
  // Real API when NEXT_PUBLIC_API_BASE_URL is set, mock fallback otherwise.
  const api = useMemo(() => createApi(), []);

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
        <SocialApp
          api={api}
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
