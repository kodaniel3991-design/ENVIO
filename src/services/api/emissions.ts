import type {
  EmissionSummary,
  EmissionSourceItem,
} from "@/types";
import { apiCall } from "@/lib/api";

async function fetchEmissions(type: string, year?: string) {
  const sp = new URLSearchParams({ type });
  if (year) sp.set("year", year);
  const res = await fetch(`/api/emissions?${sp}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getEmissionSummary(year?: string): Promise<EmissionSummary> {
  return apiCall(() => fetchEmissions("summary", year));
}

export async function getEmissionSources(year?: string): Promise<EmissionSourceItem[]> {
  return apiCall(() => fetchEmissions("sources", year));
}

export async function getEmissionTrends(year?: string): Promise<any[]> {
  return apiCall(() => fetchEmissions("trends", year));
}
