import { z } from "zod";

export const ScopeSchema = z.enum(["scope1", "scope2", "scope3"]);

export const DataStatusSchema = z.enum([
  "verified",
  "estimated",
  "pending",
  "missing",
  "ai_anomaly",
]);

export const KpiCategorySchema = z.enum([
  "environment",
  "social",
  "governance",
  "carbon",
]);

export const RiskLevelSchema = z.enum(["low", "medium", "high", "critical"]);

export const ChartDataPointSchema = z
  .object({
    name: z.string(),
    value: z.number().optional(),
  })
  .catchall(z.union([z.string(), z.number(), z.undefined()]));
