import type { OrganizationSettings, WorksiteItem } from "@/types";
import { mockOrganizationSettings } from "@/lib/mock/organization";
import { saveWorksiteLocation } from "./commute-distance";
import { delay, apiCall } from "@/lib/api";

let orgStore: OrganizationSettings = JSON.parse(
  JSON.stringify(mockOrganizationSettings)
);

export async function getOrganizationSettings(): Promise<OrganizationSettings> {
  return apiCall(async () => {
    await delay(150);
    return JSON.parse(JSON.stringify(orgStore));
  });
}

export async function saveOrganizationSettings(
  settings: OrganizationSettings
): Promise<OrganizationSettings> {
  return apiCall(async () => {
    await delay(220);
    orgStore = JSON.parse(JSON.stringify(settings));

    // 기본 출근지는 출퇴근 거리 산출에서도 사용되므로 같이 갱신
    const defaultWs = orgStore.defaultWorksiteId
      ? orgStore.worksites.find((w) => w.id === orgStore.defaultWorksiteId)
      : undefined;
    if (defaultWs) {
      await saveWorksiteLocation({
        name: defaultWs.name,
        address: defaultWs.address,
        addressDetail: defaultWs.addressDetail,
      });
    }

    return JSON.parse(JSON.stringify(orgStore));
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
