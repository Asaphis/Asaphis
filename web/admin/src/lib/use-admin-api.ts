"use client";

import { useMemo } from "react";
import { createAdminApi } from "@/lib/api/admin-mock-api";
import { useAdminAuth } from "@/lib/admin-auth";

/**
 * Single seam for all admin data access.
 * Today this returns the in-memory mock; tomorrow it returns
 * HTTP clients with identical signatures — no UI changes needed.
 */
export function useAdminApi() {
  const { admin } = useAdminAuth();
  return useMemo(
    () =>
      createAdminApi({
        actor: admin?.name ?? "A. Admin",
        role: admin?.role ?? "super",
      }),
    [admin?.name, admin?.role],
  );
}
