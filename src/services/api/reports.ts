import { apiCall } from "@/lib/api";

async function fetchReports(type: string) {
  const res = await fetch(`/api/reports?type=${type}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getESGReports() {
  return apiCall(() => fetchReports("list"));
}

export async function getComplianceStatus() {
  return apiCall(() => fetchReports("compliance"));
}

export async function getMappingItems() {
  return apiCall(() => fetchReports("mappings"));
}

export async function getReportTemplates() {
  return apiCall(() => fetchReports("templates"));
}

export async function getReportReadiness() {
  return apiCall(() => fetchReports("readiness"));
}

export async function getReportHistory() {
  return apiCall(() => fetchReports("history"));
}

export async function getDisclosureFrameworkItems() {
  return apiCall(() => fetchReports("disclosure-framework"));
}

export async function saveReport(item: any): Promise<void> {
  return apiCall(async () => {
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save-report", item }),
    });
    if (!res.ok) throw new Error(await res.text());
  });
}

export async function saveComplianceItems(items: any[]): Promise<void> {
  return apiCall(async () => {
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save-compliance", items }),
    });
    if (!res.ok) throw new Error(await res.text());
  });
}
