import { z } from "zod";
import { KpiCategorySchema } from "./common";

const KpiStatusSchema = z.enum(["on_track", "attention", "anomaly"]);

export const KpiManagementItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: KpiCategorySchema,
  unit: z.string(),
  target: z.union([z.number(), z.string()]),
  actual: z.union([z.number(), z.string()]).optional(),
  achievementPercent: z.number().optional(),
  period: z.string(),
  status: KpiStatusSchema.optional(),
  isMissing: z.boolean().optional(),
  reportIncluded: z.boolean().optional(),
});

export const KpiSummaryCardSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]),
});

export const KpiMasterItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  category: KpiCategorySchema,
  unit: z.string(),
  description: z.string().optional(),
  reportIncluded: z.boolean(),
  createdAt: z.string(),
});

export const KpiTargetItemSchema = z.object({
  id: z.string(),
  kpiId: z.string(),
  kpiName: z.string(),
  period: z.string(),
  targetValue: z.union([z.number(), z.string()]),
  updatedAt: z.string(),
  updatedBy: z.string().optional(),
});

export const KpiPerformanceItemSchema = z.object({
  id: z.string(),
  kpiId: z.string(),
  kpiName: z.string(),
  period: z.string(),
  actualValue: z.union([z.number(), z.string()]),
  updatedAt: z.string(),
  updatedBy: z.string().optional(),
});

export const KpiCoverageItemSchema = z.object({
  category: KpiCategorySchema,
  totalCount: z.number(),
  withDataCount: z.number(),
  coveragePercent: z.number(),
  missingKpiNames: z.array(z.string()).optional(),
});

export const KpiCategoryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  esgArea: KpiCategorySchema,
  description: z.string().optional(),
  sortOrder: z.number(),
});

export const KpiChangeLogItemSchema = z.object({
  id: z.string(),
  kpiId: z.string(),
  kpiName: z.string(),
  field: z.string(),
  oldValue: z.union([z.string(), z.number()]),
  newValue: z.union([z.string(), z.number()]),
  changedAt: z.string(),
  changedBy: z.string(),
});

export const KpiSettingsSchema = z.object({
  defaultPeriod: z.string(),
  reportInclusionDefault: z.boolean(),
  targetUpdateAllowed: z.boolean(),
  decimalPlaces: z.number(),
});
