"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import type { ScopeCategoryId } from "@/types/scope1";

interface DbFacilityRow {
  id: string;
  facility_name: string;
  fuel_type: string | null;
  unit: string;
  category_id?: string;
}

async function fetchFacilities(scope: number, category: string): Promise<DbFacilityRow[]> {
  const res = await fetch(`/api/facilities?scope=${scope}&category=${category}`);
  if (!res.ok) return [];
  return res.json();
}

async function fetchActivity(facilityId: string, year: string): Promise<number[]> {
  if (!facilityId) return Array(12).fill(0);
  const res = await fetch(`/api/activity?facilityId=${facilityId}&year=${year}`);
  if (!res.ok) return Array(12).fill(0);
  const data = await res.json();
  return (data.values as number[]) ?? Array(12).fill(0);
}

interface EmissionFactorInfo {
  combined: number;
}

/**
 * 전체 카테고리의 시설 + 활동량을 한번에 로드하여
 * 시설별/카테고리별/YoY 비교 데이터를 구성합니다.
 */
export function useScope1Comparison(
  year: string,
  currentCategoryId: ScopeCategoryId,
  getFactorCombined: (fuel: string) => number,
) {
  const categories: ScopeCategoryId[] = ["fixed", "mobile", "fugitive"];
  const years = [year, String(Number(year) - 1), String(Number(year) - 2)];

  // 1. 전체 카테고리의 시설 목록 로드
  const facilityQueries = useQueries({
    queries: categories.map((cat) => ({
      queryKey: ["facilities", 1, cat],
      queryFn: () => fetchFacilities(1, cat),
      staleTime: 1000 * 60 * 5,
    })),
  });

  const allFacilitiesByCategory: Record<string, DbFacilityRow[]> = {};
  categories.forEach((cat, i) => {
    allFacilitiesByCategory[cat] = facilityQueries[i]?.data ?? [];
  });

  // 전체 시설 flat 목록
  const allFacilities = categories.flatMap((cat) =>
    (allFacilitiesByCategory[cat] ?? []).map((f) => ({ ...f, categoryId: cat }))
  );

  // 2. 모든 시설 × 모든 연도의 활동량 로드
  const activityQueries = useQueries({
    queries: allFacilities.flatMap((f) =>
      years.map((y) => ({
        queryKey: ["activity", f.id, y],
        queryFn: () => fetchActivity(f.id, y),
        enabled: !!f.id,
        staleTime: 1000 * 60 * 5,
      }))
    ),
  });

  // 활동량 매핑: facilityId-year → number[]
  const activityMap: Record<string, number[]> = {};
  let queryIdx = 0;
  allFacilities.forEach((f) => {
    years.forEach((y) => {
      const key = `${f.id}-${y}`;
      activityMap[key] = activityQueries[queryIdx]?.data ?? Array(12).fill(0);
      queryIdx++;
    });
  });

  const isLoading = facilityQueries.some((q) => q.isLoading) || activityQueries.some((q) => q.isLoading);

  // 3. 데이터 구성 — 현재 카테고리의 시설별 배출량
  const currentCatFacilities = (allFacilitiesByCategory[currentCategoryId] ?? []);
  const facilityEmissions = currentCatFacilities.map((f) => {
    const activity = activityMap[`${f.id}-${year}`] ?? Array(12).fill(0);
    const factor = getFactorCombined(f.fuel_type ?? "LNG");
    const monthly = activity.map((v) => (Number.isNaN(v) ? 0 : v) * factor);
    return {
      id: f.id,
      name: f.facility_name,
      fuel: f.fuel_type ?? "LNG",
      unit: f.unit,
      monthly,
      total: monthly.reduce((s, v) => s + v, 0),
    };
  });

  // 4. 카테고리별 배출량
  const CATEGORY_LABELS: Record<string, string> = {
    fixed: "고정연소",
    mobile: "이동연소",
    fugitive: "비가스배출",
  };

  const categoryEmissions = categories.map((cat) => {
    const catFacilities = allFacilitiesByCategory[cat] ?? [];
    const monthlyAgg = Array(12).fill(0) as number[];

    catFacilities.forEach((f) => {
      const activity = activityMap[`${f.id}-${year}`] ?? Array(12).fill(0);
      const factor = getFactorCombined(f.fuel_type ?? "LNG");
      activity.forEach((v, mi) => {
        monthlyAgg[mi] += (Number.isNaN(v) ? 0 : v) * factor;
      });
    });

    return {
      categoryId: cat,
      label: CATEGORY_LABELS[cat],
      monthly: monthlyAgg,
      total: monthlyAgg.reduce((s, v) => s + v, 0),
      facilityCount: catFacilities.length,
    };
  });

  // 5. 연도별 비교 (전체 Scope 1 합산)
  const yearComparisons = years.map((y) => {
    const monthlyAgg = Array(12).fill(0) as number[];

    allFacilities.forEach((f) => {
      const activity = activityMap[`${f.id}-${y}`] ?? Array(12).fill(0);
      const factor = getFactorCombined(f.fuel_type ?? "LNG");
      activity.forEach((v, mi) => {
        monthlyAgg[mi] += (Number.isNaN(v) ? 0 : v) * factor;
      });
    });

    return {
      year: y,
      monthly: monthlyAgg,
      total: monthlyAgg.reduce((s, v) => s + v, 0),
    };
  });

  return {
    isLoading,
    facilityEmissions,
    categoryEmissions,
    yearComparisons,
  };
}
