"use client";

import { useQuery } from "@tanstack/react-query";

export interface KpiByScope {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  calcType: string;
  calcRule: { scope: number | number[]; categories?: string[] } | null;
}

/**
 * 특정 Scope에 기여하는 KPI 목록을 DB에서 조회합니다.
 * KPI 매핑 페이지에서 calcType=auto + calcRule.scope에 해당 scope가 포함된 KPI만 반환합니다.
 */
export function useKpiByScope(scope: number, category?: string) {
  return useQuery({
    queryKey: ["kpi-by-scope", scope, category],
    queryFn: async (): Promise<KpiByScope[]> => {
      const params = new URLSearchParams({ type: "by-scope", scope: String(scope) });
      if (category) params.set("category", category);
      const res = await fetch(`/api/kpi?${params}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}
