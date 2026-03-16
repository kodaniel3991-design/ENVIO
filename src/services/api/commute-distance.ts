import type { DistanceApiSettings, WorksiteLocation } from "@/types";
import {
  mockDistanceApiSettings,
  mockWorksiteLocation,
} from "@/lib/mock/commute-distance";
import { delay, apiCall } from "@/lib/api";

let worksiteStore: WorksiteLocation = { ...mockWorksiteLocation };
let apiSettingsStore: DistanceApiSettings = { ...mockDistanceApiSettings };

export async function getWorksiteLocation(): Promise<WorksiteLocation> {
  return apiCall(async () => {
    await delay(120);
    return { ...worksiteStore };
  });
}

export async function saveWorksiteLocation(
  location: WorksiteLocation
): Promise<WorksiteLocation> {
  return apiCall(async () => {
    await delay(180);
    worksiteStore = { ...location };
    return { ...worksiteStore };
  });
}

export async function getDistanceApiSettings(): Promise<DistanceApiSettings> {
  return apiCall(async () => {
    await delay(120);
    return { ...apiSettingsStore };
  });
}

export async function saveDistanceApiSettings(
  settings: DistanceApiSettings
): Promise<DistanceApiSettings> {
  return apiCall(async () => {
    await delay(180);
    apiSettingsStore = { ...settings };
    return { ...apiSettingsStore };
  });
}

function stableHash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function toFullAddress(address: string, detail?: string): string {
  const a = address.trim();
  const d = detail?.trim();
  return d ? `${a} ${d}` : a;
}

/**
 * 주소 ↔ 주소 거리(km) 산출
 * 현재는 외부 호출 없이 demo용 pseudo 값을 반환합니다.
 * 설정에서 API 키/Provider를 등록하면, 추후 서버에서 실제 Directions API로 교체 가능합니다.
 */
export async function calculateDistanceKm(args: {
  originAddress: string;
  originDetail?: string;
  destinationAddress: string;
  destinationDetail?: string;
}): Promise<number> {
  return apiCall(async () => {
    await delay(140);
    const origin = toFullAddress(args.originAddress, args.originDetail);
    const dest = toFullAddress(args.destinationAddress, args.destinationDetail);
    if (!origin || !dest) return 0;

    // Deterministic pseudo distance: 0.5km ~ 60km
    const h = stableHash(`${origin}__${dest}`);
    const km = 0.5 + (h % 5950) / 100;
    return Math.round(km * 100) / 100;
  });
}
