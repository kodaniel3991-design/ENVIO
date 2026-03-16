import { z } from "zod";
import { RiskLevelSchema } from "./common";

const PortalVendorStatusSchema = z.enum([
  "active",
  "invited",
  "pending",
  "suspended",
]);

const SubmissionStatusTypeSchema = z.enum([
  "not_started",
  "in_progress",
  "submitted",
  "verified",
  "rejected",
]);

const VerificationStepStatusSchema = z.enum([
  "pending",
  "in_review",
  "approved",
  "rejected",
]);

export const PortalVendorSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  status: PortalVendorStatusSchema,
  tier: z.number(),
  category: z.string(),
  invitedAt: z.string().optional(),
  linkedAt: z.string().optional(),
  submissionStatus: SubmissionStatusTypeSchema,
  esgScore: z.number().optional(),
  riskLevel: RiskLevelSchema,
});

export const PortalInvitationSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  vendorName: z.string(),
  email: z.string(),
  sentAt: z.string(),
  expiresAt: z.string(),
  status: z.enum(["pending", "accepted", "expired"]),
});

export const SubmissionByVendorSchema = z.object({
  vendorId: z.string(),
  vendorName: z.string(),
  period: z.string(),
  status: SubmissionStatusTypeSchema,
  submittedAt: z.string().optional(),
  scope3CategoriesCompleted: z.number(),
  scope3CategoriesTotal: z.number(),
  emissionsTco2e: z.number().optional(),
});

export const Scope3CategoryPortalSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  totalEmissionsTco2e: z.number(),
  completionPercent: z.number(),
  vendorCount: z.number(),
  verifiedCount: z.number(),
});

export const VendorEsgScoreSchema = z.object({
  vendorId: z.string(),
  vendorName: z.string(),
  overallScore: z.number(),
  environmentScore: z.number(),
  socialScore: z.number(),
  governanceScore: z.number(),
  riskLevel: RiskLevelSchema,
  trend: z.enum(["up", "down", "stable"]),
  lastUpdated: z.string(),
});

export const VerificationItemSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  vendorName: z.string(),
  period: z.string(),
  step: z.enum(["data_review", "evidence_check", "approval"]),
  stepStatus: VerificationStepStatusSchema,
  requestedAt: z.string(),
  completedAt: z.string().optional(),
  assignedTo: z.string().optional(),
});

export const EvidenceFileSchema = z.object({
  id: z.string(),
  verificationId: z.string(),
  fileName: z.string(),
  fileType: z.string(),
  uploadedAt: z.string(),
  uploadedBy: z.string(),
  status: z.enum(["pending", "approved", "rejected"]),
});

export const PortalSettingsSchema = z.object({
  invitationExpiryDays: z.number(),
  reminderDaysBeforeExpiry: z.number(),
  defaultTier: z.number(),
  requireEvidence: z.boolean(),
  allowedFileTypes: z.array(z.string()),
});
