import type {
  MaterialityIssue,
  MaterialityAiRecommendation,
  MaterialityMatrixPoint,
  MaterialityIssueRanking,
  MaterialityReportLink,
  MaterialityVersionHistory,
  MaterialitySettings,
} from "@/types";
import {
  mockMaterialityIssues,
  mockMaterialityAiRecommendations,
  mockMaterialityMatrix,
  mockMaterialityRanking,
  mockMaterialityReportLinks,
  mockMaterialityVersionHistory,
  mockMaterialitySettings,
} from "@/lib/mock";
import { delay, apiCall } from "@/lib/api";
import {
  MaterialityIssueSchema,
  MaterialityAiRecommendationSchema,
  MaterialityMatrixPointSchema,
  MaterialityIssueRankingSchema,
  MaterialityReportLinkSchema,
  MaterialityVersionHistorySchema,
  MaterialitySettingsSchema,
} from "@/lib/schemas";

export async function getMaterialityIssues(): Promise<MaterialityIssue[]> {
  return apiCall(async () => {
    await delay(200);
    return MaterialityIssueSchema.array().parse(mockMaterialityIssues);
  });
}

export async function getMaterialityAiRecommendations(): Promise<MaterialityAiRecommendation[]> {
  return apiCall(async () => {
    await delay(150);
    return MaterialityAiRecommendationSchema.array().parse(
      mockMaterialityAiRecommendations
    );
  });
}

export async function getMaterialityMatrix(): Promise<MaterialityMatrixPoint[]> {
  return apiCall(async () => {
    await delay(150);
    return MaterialityMatrixPointSchema.array().parse(mockMaterialityMatrix);
  });
}

export async function getMaterialityRanking(): Promise<MaterialityIssueRanking[]> {
  return apiCall(async () => {
    await delay(150);
    return MaterialityIssueRankingSchema.array().parse(mockMaterialityRanking);
  });
}

export async function getMaterialityReportLinks(
  issueId?: string
): Promise<MaterialityReportLink[]> {
  return apiCall(async () => {
    await delay(100);
    const data = issueId
      ? mockMaterialityReportLinks.filter((r) => r.issueId === issueId)
      : mockMaterialityReportLinks;
    return MaterialityReportLinkSchema.array().parse(data);
  });
}

export async function getMaterialityVersionHistory(): Promise<MaterialityVersionHistory[]> {
  return apiCall(async () => {
    await delay(150);
    return MaterialityVersionHistorySchema.array().parse(
      mockMaterialityVersionHistory
    );
  });
}

export async function getMaterialitySettings(): Promise<MaterialitySettings> {
  return apiCall(async () => {
    await delay(100);
    return MaterialitySettingsSchema.parse(mockMaterialitySettings);
  });
}
