import { z } from "zod";
import { ScopeSchema } from "./common";

export const EmissionSummarySchema = z.object({
  totalMtCO2e: z.number(),
  scope1: z.number(),
  scope2: z.number(),
  scope3: z.number(),
  period: z.string(),
  yoyChangePercent: z.number(),
});

export const EmissionTrendSchema = z.object({
  period: z.string(),
  scope1: z.number(),
  scope2: z.number(),
  scope3: z.number(),
  total: z.number(),
});

export const CategoryEmissionSchema = z.object({
  category: z.string(),
  value: z.number(),
  unit: z.string(),
});

export const ScopeBreakdownSchema = z.object({
  scope: ScopeSchema,
  label: z.string(),
  value: z.number(),
  percent: z.number(),
  categoryBreakdown: z.array(CategoryEmissionSchema).optional(),
});

export const EmissionSourceItemSchema = z.object({
  id: z.string(),
  sourceName: z.string(),
  scope: ScopeSchema,
  category: z.string(),
  value: z.number(),
  unit: z.string(),
  period: z.string(),
  status: z.enum(["verified", "estimated", "pending"]).optional(),
});

// 재귀 타입은 z.lazy()로 처리
export const CarbonFlowNodeSchema: z.ZodType = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(["organization", "facility", "category", "activity"]),
    value: z.number(),
    unit: z.string(),
    children: z.array(CarbonFlowNodeSchema).optional(),
  })
);

export const SupplyChainNodeSchema: z.ZodType = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    tier: z.number(),
    category: z.string(),
    emissionsMtCO2e: z.number(),
    riskLevel: z.enum(["low", "medium", "high"]),
    status: z.enum(["verified", "estimated", "pending"]),
    children: z.array(SupplyChainNodeSchema).optional(),
  })
);
