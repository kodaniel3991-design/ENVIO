import type {
  DashboardKpiItem,
  TopVendorEmission,
  OffsetSummary,
  DashboardNotification,
  DashboardInsightItem,
  ChartDataPoint,
} from "@/types";
import {
  mockDashboardKpis,
  mockDashboardTrendData,
  mockScopeDonutData,
  mockOffsetSummary,
  mockTopVendorEmissions,
  mockDashboardInsights,
  mockDashboardNotifications,
} from "@/lib/mock/dashboard";
import { delay, apiCall } from "@/lib/api";
import {
  DashboardKpiItemSchema,
  ChartDataPointSchema,
  ScopeDonutItemSchema,
  OffsetSummarySchema,
  TopVendorEmissionSchema,
  DashboardInsightItemSchema,
  DashboardNotificationSchema,
} from "@/lib/schemas";

export async function getDashboardKpis(): Promise<DashboardKpiItem[]> {
  return apiCall(async () => {
    await delay(200);
    return DashboardKpiItemSchema.array().parse(mockDashboardKpis);
  });
}

export async function getDashboardTrendData(): Promise<ChartDataPoint[]> {
  return apiCall(async () => {
    await delay(200);
    return ChartDataPointSchema.array().parse(mockDashboardTrendData);
  });
}

export async function getScopeDonutData(): Promise<
  { name: string; value: number; tCO2e: number; fill: string }[]
> {
  return apiCall(async () => {
    await delay(100);
    return ScopeDonutItemSchema.array().parse(mockScopeDonutData);
  });
}

export async function getOffsetSummary(): Promise<OffsetSummary> {
  return apiCall(async () => {
    await delay(100);
    return OffsetSummarySchema.parse(mockOffsetSummary);
  });
}

export async function getTopVendorEmissions(): Promise<TopVendorEmission[]> {
  return apiCall(async () => {
    await delay(250);
    return TopVendorEmissionSchema.array().parse(mockTopVendorEmissions);
  });
}

export async function getDashboardInsights(): Promise<DashboardInsightItem[]> {
  return apiCall(async () => {
    await delay(200);
    return DashboardInsightItemSchema.array().parse(mockDashboardInsights);
  });
}

export async function getDashboardNotifications(): Promise<
  DashboardNotification[]
> {
  return apiCall(async () => {
    await delay(200);
    return DashboardNotificationSchema.array().parse(mockDashboardNotifications);
  });
}
