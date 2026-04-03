import { apiCall } from "@/lib/api";

async function fetchUsers(type: string) {
  const res = await fetch(`/api/users?type=${type}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getUsers() {
  return apiCall(() => fetchUsers("users"));
}

export async function getRoles() {
  return apiCall(() => fetchUsers("roles"));
}

export async function saveUser(item: any): Promise<void> {
  return apiCall(async () => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save-user", item }),
    });
    if (!res.ok) throw new Error(await res.text());
  });
}

export async function saveRole(item: any): Promise<void> {
  return apiCall(async () => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save-role", item }),
    });
    if (!res.ok) throw new Error(await res.text());
  });
}

export async function saveRoles(items: any[]): Promise<void> {
  for (const item of items) {
    await saveRole(item);
  }
}

export async function upsertUser(item: any): Promise<void> {
  return saveUser(item);
}

export async function inviteUser(item: any): Promise<void> {
  return saveUser({ ...item, status: "invited" });
}

export async function setUserStatus(params: { userId: string; status: string }): Promise<void> {
  return apiCall(async () => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save-user", item: { id: params.userId, status: params.status } }),
    });
    if (!res.ok) throw new Error(await res.text());
  });
}

export async function resetPassword(userId: string): Promise<{ tempPassword: string }> {
  return apiCall(async () => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset-password", userId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  });
}

export async function deleteUser(id: string): Promise<void> {
  return apiCall(async () => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete-user", id }),
    });
    if (!res.ok) throw new Error(await res.text());
  });
}
