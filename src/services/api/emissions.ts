import type {
  EmissionSummary,
  EmissionTrend,
  ScopeBreakdown,
  ChartDataPoint,
  EmissionSourceItem,
} from "@/types";
import {
  mockEmissionSummary,
  mockEmissionTrends,
  mockScopeBreakdown,
  mockTrendChartData,
  mockEmissionSources,
} from "@/lib/mock";
import { delay, apiCall } from "@/lib/api";
import {
  EmissionSummarySchema,
  EmissionTrendSchema,
  ScopeBreakdownSchema,
  ChartDataPointSchema,
  EmissionSourceItemSchema,
} from "@/lib/schemas";

export async function getEmissionSummary(): Promise<EmissionSummary> {
  return apiCall(async () => {
    await delay(300);
    return EmissionSummarySchema.parse(mockEmissionSummary);
  });
}

export async function getEmissionTrends(): Promise<EmissionTrend[]> {
  return apiCall(async () => {
    await delay(300);
    return EmissionTrendSchema.array().parse(mockEmissionTrends);
  });
}

export async function getScopeBreakdown(): Promise<ScopeBreakdown[]> {
  return apiCall(async () => {
    await delay(200);
    return ScopeBreakdownSchema.array().parse(mockScopeBreakdown);
  });
}

export async function getTrendChartData(): Promise<ChartDataPoint[]> {
  return apiCall(async () => {
    await delay(200);
    return ChartDataPointSchema.array().parse(mockTrendChartData);
  });
}

export async function getEmissionSources(): Promise<EmissionSourceItem[]> {
  return apiCall(async () => {
    await delay(250);
    return EmissionSourceItemSchema.array().parse(mockEmissionSources);
  });
}
