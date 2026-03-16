import type {
  PortalVendor,
  PortalInvitation,
  SubmissionByVendor,
  Scope3CategoryPortal,
  VendorEsgScore,
  VerificationItem,
  EvidenceFile,
  PortalSettings,
} from "@/types";
import {
  mockPortalVendors,
  mockPortalInvitations,
  mockSubmissions,
  mockScope3CategoriesPortal,
  mockVendorEsgScores,
  mockVerificationItems,
  mockEvidenceFiles,
  mockPortalSettings,
} from "@/lib/mock";
import { delay, apiCall } from "@/lib/api";
import {
  PortalVendorSchema,
  PortalInvitationSchema,
  SubmissionByVendorSchema,
  Scope3CategoryPortalSchema,
  VendorEsgScoreSchema,
  VerificationItemSchema,
  EvidenceFileSchema,
  PortalSettingsSchema,
} from "@/lib/schemas";

export async function getPortalVendors(): Promise<PortalVendor[]> {
  return apiCall(async () => {
    await delay(200);
    return PortalVendorSchema.array().parse(mockPortalVendors);
  });
}

export async function getPortalInvitations(): Promise<PortalInvitation[]> {
  return apiCall(async () => {
    await delay(150);
    return PortalInvitationSchema.array().parse(mockPortalInvitations);
  });
}

export async function getSubmissions(): Promise<SubmissionByVendor[]> {
  return apiCall(async () => {
    await delay(200);
    return SubmissionByVendorSchema.array().parse(mockSubmissions);
  });
}

export async function getScope3CategoriesPortal(): Promise<Scope3CategoryPortal[]> {
  return apiCall(async () => {
    await delay(180);
    return Scope3CategoryPortalSchema.array().parse(mockScope3CategoriesPortal);
  });
}

export async function getVendorEsgScores(): Promise<VendorEsgScore[]> {
  return apiCall(async () => {
    await delay(200);
    return VendorEsgScoreSchema.array().parse(mockVendorEsgScores);
  });
}

export async function getVerificationItems(): Promise<VerificationItem[]> {
  return apiCall(async () => {
    await delay(200);
    return VerificationItemSchema.array().parse(mockVerificationItems);
  });
}

export async function getEvidenceFiles(
  verificationId?: string
): Promise<EvidenceFile[]> {
  return apiCall(async () => {
    await delay(150);
    const data = verificationId
      ? mockEvidenceFiles.filter((e) => e.verificationId === verificationId)
      : mockEvidenceFiles;
    return EvidenceFileSchema.array().parse(data);
  });
}

export async function getPortalSettings(): Promise<PortalSettings> {
  return apiCall(async () => {
    await delay(100);
    return PortalSettingsSchema.parse(mockPortalSettings);
  });
}
