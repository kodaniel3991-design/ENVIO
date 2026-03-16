import type { RoleItem, UserItem, UserStatus } from "@/types";
import { mockRoles, mockUsers } from "@/lib/mock/users";
import { delay, apiCall } from "@/lib/api";

let rolesStore: RoleItem[] = JSON.parse(JSON.stringify(mockRoles));
let usersStore: UserItem[] = JSON.parse(JSON.stringify(mockUsers));

function nowYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function getRoles(): Promise<RoleItem[]> {
  return apiCall(async () => {
    await delay(120);
    return JSON.parse(JSON.stringify(rolesStore));
  });
}

export async function saveRoles(items: RoleItem[]): Promise<RoleItem[]> {
  return apiCall(async () => {
    await delay(180);
    rolesStore = JSON.parse(JSON.stringify(items));
    return JSON.parse(JSON.stringify(rolesStore));
  });
}

export async function getUsers(): Promise<UserItem[]> {
  return apiCall(async () => {
    await delay(150);
    return JSON.parse(JSON.stringify(usersStore));
  });
}

export async function upsertUser(user: UserItem): Promise<UserItem> {
  return apiCall(async () => {
    await delay(180);
    const existingIdx = usersStore.findIndex((u) => u.id === user.id);
    if (existingIdx >= 0) {
      usersStore[existingIdx] = { ...usersStore[existingIdx], ...user };
      return JSON.parse(JSON.stringify(usersStore[existingIdx]));
    }
    const created: UserItem = {
      ...user,
      createdAt: user.createdAt ?? nowYmd(),
    };
    usersStore = [created, ...usersStore];
    return JSON.parse(JSON.stringify(created));
  });
}

export async function inviteUser(args: {
  name: string;
  email: string;
  department?: string;
  jobTitle?: string;
  roleId?: string;
}): Promise<UserItem> {
  return apiCall(async () => {
    await delay(200);
    const invited: UserItem = {
      id: `u-${Date.now()}`,
      name: args.name,
      email: args.email,
      department: args.department,
      jobTitle: args.jobTitle,
      roleId: args.roleId,
      status: "invited",
      createdAt: nowYmd(),
    };
    usersStore = [invited, ...usersStore];
    return JSON.parse(JSON.stringify(invited));
  });
}

export async function setUserStatus(args: {
  userId: string;
  status: UserStatus;
}): Promise<void> {
  return apiCall(async () => {
    await delay(120);
    usersStore = usersStore.map((u) =>
      u.id === args.userId ? { ...u, status: args.status } : u
    );
  });
}

export async function deleteUser(userId: string): Promise<void> {
  return apiCall(async () => {
    await delay(120);
    usersStore = usersStore.filter((u) => u.id !== userId);
  });
}
