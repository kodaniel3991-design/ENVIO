"use client";

import { useQuery } from "@tanstack/react-query";
import type { EmployeeRosterItem } from "@/types";

async function fetchEmployees(worksiteId?: string): Promise<EmployeeRosterItem[]> {
  const url = new URL("/api/employees", window.location.origin);
  if (worksiteId) url.searchParams.set("worksiteId", worksiteId);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("직원 데이터 로드 실패");
  return res.json();
}

export function useEmployees(worksiteId?: string, enabled = true) {
  return useQuery({
    queryKey: ["employees", worksiteId ?? "all"],
    queryFn: () => fetchEmployees(worksiteId),
    staleTime: 0,
    enabled,
  });
}
