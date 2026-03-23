import { apiCall } from "@/lib/api";
import type { SubmissionByVendor } from "@/types";

async function fetchVendors(type: string) {
  const res = await fetch(`/api/vendors?type=${type}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getPortalVendors() {
  return apiCall(() => fetchVendors("list"));
}

export async function getSubmissions(): Promise<SubmissionByVendor[]> {
  return apiCall(() => fetchVendors("submissions"));
}

export async function getVendorEsgScores() {
  return apiCall(() => fetchVendors("esg-scores"));
}

export async function getPortalInvitations() {
  return apiCall(() => fetchVendors("invitations"));
}

export async function getScope3CategoriesPortal() {
  return apiCall(() => fetchVendors("scope3-categories"));
}

export async function getVerificationItems() {
  return apiCall(() => fetchVendors("verification-items"));
}

export async function getEvidenceFiles(verificationId?: string) {
  const type = verificationId ? `evidence-files&verificationId=${verificationId}` : "evidence-files";
  return apiCall(() => fetchVendors(type));
}

export async function getPortalSettings() {
  return apiCall(() => fetchVendors("portal-settings"));
}

export async function saveVendors(items: any[]): Promise<void> {
  return apiCall(async () => {
    const res = await fetch("/api/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save", items }),
    });
    if (!res.ok) throw new Error(await res.text());
  });
}

export async function deleteVendor(id: string): Promise<void> {
  return apiCall(async () => {
    const res = await fetch("/api/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    if (!res.ok) throw new Error(await res.text());
  });
}
