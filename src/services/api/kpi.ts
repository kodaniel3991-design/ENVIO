import type {
  KpiMasterItem,
  KpiTargetItem,
  KpiPerformanceItem,
  KpiChangeLogItem,
  KpiManagementItem,
  KpiSummaryCard,
  KpiCategoryItem,
  KpiCoverageItem,
  KpiSettings,
} from "@/types";
import { apiCall } from "@/lib/api";

async function fetchKpi(type: string, params?: Record<string, string>) {
  const sp = new URLSearchParams({ type, ...params });
  const res = await fetch(`/api/kpi?${sp}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getKpiMaster(): Promise<KpiMasterItem[]> {
  return apiCall(() => fetchKpi("master"));
}

export async function getKpiTargets(period?: string): Promise<KpiTargetItem[]> {
  return apiCall(() => fetchKpi("targets", period ? { period } : undefined));
}

export async function getKpiPerformance(period?: string): Promise<KpiPerformanceItem[]> {
  return apiCall(() => fetchKpi("performance", period ? { period } : undefined));
}

export async function getKpiChangeHistory(): Promise<KpiChangeLogItem[]> {
  return apiCall(() => fetchKpi("change-log"));
}

export async function saveKpiMaster(items: KpiMasterItem[]): Promise<void> {
  return apiCall(async () => {
    const res = await fetch("/api/kpi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save-master", items }),
    });
    if (!res.ok) throw new Error(await res.text());
  });
}

export async function saveKpiTargets(items: KpiTargetItem[]): Promise<void> {
  return apiCall(async () => {
    const res = await fetch("/api/kpi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save-targets", items }),
    });
    if (!res.ok) throw new Error(await res.text());
  });
}

export async function saveKpiPerformance(items: KpiPerformanceItem[]): Promise<void> {
  return apiCall(async () => {
    const res = await fetch("/api/kpi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save-performance", items }),
    });
    if (!res.ok) throw new Error(await res.text());
  });
}

export async function getKpiList(): Promise<KpiManagementItem[]> {
  return apiCall(() => fetchKpi("list"));
}

export async function getKpiSummary(): Promise<KpiSummaryCard[]> {
  return apiCall(() => fetchKpi("summary"));
}

export async function getKpiCategories(): Promise<KpiCategoryItem[]> {
  return apiCall(() => fetchKpi("categories"));
}

export async function getKpiCoverage(): Promise<KpiCoverageItem[]> {
  return apiCall(() => fetchKpi("coverage"));
}

export async function getKpiSettings(): Promise<KpiSettings> {
  return apiCall(() => fetchKpi("settings"));
}

export async function deleteKpiMaster(id: string): Promise<void> {
  return apiCall(async () => {
    const res = await fetch("/api/kpi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete-master", id }),
    });
    if (!res.ok) throw new Error(await res.text());
  });
}
