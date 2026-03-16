import type { EsgMetricItem, EsgSummaryCard } from "@/types";
import {
  mockEnvironmentMetrics,
  mockEnvironmentSummary,
  mockSocialMetrics,
  mockSocialSummary,
  mockGovernanceMetrics,
  mockGovernanceSummary,
} from "@/lib/mock/esg";
import { delay, apiCall } from "@/lib/api";
import { EsgMetricItemSchema, EsgSummaryCardSchema } from "@/lib/schemas";

export async function getEnvironmentMetrics(): Promise<EsgMetricItem[]> {
  return apiCall(async () => {
    await delay(280);
    return EsgMetricItemSchema.array().parse(mockEnvironmentMetrics);
  });
}

export async function getEnvironmentSummary(): Promise<EsgSummaryCard[]> {
  return apiCall(async () => {
    await delay(150);
    return EsgSummaryCardSchema.array().parse(mockEnvironmentSummary);
  });
}

export async function getSocialMetrics(): Promise<EsgMetricItem[]> {
  return apiCall(async () => {
    await delay(280);
    return EsgMetricItemSchema.array().parse(mockSocialMetrics);
  });
}

export async function getSocialSummary(): Promise<EsgSummaryCard[]> {
  return apiCall(async () => {
    await delay(150);
    return EsgSummaryCardSchema.array().parse(mockSocialSummary);
  });
}

export async function getGovernanceMetrics(): Promise<EsgMetricItem[]> {
  return apiCall(async () => {
    await delay(280);
    return EsgMetricItemSchema.array().parse(mockGovernanceMetrics);
  });
}

export async function getGovernanceSummary(): Promise<EsgSummaryCard[]> {
  return apiCall(async () => {
    await delay(150);
    return EsgSummaryCardSchema.array().parse(mockGovernanceSummary);
  });
}
