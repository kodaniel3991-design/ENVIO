import type {
  ReductionScenario,
  SimulatorResult,
  ReductionOpportunity,
  ReductionProject,
  ReductionProgressKpi,
  ReductionScopeSummary,
} from "@/types";
import {
  mockReductionScenarios,
  mockSimulatorResult,
  mockReductionOpportunities,
  mockReductionProjects,
  mockReductionProgressKpis,
  mockReductionScopeSummary,
} from "@/lib/mock";
import { delay, apiCall } from "@/lib/api";
import {
  ReductionScenarioSchema,
  SimulatorResultSchema,
  ReductionOpportunitySchema,
  ReductionProjectSchema,
  ReductionProgressKpiSchema,
  ReductionScopeSummarySchema,
} from "@/lib/schemas";

export async function getReductionScenarios(): Promise<ReductionScenario[]> {
  return apiCall(async () => {
    await delay(250);
    return ReductionScenarioSchema.array().parse(mockReductionScenarios);
  });
}

export async function runSimulation(
  _scenarioId: string
): Promise<SimulatorResult> {
  return apiCall(async () => {
    await delay(600);
    return SimulatorResultSchema.parse(mockSimulatorResult);
  });
}

export async function getReductionOpportunities(): Promise<ReductionOpportunity[]> {
  return apiCall(async () => {
    await delay(200);
    return ReductionOpportunitySchema.array().parse(mockReductionOpportunities);
  });
}

export async function getReductionProjects(): Promise<ReductionProject[]> {
  return apiCall(async () => {
    await delay(200);
    return ReductionProjectSchema.array().parse(mockReductionProjects);
  });
}

export async function getReductionProgressKpis(): Promise<ReductionProgressKpi[]> {
  return apiCall(async () => {
    await delay(150);
    return ReductionProgressKpiSchema.array().parse(mockReductionProgressKpis);
  });
}

export async function getReductionScopeSummary(): Promise<ReductionScopeSummary[]> {
  return apiCall(async () => {
    await delay(150);
    return ReductionScopeSummarySchema.array().parse(mockReductionScopeSummary);
  });
}
