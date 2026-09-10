"use client";

import { useMemo } from "react";
import { createAdminApiResolved } from "@/lib/api/admin-api-factory";
import { useAdminAuth } from "@/lib/admin-auth";

/**
 * Single seam for all admin data access.
 * Real when NEXT_PUBLIC_API_BASE_URL is set (calls backend with Bearer JWT),
 * otherwise in-memory mock so UI keeps working during migration.
 */
export function useAdminApi() {
  const { admin } = useAdminAuth();
  return useMemo(
    () =>
      createAdminApiResolved(
        admin?.name ?? "A. Admin",
        admin?.role ?? "super",
      ),
    [admin?.name, admin?.role],
  );
}
