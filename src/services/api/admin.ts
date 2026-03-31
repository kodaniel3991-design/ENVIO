import { apiCall } from "@/lib/api";

// ============ Organizations ============

export interface AdminOrgItem {
  id: number;
  organizationName: string;
  status: string;
  industry?: string;
  country?: string;
  businessNumber?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  memo?: string;
  employeeCount?: string;
  revenue?: string;
  worksiteCount: number;
  userCount: number;
  createdAt: string;
}

export async function getAdminOrganizations(params?: {
  status?: string;
  search?: string;
}): Promise<AdminOrgItem[]> {
  return apiCall(async () => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set("status", params.status);
    if (params?.search) sp.set("search", params.search);
    const res = await fetch(`/api/admin/organizations?${sp.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  });
}

export async function createOrganization(data: {
  organizationName: string;
  industry?: string;
  country?: string;
  businessNumber?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  memo?: string;
}): Promise<{ ok: boolean; id: number }> {
  return apiCall(async () => {
    const res = await fetch("/api/admin/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-org", data }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  });
}

export async function updateOrgStatus(id: number, status: string): Promise<void> {
  return apiCall(async () => {
    const res = await fetch("/api/admin/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-status", id, status }),
    });
    if (!res.ok) throw new Error(await res.text());
  });
}

export async function updateOrganizationAdmin(
  id: number,
  data: Partial<AdminOrgItem>
): Promise<void> {
  return apiCall(async () => {
    const res = await fetch("/api/admin/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-org", id, data }),
    });
    if (!res.ok) throw new Error(await res.text());
  });
}

// ============ Users ============

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  department?: string;
  jobTitle?: string;
  roleId?: string;
  roleName?: string;
  status: string;
  approvalStatus: string;
  isPlatformAdmin: boolean;
  organizationId?: number;
  organizationName?: string;
  lastLoginAt?: string;
  createdAt: string;
}

export async function getAdminUsers(params?: {
  approvalStatus?: string;
  search?: string;
}): Promise<AdminUserItem[]> {
  return apiCall(async () => {
    const sp = new URLSearchParams();
    if (params?.approvalStatus) sp.set("approvalStatus", params.approvalStatus);
    if (params?.search) sp.set("search", params.search);
    const res = await fetch(`/api/admin/users?${sp.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  });
}

export async function approveUser(userId: string): Promise<void> {
  return apiCall(async () => {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", userId }),
    });
    if (!res.ok) throw new Error(await res.text());
  });
}

export async function rejectUser(userId: string, reason?: string): Promise<void> {
  return apiCall(async () => {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", userId, reason }),
    });
    if (!res.ok) throw new Error(await res.text());
  });
}

export async function resetUserPassword(userId: string): Promise<{ tempPassword: string }> {
  return apiCall(async () => {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset-password", userId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  });
}

export async function updateAdminUserStatus(userId: string, status: string): Promise<void> {
  return apiCall(async () => {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "change-status", userId, status }),
    });
    if (!res.ok) throw new Error(await res.text());
  });
}

// ============ Common Codes ============

export interface CommonCodeItem {
  id: number;
  codeGroup: string;
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
  active: boolean;
}

export async function getCommonCodes(group?: string): Promise<CommonCodeItem[]> {
  return apiCall(async () => {
    const sp = new URLSearchParams();
    if (group) sp.set("group", group);
    const res = await fetch(`/api/admin/common-codes?${sp.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  });
}

export async function upsertCommonCode(data: Partial<CommonCodeItem>): Promise<void> {
  return apiCall(async () => {
    const res = await fetch("/api/admin/common-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "upsert", data }),
    });
    if (!res.ok) throw new Error(await res.text());
  });
}

export async function deleteCommonCode(id: number): Promise<void> {
  return apiCall(async () => {
    const res = await fetch("/api/admin/common-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    if (!res.ok) throw new Error(await res.text());
  });
}

// ============ Emission Factors (admin) ============

export async function getAdminEmissionFactors(params?: {
  scope?: number;
  country?: string;
  search?: string;
}): Promise<any[]> {
  return apiCall(async () => {
    const sp = new URLSearchParams();
    if (params?.scope) sp.set("scope", String(params.scope));
    if (params?.country) sp.set("country", params.country);
    if (params?.search) sp.set("search", params.search);
    const res = await fetch(`/api/admin/emission-factors?${sp.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  });
}

export async function upsertAdminEmissionFactor(data: any): Promise<void> {
  return apiCall(async () => {
    const res = await fetch("/api/admin/emission-factors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "upsert", data }),
    });
    if (!res.ok) throw new Error(await res.text());
  });
}

export async function deleteAdminEmissionFactor(id: number): Promise<void> {
  return apiCall(async () => {
    const res = await fetch("/api/admin/emission-factors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    if (!res.ok) throw new Error(await res.text());
  });
}
