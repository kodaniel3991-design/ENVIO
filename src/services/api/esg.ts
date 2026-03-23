import type { EsgMetricItem } from "@/types";
import { apiCall } from "@/lib/api";

async function fetchEsg(domain: string, period?: string): Promise<EsgMetricItem[]> {
  const sp = new URLSearchParams({ domain });
  if (period) sp.set("period", period);
  const res = await fetch(`/api/esg?${sp}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getEnvironmentMetrics(period?: string): Promise<EsgMetricItem[]> {
  return apiCall(() => fetchEsg("environment", period));
}

export async function getSocialMetrics(period?: string): Promise<EsgMetricItem[]> {
  return apiCall(() => fetchEsg("social", period));
}

export async function getGovernanceMetrics(period?: string): Promise<EsgMetricItem[]> {
  return apiCall(() => fetchEsg("governance", period));
}

export async function getEnvironmentSummary() {
  const metrics = await getEnvironmentMetrics();
  return deriveSummary(metrics, "환경");
}

export async function getSocialSummary() {
  const metrics = await getSocialMetrics();
  return deriveSummary(metrics, "사회");
}

export async function getGovernanceSummary() {
  const metrics = await getGovernanceMetrics();
  return deriveSummary(metrics, "거버넌스");
}

function deriveSummary(
  metrics: EsgMetricItem[],
  domainLabel: string
): { label: string; value: string | number; unit?: string }[] {
  if (!metrics.length) {
    return [{ label: `${domainLabel} 지표`, value: 0, unit: "건" }];
  }
  const total = metrics.length;
  const verified = metrics.filter((m) => m.status === "verified").length;
  const pending = metrics.filter((m) => m.status === "pending").length;
  return [
    { label: "총 지표", value: total, unit: "건" },
    { label: "검증 완료", value: verified, unit: "건" },
    { label: "대기중", value: pending, unit: "건" },
  ];
}

export async function saveEsgMetrics(items: EsgMetricItem[]): Promise<void> {
  return apiCall(async () => {
    const res = await fetch("/api/esg", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error(await res.text());
  });
}
