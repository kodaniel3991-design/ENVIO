/**
 * 환경 데이터 페이지 목업 데이터
 * 추후 API 연동 시 제거 또는 fetch 래퍼로 교체
 */

import type {
  EnvironmentKpiItem,
  EnvironmentAiInsight,
  EnvironmentDataRow,
  DataQualityScore,
  MonthlyEmissionPoint,
  EnergyTrendPoint,
  Scope3BreakdownItem,
  EnvironmentDataDetail,
} from "@/types/environment-data";

export const MOCK_ENV_KPI: EnvironmentKpiItem[] = [
  {
    id: "ghg-total",
    label: "총 GHG 배출량",
    value: "12,450",
    subValue: "tCO2e",
    changePercent: -8.2,
    unit: "tCO2e",
  },
  {
    id: "scope1",
    label: "Scope 1",
    value: "2,100",
    unit: "tCO2e",
  },
  {
    id: "scope2",
    label: "Scope 2",
    value: "3,200",
    unit: "tCO2e",
  },
  {
    id: "scope3",
    label: "Scope 3",
    value: "7,150",
    unit: "tCO2e",
  },
  {
    id: "renewable",
    label: "재생에너지 비율",
    value: "24.5",
    subValue: "%",
    changePercent: 3.1,
    unit: "%",
  },
  {
    id: "waste-recycle",
    label: "폐기물 재활용률",
    value: "72",
    subValue: "%",
    changePercent: 2.0,
    unit: "%",
  },
];

export const MOCK_AI_INSIGHT: EnvironmentAiInsight = {
  hasAnomaly: true,
  alerts: [
    "Scope 2 배출량 이상 감지",
    "전월 대비 +28% 증가",
  ],
  possibleCauses: [
    "전력 사용량 급증",
    "신규 설비 가동",
    "데이터 누락 가능성",
  ],
  recommendedActions: [
    "계량기 데이터 검토",
    "부산공장 전력 사용 확인",
    "입력 누락 점검",
  ],
};

export const MOCK_ENV_TABLE_ROWS: EnvironmentDataRow[] = [
  {
    id: "1",
    category: "에너지",
    indicatorName: "총 에너지 사용량",
    value: 125000,
    unit: "GJ",
    period: "2024",
    source: "에너지관리시스템",
    evidenceCount: 2,
    status: "verified",
  },
  {
    id: "2",
    category: "에너지",
    indicatorName: "재생에너지 비율",
    value: 24.5,
    unit: "%",
    period: "2024",
    source: "ERP",
    evidenceCount: 1,
    status: "verified",
  },
  {
    id: "3",
    category: "온실가스",
    indicatorName: "Scope 1 배출량",
    value: 2100,
    unit: "tCO2e",
    period: "2024",
    source: "Emission Engine",
    evidenceCount: 3,
    status: "verified",
  },
  {
    id: "4",
    category: "온실가스",
    indicatorName: "Scope 2 배출량",
    value: 3200,
    unit: "tCO2e",
    period: "2024",
    source: "KEPCO API",
    evidenceCount: 1,
    status: "ai_anomaly",
  },
  {
    id: "5",
    category: "온실가스",
    indicatorName: "Scope 3 배출량",
    value: 7150,
    unit: "tCO2e",
    period: "2024",
    source: "Supplier Portal",
    evidenceCount: 0,
    status: "estimated",
  },
  {
    id: "6",
    category: "폐기물",
    indicatorName: "발생 폐기물 총량",
    value: 1850,
    unit: "ton",
    period: "2024",
    source: "Excel Upload",
    evidenceCount: 1,
    status: "verified",
  },
  {
    id: "7",
    category: "물",
    indicatorName: "총 취수량",
    value: 125000,
    unit: "m³",
    period: "2024",
    source: "Manual",
    evidenceCount: 0,
    status: "pending",
  },
];

export const MOCK_DATA_QUALITY: DataQualityScore[] = [
  { id: "completeness", label: "Completeness", value: 92, description: "데이터 완전성" },
  { id: "accuracy", label: "Accuracy", value: 88, description: "정확도" },
  { id: "consistency", label: "Consistency", value: 95, description: "일관성" },
  { id: "overall", label: "전체 Data Quality Score", value: 91, description: "종합 점수" },
];

/** 월별 Scope 1·2·3 배출량 (tCO2e) */
export const MOCK_MONTHLY_EMISSIONS: MonthlyEmissionPoint[] = [
  { month: "2024-01", scope1: 178, scope2: 268, scope3: 592 },
  { month: "2024-02", scope1: 172, scope2: 262, scope3: 598 },
  { month: "2024-03", scope1: 175, scope2: 270, scope3: 601 },
  { month: "2024-04", scope1: 168, scope2: 255, scope3: 588 },
  { month: "2024-05", scope1: 182, scope2: 278, scope3: 612 },
  { month: "2024-06", scope1: 190, scope2: 290, scope3: 628 },
  { month: "2024-07", scope1: 188, scope2: 285, scope3: 615 },
  { month: "2024-08", scope1: 185, scope2: 272, scope3: 598 },
  { month: "2024-09", scope1: 178, scope2: 268, scope3: 590 },
  { month: "2024-10", scope1: 175, scope2: 265, scope3: 585 },
  { month: "2024-11", scope1: 173, scope2: 260, scope3: 578 },
  { month: "2024-12", scope1: 176, scope2: 266, scope3: 580 },
];

/** 월별 에너지 사용량(GJ) 및 재생에너지 비율(%) */
export const MOCK_ENERGY_TREND: EnergyTrendPoint[] = [
  { month: "2024-01", totalEnergy: 10200, renewablePercent: 22 },
  { month: "2024-02", totalEnergy: 9980, renewablePercent: 23 },
  { month: "2024-03", totalEnergy: 10500, renewablePercent: 23.5 },
  { month: "2024-04", totalEnergy: 10100, renewablePercent: 24 },
  { month: "2024-05", totalEnergy: 10800, renewablePercent: 24.2 },
  { month: "2024-06", totalEnergy: 11200, renewablePercent: 25 },
  { month: "2024-07", totalEnergy: 11000, renewablePercent: 24.8 },
  { month: "2024-08", totalEnergy: 10600, renewablePercent: 24.5 },
  { month: "2024-09", totalEnergy: 10400, renewablePercent: 24.2 },
  { month: "2024-10", totalEnergy: 10300, renewablePercent: 24.5 },
  { month: "2024-11", totalEnergy: 10100, renewablePercent: 24.8 },
  { month: "2024-12", totalEnergy: 10200, renewablePercent: 25 },
];

export const MOCK_SCOPE3_BREAKDOWN: Scope3BreakdownItem[] = [
  { id: "cat1", name: "Purchased goods & services", value: 4200, code: "U1" },
  { id: "cat2", name: "Capital goods", value: 850, code: "U2" },
  { id: "cat3", name: "Fuel & energy related activities", value: 430, code: "U3" },
  { id: "cat4", name: "Upstream transportation", value: 1100, code: "U4" },
  { id: "cat5", name: "Waste generated in operations", value: 320, code: "U5" },
  { id: "cat6", name: "Business travel", value: 150, code: "U6" },
  { id: "cat7", name: "Employee commuting", value: 100, code: "U7" },
];

/** 상세 패널용: id로 행 확장 데이터 반환 */
export function getDetailById(id: string): EnvironmentDataDetail | null {
  const row = MOCK_ENV_TABLE_ROWS.find((r) => r.id === id);
  if (!row) return null;
  const evidenceFiles =
    row.evidenceCount > 0
      ? [
          { id: "f1", name: "에너지_사용량_2024.xlsx", uploadedAt: "2024-02-15" },
          ...(row.evidenceCount > 1
            ? [{ id: "f2", name: "검증보고.pdf", uploadedAt: "2024-02-20" } as const]
            : []),
        ]
      : [];
  return {
    ...row,
    aiAnalysis:
      row.status === "ai_anomaly"
        ? "Scope 2 배출량이 전월 대비 28% 증가했습니다. 전력 사용 패턴 및 계량 데이터 검토를 권장합니다."
        : undefined,
    evidenceFiles,
    changeHistory: [
      { date: "2024-03-02", action: "값 수정", by: "김데이터" },
      { date: "2024-02-15", action: "검증 완료", by: "이검증" },
      { date: "2024-01-10", action: "최초 등록", by: "시스템" },
    ],
    memo: "",
  };
}
