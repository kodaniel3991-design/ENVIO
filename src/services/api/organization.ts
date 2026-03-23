import type { OrganizationSettings, WorksiteItem } from "@/types";
import { saveWorksiteLocation } from "./commute-distance";
import { apiCall } from "@/lib/api";

export async function getOrganizationSettings(): Promise<OrganizationSettings> {
  return apiCall(async () => {
    const res = await fetch("/api/organization");
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  });
}

export async function saveOrganizationSettings(
  settings: OrganizationSettings
): Promise<OrganizationSettings> {
  return apiCall(async () => {
    const res = await fetch("/api/organization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error(await res.text());

    // 기본 출근지는 출퇴근 거리 산출에서도 사용되므로 같이 갱신
    const defaultWs = settings.defaultWorksiteId
      ? settings.worksites.find((w) => w.id === settings.defaultWorksiteId)
      : undefined;
    if (defaultWs) {
      await saveWorksiteLocation({
        name: defaultWs.name,
        address: defaultWs.address,
        addressDetail: defaultWs.addressDetail,
      });
    }

    return settings;
  });
}

export function createWorksiteDraft(): WorksiteItem {
  return {
    id: `ws-${Date.now()}`,
    name: "",
    address: "",
    addressDetail: "",
  };
}
