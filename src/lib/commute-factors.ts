import type { CommuteTransportType } from "@/types";

/**
 * 교통수단·연료별 배출계수 (tCO₂e/근무일)
 * 출퇴근 1일 기준 평균 배출량. 실제 거리·연비 반영 시 API/설정에서 조정 가능.
 */
export const COMMUTE_EMISSION_FACTORS: Record<CommuteTransportType, number> = {
  public:    0.0045, // 대중교통 (버스·지하철 등)
  car:       0.018,  // 자가용 (기본값: 휘발유 기준, 연료별 보정은 아래 함수에서)
  ev:        0.0015, // 전기·수소
  walk_bike: 0,      // 도보·자전거
};

/** 연료별 보정 계수 (tCO₂e/근무일) */
const FUEL_FACTORS: Record<string, number> = {
  "휘발유": 0.018,
  "경유":   0.015,
  "lpg":    0.012,
  "LPG":    0.012,
};

/** 직원의 교통수단·연료에 따른 배출계수 (tCO₂e/근무일). 미지정 시 defaultFactor 사용 */
export function getEmployeeCommuteFactor(
  transport: CommuteTransportType | undefined,
  fuel: string | undefined,
  defaultFactor: number
): number {
  if (!transport) return defaultFactor;
  if (transport === "car" && fuel) {
    return FUEL_FACTORS[fuel] ?? COMMUTE_EMISSION_FACTORS.car;
  }
  return COMMUTE_EMISSION_FACTORS[transport];
}

// ─── 거리 기반 배출계수 (tCO₂e/km) ───────────────────────────────────────────
// 출처: 한국 온실가스종합정보센터 이동연소 배출계수 참고
export const COMMUTE_FACTOR_PER_KM: Record<CommuteTransportType, number> = {
  public:    0.0000899, // 대중교통
  car:       0.000210,  // 자가용 기본 (휘발유)
  ev:        0.0000404, // 전기·수소차
  walk_bike: 0,         // 도보·자전거
};

/** 연료별 km당 배출계수 */
const FUEL_FACTOR_PER_KM: Record<string, number> = {
  "휘발유": 0.000210,
  "경유":   0.000174,
  "LPG":    0.000152,
  "lpg":    0.000152,
};

/** 교통수단·연료에 따른 km당 배출계수 (tCO₂e/km) */
export function getEmployeeCommuteFactorPerKm(
  transport: CommuteTransportType | undefined,
  fuel: string | undefined,
): number {
  if (!transport) return COMMUTE_FACTOR_PER_KM.car;
  if (transport === "car" && fuel) {
    return FUEL_FACTOR_PER_KM[fuel] ?? COMMUTE_FACTOR_PER_KM.car;
  }
  return COMMUTE_FACTOR_PER_KM[transport] ?? 0;
}

/**
 * 직원 1명의 일일 통근 배출량 (tCO₂e/day)
 * - distanceKm: 편도 거리 (km)
 * - 왕복(×2) 자동 적용
 */
export function calcEmployeeDailyEmission(
  distanceKm: number | undefined,
  transport: CommuteTransportType | undefined,
  fuel: string | undefined,
): number {
  if (!distanceKm) return 0;
  return distanceKm * 2 * getEmployeeCommuteFactorPerKm(transport, fuel);
}

