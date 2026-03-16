import { z } from "zod";
import { ScopeSchema } from "./common";

export const ReductionScenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  estimatedReductionPercent: z.number(),
  costImpact: z.enum(["low", "medium", "high"]),
  timelineMonths: z.number(),
});

export const SimulatorResultSchema = z.object({
  scenarioId: z.string(),
  baselineMtCO2e: z.number(),
  projectedMtCO2e: z.number(),
  reductionPercent: z.number(),
  costEstimate: z.number().optional(),
});

export const ReductionOpportunitySchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(["energy", "process", "fleet", "supply_chain"]),
  scope: ScopeSchema,
  description: z.string().optional(),
  estimatedReductionMt: z.number(),
  estimatedCostM: z.number(),
  roiYears: z.number().optional(),
  status: z.enum(["idea", "assessed", "approved"]),
});

export const ReductionProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  opportunityId: z.string().optional(),
  owner: z.string(),
  status: z.enum(["planning", "in_progress", "blocked", "completed"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  expectedReductionMt: z.number(),
  actualReductionMt: z.number().optional(),
});

export const ReductionProgressKpiSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.union([z.string(), z.number()]),
  unit: z.string().optional(),
  target: z.union([z.string(), z.number()]).optional(),
});

export const ReductionScopeSummarySchema = z.object({
  scope: ScopeSchema,
  baselineMt: z.number(),
  reducedMt: z.number(),
});
