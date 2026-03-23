import { apiCall } from "@/lib/api";
import type { MaterialityVersionHistory } from "@/types";

async function fetchMateriality(type: string) {
  const res = await fetch(`/api/materiality?type=${type}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getMaterialityIssues() {
  return apiCall(() => fetchMateriality("issues"));
}

export async function getMaterialityMatrix() {
  return apiCall(() => fetchMateriality("matrix"));
}

export async function getMaterialityVersionHistory(): Promise<MaterialityVersionHistory[]> {
  return apiCall(() => fetchMateriality("version-history"));
}

export async function getMaterialityAiRecommendations() {
  return apiCall(() => fetchMateriality("ai-recommendations"));
}

export async function getMaterialityRanking() {
  return apiCall(() => fetchMateriality("ranking"));
}

export async function getMaterialityReportLinks(issueId?: string) {
  const type = issueId ? `report-links&issueId=${issueId}` : "report-links";
  return apiCall(() => fetchMateriality(type));
}

export async function getMaterialitySettings() {
  return apiCall(() => fetchMateriality("settings"));
}

export async function saveMaterialityIssues(items: any[]): Promise<void> {
  return apiCall(async () => {
    const res = await fetch("/api/materiality", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error(await res.text());
  });
}
