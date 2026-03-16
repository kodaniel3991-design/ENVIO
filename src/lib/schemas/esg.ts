import { z } from "zod";

export const EsgMetricItemSchema = z.object({
  id: z.string(),
  category: z.string(),
  indicatorName: z.string(),
  value: z.union([z.string(), z.number()]),
  unit: z.string(),
  period: z.string(),
  source: z.string().optional(),
  status: z.enum(["verified", "estimated", "pending"]).optional(),
});

export const EsgSummaryCardSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]),
  unit: z.string().optional(),
  changePercent: z.number().optional(),
});
