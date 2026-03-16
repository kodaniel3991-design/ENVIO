import type { EmployeeRosterItem, CommutingWorkDaysByYear } from "@/types";
import { mockEmployeeRoster } from "@/lib/mock/employee-roster";
import { delay, apiCall } from "@/lib/api";

let rosterStore: EmployeeRosterItem[] = [...mockEmployeeRoster];
const commutingStore: Record<string, CommutingWorkDaysByYear> = {};

export async function getEmployeeRoster(): Promise<EmployeeRosterItem[]> {
  return apiCall(async () => {
    await delay(150);
    return [...rosterStore];
  });
}

export async function saveEmployeeRoster(
  items: EmployeeRosterItem[]
): Promise<EmployeeRosterItem[]> {
  return apiCall(async () => {
    await delay(200);
    rosterStore = items.map((item) => ({ ...item }));
    return [...rosterStore];
  });
}

export async function getCommutingWorkDays(
  year: string
): Promise<CommutingWorkDaysByYear> {
  return apiCall(async () => {
    await delay(120);
    const existing = commutingStore[year];
    if (existing) return { ...existing, workDays: { ...existing.workDays } };
    return { year, workDays: {} };
  });
}

export async function saveCommutingWorkDays(
  data: CommutingWorkDaysByYear
): Promise<void> {
  return apiCall(async () => {
    await delay(180);
    commutingStore[data.year] = {
      year: data.year,
      workDays: JSON.parse(JSON.stringify(data.workDays)),
    };
  });
}
