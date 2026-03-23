import { apiCall } from "@/lib/api";

async function fetchReduction(type: string) {
  const res = await fetch(`/api/reduction?type=${type}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getReductionProjects() {
  return apiCall(() => fetchReduction("projects"));
}

export async function getReductionSummary() {
  return apiCall(() => fetchReduction("summary"));
}

export async function getReductionScenarios() {
  return apiCall(() => fetchReduction("scenarios"));
}

export async function runSimulation(scenarioId: string) {
  return apiCall(async () => {
    const res = await fetch("/api/reduction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "simulate", scenarioId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  });
}

export async function getReductionOpportunities() {
  return apiCall(() => fetchReduction("opportunities"));
}

export async function getReductionProgressKpis() {
  return apiCall(() => fetchReduction("progress-kpis"));
}

export async function getReductionScopeSummary() {
  return apiCall(() => fetchReduction("scope-summary"));
}

export async function saveReductionProject(item: any): Promise<void> {
  return apiCall(async () => {
    const res = await fetch("/api/reduction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save", item }),
    });
    if (!res.ok) throw new Error(await res.text());
  });
}

export async function deleteReductionProject(id: string): Promise<void> {
  return apiCall(async () => {
    const res = await fetch("/api/reduction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    if (!res.ok) throw new Error(await res.text());
  });
}
