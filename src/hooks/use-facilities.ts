"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface DbFacilityRow {
  id: string;
  scope: number;
  category_id?: string;
  facility_name: string;
  fuel_type: string | null;
  energy_type: string | null;
  activity_type: string | null;
  unit: string;
  data_method: string;
  sort_order: number;
}

async function fetchFacilities(scope: number, category?: string): Promise<DbFacilityRow[]> {
  const url = new URL("/api/facilities", window.location.origin);
  url.searchParams.set("scope", String(scope));
  if (category) url.searchParams.set("category", category);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("시설 데이터 로드 실패");
  return res.json();
}

async function saveFacilities(scope: number, category: string, rows: DbFacilityRow[]) {
  const res = await fetch("/api/facilities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scope,
      categoryId: category,
      rows: rows.map((r, i) => ({
        id: r.id,
        facilityName: r.facility_name,
        fuelType: r.fuel_type,
        energyType: r.energy_type,
        activityType: r.activity_type,
        unit: r.unit,
        dataMethod: r.data_method,
        sortOrder: i,
      })),
    }),
  });
  if (!res.ok) throw new Error("시설 데이터 저장 실패");
  return res.json();
}

export function useFacilities(scope: number, category?: string) {
  return useQuery({
    queryKey: ["facilities", scope, category],
    queryFn: () => fetchFacilities(scope, category),
    staleTime: 1000 * 60 * 5, // 5분
  });
}

export function useSaveFacilities(scope: number, category: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rows: DbFacilityRow[]) => saveFacilities(scope, category, rows),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facilities", scope] });
    },
  });
}
