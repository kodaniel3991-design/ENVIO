import type {
  KpiManagementItem,
  KpiSummaryCard,
  KpiMasterItem,
  KpiTargetItem,
  KpiPerformanceItem,
  KpiCoverageItem,
  KpiCategoryItem,
  KpiChangeLogItem,
  KpiSettings,
} from "@/types";
import {
  mockKpiList,
  mockKpiSummary,
  mockKpiMaster,
  mockKpiTargets,
  mockKpiPerformance,
  mockKpiCoverage,
  mockKpiCategories,
  mockKpiChangeHistory,
  mockKpiSettings,
} from "@/lib/mock";
import { delay, apiCall } from "@/lib/api";
import {
  KpiManagementItemSchema,
  KpiSummaryCardSchema,
  KpiMasterItemSchema,
  KpiTargetItemSchema,
  KpiPerformanceItemSchema,
  KpiCoverageItemSchema,
  KpiCategoryItemSchema,
  KpiChangeLogItemSchema,
  KpiSettingsSchema,
} from "@/lib/schemas";

export async function getKpiList(): Promise<KpiManagementItem[]> {
  return apiCall(async () => {
    await delay(250);
    return KpiManagementItemSchema.array().parse(mockKpiList);
  });
}

export async function getKpiSummary(): Promise<KpiSummaryCard[]> {
  return apiCall(async () => {
    await delay(150);
    return KpiSummaryCardSchema.array().parse(mockKpiSummary);
  });
}

export async function getKpiMaster(): Promise<KpiMasterItem[]> {
  return apiCall(async () => {
    await delay(200);
    return KpiMasterItemSchema.array().parse(mockKpiMaster);
  });
}

export async function getKpiTargets(): Promise<KpiTargetItem[]> {
  return apiCall(async () => {
    await delay(200);
    return KpiTargetItemSchema.array().parse(mockKpiTargets);
  });
}

export async function getKpiPerformance(): Promise<KpiPerformanceItem[]> {
  return apiCall(async () => {
    await delay(200);
    return KpiPerformanceItemSchema.array().parse(mockKpiPerformance);
  });
}

export async function getKpiCoverage(): Promise<KpiCoverageItem[]> {
  return apiCall(async () => {
    await delay(150);
    return KpiCoverageItemSchema.array().parse(mockKpiCoverage);
  });
}

export async function getKpiCategories(): Promise<KpiCategoryItem[]> {
  return apiCall(async () => {
    await delay(150);
    return KpiCategoryItemSchema.array().parse(mockKpiCategories);
  });
}

export async function getKpiChangeHistory(): Promise<KpiChangeLogItem[]> {
  return apiCall(async () => {
    await delay(200);
    return KpiChangeLogItemSchema.array().parse(mockKpiChangeHistory);
  });
}

export async function getKpiSettings(): Promise<KpiSettings> {
  return apiCall(async () => {
    await delay(100);
    return KpiSettingsSchema.parse(mockKpiSettings);
  });
}
