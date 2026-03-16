import { z } from "zod";
import { ScopeSchema } from "./common";

export const DashboardKpiItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.union([z.string(), z.number()]),
  subLabel: z.string().optional(),
  status: z.enum(["on_track", "attention", "anomaly"]).optional(),
  trendDirection: z.enum(["up", "down"]).optional(),
  trendText: z.string(),
});

export const TopVendorEmissionSchema = z.object({
  id: z.string(),
  vendorName: z.string(),
  scope: ScopeSchema,
  emissionsKg: z.number(),
  trendDirection: z.enum(["up", "down"]),
  trendPercent: z.number().optional(),
  status: z.enum(["linked", "pending", "not_linked"]),
});

export const OffsetSummarySchema = z.object({
  totalEmissionsT: z.number(),
  offsetT: z.number(),
});

export const DashboardNotificationSchema = z.object({
  id: z.string(),
  type: z.enum(["report", "data", "system"]),
  title: z.string(),
  body: z.string(),
  actionLabel: z.string().optional(),
  actionHref: z.string().optional(),
  timestamp: z.string().optional(),
  dismissible: z.boolean(),
});

export const DashboardInsightItemSchema = z.object({
  id: z.string(),
  type: z.enum(["anomaly", "recommendation", "report"]),
  title: z.string(),
  detail: z.string(),
  actionLabel: z.string(),
  actionHref: z.string().optional(),
});

export const ScopeDonutItemSchema = z.object({
  name: z.string(),
  value: z.number(),
  tCO2e: z.number(),
  fill: z.string(),
});
