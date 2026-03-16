import type {
  AIInsight,
  AiKpiCard,
  AiAnomalyItem,
  AiScenarioItem,
  AiForecastPoint,
  AiRoiPoint,
  AiRiskSummary,
  AiSupplyChainRiskItem,
  AiInsightReportItem,
} from "@/types";
import {
  mockAIInsights,
  mockAiKpiCards,
  mockAiAnomalies,
  mockAiScenarios,
  mockAiForecast,
  mockAiRoi,
  mockAiRiskSummary,
  mockAiSupplyChainRisk,
  mockAiInsightReports,
} from "@/lib/mock";
import { delay, apiCall } from "@/lib/api";
import {
  AIInsightSchema,
  AiKpiCardSchema,
  AiAnomalyItemSchema,
  AiScenarioItemSchema,
  AiForecastPointSchema,
  AiRoiPointSchema,
  AiRiskSummarySchema,
  AiSupplyChainRiskItemSchema,
  AiInsightReportItemSchema,
} from "@/lib/schemas";

export async function getAIInsights(): Promise<AIInsight[]> {
  return apiCall(async () => {
    await delay(200);
    return AIInsightSchema.array().parse(mockAIInsights);
  });
}

export async function getAiKpiCards(): Promise<AiKpiCard[]> {
  return apiCall(async () => {
    await delay(150);
    return AiKpiCardSchema.array().parse(mockAiKpiCards);
  });
}

export async function getAiAnomalies(): Promise<AiAnomalyItem[]> {
  return apiCall(async () => {
    await delay(200);
    return AiAnomalyItemSchema.array().parse(mockAiAnomalies);
  });
}

export async function getAiScenarios(): Promise<AiScenarioItem[]> {
  return apiCall(async () => {
    await delay(200);
    return AiScenarioItemSchema.array().parse(mockAiScenarios);
  });
}

export async function getAiForecast(): Promise<AiForecastPoint[]> {
  return apiCall(async () => {
    await delay(150);
    return AiForecastPointSchema.array().parse(mockAiForecast);
  });
}

export async function getAiRoi(): Promise<AiRoiPoint[]> {
  return apiCall(async () => {
    await delay(150);
    return AiRoiPointSchema.array().parse(mockAiRoi);
  });
}

export async function getAiRiskSummary(): Promise<AiRiskSummary> {
  return apiCall(async () => {
    await delay(120);
    return AiRiskSummarySchema.parse(mockAiRiskSummary);
  });
}

export async function getAiSupplyChainRisk(): Promise<AiSupplyChainRiskItem[]> {
  return apiCall(async () => {
    await delay(150);
    return AiSupplyChainRiskItemSchema.array().parse(mockAiSupplyChainRisk);
  });
}

export async function getAiInsightReports(): Promise<AiInsightReportItem[]> {
  return apiCall(async () => {
    await delay(150);
    return AiInsightReportItemSchema.array().parse(mockAiInsightReports);
  });
}
