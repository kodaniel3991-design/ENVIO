import { apiCall } from "@/lib/api";
import type {
  DashboardKpiItem,
  ChartDataPoint,
  OffsetSummary,
  TopVendorEmission,
  DashboardInsightItem,
  DashboardNotification,
  ScopeBreakdown,
} from "@/types";

async function fetchDashboard(type: string, year?: string) {
  const sp = new URLSearchParams({ type });
  if (year) sp.set("year", year);
  const res = await fetch(`/api/dashboard?${sp}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getDashboardSummary(year?: string) {
  return apiCall(() => fetchDashboard("summary", year));
}

export async function getScopeBreakdown(year?: string): Promise<ScopeBreakdown[]> {
  return apiCall(() => fetchDashboard("scope-breakdown", year));
}

export async function getDashboardTrends(year?: string) {
  return apiCall(() => fetchDashboard("trends", year));
}

// Legacy dashboard functions used by use-dashboard-data hook / dashboard-content.tsx

export async function getDashboardKpis(): Promise<DashboardKpiItem[]> {
  return apiCall(() => fetchDashboard("kpis"));
}

export async function getDashboardTrendData(): Promise<ChartDataPoint[]> {
  return apiCall(() => fetchDashboard("trend-data"));
}

export async function getScopeDonutData(): Promise<{ name: string; value: number; tCO2e: number; fill: string }[]> {
  return apiCall(() => fetchDashboard("scope-donut"));
}

export async function getOffsetSummary(): Promise<OffsetSummary> {
  return apiCall(() => fetchDashboard("offset-summary"));
}

export async function getTopVendorEmissions(): Promise<TopVendorEmission[]> {
  return apiCall(() => fetchDashboard("top-vendors"));
}

export async function getDashboardInsights(): Promise<DashboardInsightItem[]> {
  return apiCall(() => fetchDashboard("insights"));
}

export async function getDashboardNotifications(): Promise<DashboardNotification[]> {
  return apiCall(() => fetchDashboard("notifications"));
}
