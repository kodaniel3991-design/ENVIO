import type {
  ESGReport,
  ReportTemplate,
  ReportGenerationReadiness,
  ReportGenerationHistoryItem,
  DisclosureFrameworkItem,
  MappingEngineItem,
} from "@/types";
import {
  mockESGReports,
  mockReportTemplates,
  mockReportReadiness,
  mockReportHistory,
  mockDisclosureFrameworkItems,
  mockMappingItems,
} from "@/lib/mock";
import { delay, apiCall } from "@/lib/api";
import {
  ESGReportSchema,
  ReportTemplateSchema,
  ReportGenerationReadinessSchema,
  ReportGenerationHistoryItemSchema,
  DisclosureFrameworkItemSchema,
  MappingEngineItemSchema,
} from "@/lib/schemas";

export async function getESGReports(): Promise<ESGReport[]> {
  return apiCall(async () => {
    await delay(250);
    return ESGReportSchema.array().parse(mockESGReports);
  });
}

export async function getReportTemplates(): Promise<ReportTemplate[]> {
  return apiCall(async () => {
    await delay(200);
    return ReportTemplateSchema.array().parse(mockReportTemplates);
  });
}

export async function getReportReadiness(): Promise<ReportGenerationReadiness[]> {
  return apiCall(async () => {
    await delay(150);
    return ReportGenerationReadinessSchema.array().parse(mockReportReadiness);
  });
}

export async function getReportHistory(): Promise<ReportGenerationHistoryItem[]> {
  return apiCall(async () => {
    await delay(150);
    return ReportGenerationHistoryItemSchema.array().parse(mockReportHistory);
  });
}

export async function getDisclosureFrameworkItems(): Promise<DisclosureFrameworkItem[]> {
  return apiCall(async () => {
    await delay(200);
    return DisclosureFrameworkItemSchema.array().parse(
      mockDisclosureFrameworkItems
    );
  });
}

export async function getMappingItems(): Promise<MappingEngineItem[]> {
  return apiCall(async () => {
    await delay(200);
    return MappingEngineItemSchema.array().parse(mockMappingItems);
  });
}
