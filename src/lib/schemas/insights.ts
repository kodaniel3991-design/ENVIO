import { z } from "zod";
import { ScopeSchema, RiskLevelSchema, ChartDataPointSchema } from "./common";

export const AIInsightSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  category: z.enum(["reduction", "risk", "opportunity", "compliance"]),
  confidence: z.number(),
  createdAt: z.string(),
  actions: z.array(z.string()).optional(),
});

export const AiKpiCardSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.union([z.string(), z.number()]),
  unit: z.string().optional(),
  changePercent: z.number().optional(),
  riskLevel: z.enum(["low", "medium", "high"]).optional(),
});

export const AiAnomalyItemSchema = z.object({
  id: z.string(),
  source: z.string(),
  dimension: z.enum(["carbon", "esg", "supply_chain"]),
  kpiName: z.string().optional(),
  severity: z.enum(["low", "medium", "high"]),
  deviationPercent: z.number(),
  period: z.string(),
  causeSummary: z.string(),
  linkedKpiCount: z.number(),
  linkedVendorCount: z.number(),
});

export const AiScenarioItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  reductionMtCO2e: z.number(),
  reductionPercent: z.number(),
  costImpact: z.enum(["low", "medium", "high"]),
  roiYears: z.number().optional(),
});

export const AiForecastPointSchema = ChartDataPointSchema.extend({
  scenarioId: z.string(),
});

export const AiRoiPointSchema = z.object({
  scenarioId: z.string(),
  label: z.string(),
  investment: z.number(),
  benefit: z.number(),
  roiPercent: z.number(),
});

export const AiRiskSummarySchema = z.object({
  kpiAtRiskCount: z.number(),
  anomalyCount: z.number(),
  highRiskVendors: z.number(),
  supplyChainHotspots: z.number(),
});

export const AiSupplyChainRiskItemSchema = z.object({
  id: z.string(),
  vendorName: z.string(),
  tier: z.number(),
  category: z.string(),
  riskLevel: z.enum(["low", "medium", "high"]),
  emissionsSharePercent: z.number(),
  anomalyCount: z.number(),
});

export const AiInsightReportItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  readyForReport: z.boolean(),
  relatedKpiCount: z.number(),
  relatedIssueCount: z.number(),
  createdAt: z.string(),
});
