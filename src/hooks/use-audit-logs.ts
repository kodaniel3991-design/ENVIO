"use client";

import { useQuery } from "@tanstack/react-query";
import type { AuditLogItem } from "@/types/scope1";

async function fetchAuditLogs(facilityId?: string, year?: string): Promise<AuditLogItem[]> {
  const params = new URLSearchParams();
  if (facilityId) params.set("facilityId", facilityId);
  if (year) params.set("year", year);
  params.set("limit", "10");

  const res = await fetch(`/api/audit-logs?${params.toString()}`);
  if (!res.ok) return [];
  return res.json();
}

export function useAuditLogs(facilityId?: string, year?: string) {
  return useQuery({
    queryKey: ["audit-logs", facilityId, year],
    queryFn: () => fetchAuditLogs(facilityId, year),
    enabled: !!facilityId,
    staleTime: 1000 * 30,
  });
}
