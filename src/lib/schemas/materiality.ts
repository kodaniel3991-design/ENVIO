import { z } from "zod";

const MaterialityEsgDimensionSchema = z.enum([
  "environment",
  "social",
  "governance",
]);

export const MaterialityIssueSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  dimension: MaterialityEsgDimensionSchema,
  description: z.string().optional(),
  expertScore: z.number(),
  benchmarkScore: z.number(),
  kpiLinkedCount: z.number(),
  kpiConnectionStatus: z.enum(["none", "partial", "full"]),
  aiRecommendRank: z.number().optional(),
  impactScore: z.number(),
  stakeholderScore: z.number(),
  reportLinkedCount: z.number(),
  updatedAt: z.string(),
});

export const MaterialityAiRecommendationSchema = z.object({
  id: z.string(),
  issueId: z.string(),
  issueName: z.string(),
  reason: z.string(),
  suggestedPriority: z.number(),
  confidence: z.number(),
  createdAt: z.string(),
});

export const MaterialityMatrixPointSchema = z.object({
  issueId: z.string(),
  issueName: z.string(),
  dimension: MaterialityEsgDimensionSchema,
  x: z.number(),
  y: z.number(),
});

export const MaterialityIssueRankingSchema = z.object({
  rank: z.number(),
  issueId: z.string(),
  issueName: z.string(),
  dimension: MaterialityEsgDimensionSchema,
  compositeScore: z.number(),
  expertScore: z.number(),
  benchmarkScore: z.number(),
  kpiLinkedCount: z.number(),
});

export const MaterialityReportLinkSchema = z.object({
  id: z.string(),
  issueId: z.string(),
  reportId: z.string(),
  reportTitle: z.string(),
  reportType: z.string(),
  sectionRef: z.string().optional(),
  linkedAt: z.string(),
});

export const MaterialityVersionHistorySchema = z.object({
  id: z.string(),
  version: z.string(),
  description: z.string(),
  issueCount: z.number(),
  createdAt: z.string(),
  createdBy: z.string(),
});

export const MaterialitySettingsSchema = z.object({
  assessmentPeriod: z.string(),
  expertWeight: z.number(),
  benchmarkWeight: z.number(),
  kpiImpactWeight: z.number(),
  matrixThresholdHigh: z.number(),
  matrixThresholdMedium: z.number(),
});
