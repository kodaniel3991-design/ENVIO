import { z } from "zod";
import { KpiCategorySchema } from "./common";

const ReportFrameworkSchema = z.enum(["ESG", "K-ESG", "GRI", "ISSB", "CSRD"]);

export const ESGReportSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(["annual", "quarterly", "cdp", "tcfd"]),
  period: z.string(),
  status: z.enum(["draft", "published"]),
  publishedAt: z.string().optional(),
  framework: ReportFrameworkSchema.optional(),
  version: z.string().optional(),
});

export const ReportTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  framework: ReportFrameworkSchema,
  description: z.string().optional(),
  isDefault: z.boolean(),
  lastUsedAt: z.string().optional(),
});

export const ReportGenerationReadinessSchema = z.object({
  framework: ReportFrameworkSchema,
  readinessPercent: z.number(),
  coveragePercent: z.number(),
  missingKpiCount: z.number(),
});

export const ReportGenerationHistoryItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  framework: ReportFrameworkSchema,
  period: z.string(),
  createdAt: z.string(),
  status: z.enum(["draft", "generated"]),
});

export const DisclosureFrameworkItemSchema = z.object({
  id: z.string(),
  framework: ReportFrameworkSchema,
  code: z.string(),
  name: z.string(),
  linkedKpiCodes: z.array(z.string()),
  dataStatus: z.enum(["complete", "partial", "missing"]),
  inReports: z.boolean(),
});

export const MappingEngineItemSchema = z.object({
  id: z.string(),
  kpiCode: z.string(),
  kpiName: z.string(),
  kpiCategory: KpiCategorySchema,
  framework: ReportFrameworkSchema,
  disclosureCode: z.string(),
  status: z.enum(["linked", "partial", "unlinked"]),
});

export const ComplianceItemSchema = z.object({
  id: z.string(),
  framework: z.string(),
  requirement: z.string(),
  status: z.enum(["compliant", "partial", "non_compliant", "not_applicable"]),
  dueDate: z.string().optional(),
  lastChecked: z.string(),
});
