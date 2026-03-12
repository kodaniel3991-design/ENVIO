/**
 * 협력사 포털 페이지 목업
 * 추후 API 연동 시 제거 또는 fetch 래퍼로 교체
 */

import type {
  SupplierSummaryItem,
  SupplierInsight,
  SupplierRow,
  SupplierDetail,
  StatusDistribution,
  ResponseTrendPoint,
  Scope3CoverageItem,
} from "@/types/supplier-portal";

export const MOCK_SUPPLIER_SUMMARY: SupplierSummaryItem[] = [
  { id: "total", label: "전체 협력사", value: "128", unit: "개사" },
  { id: "responded", label: "응답 완료", value: "84", unit: "개사" },
  { id: "in_progress", label: "진행중", value: "19", unit: "개사" },
  { id: "no_response", label: "미응답", value: "25", unit: "개사" },
  { id: "scope3", label: "Scope 3 커버리지", value: "68", unit: "%", subLabel: "전체 대비" },
  { id: "high_risk", label: "High Risk Supplier", value: "7", unit: "개사" },
];

export const MOCK_SUPPLIER_INSIGHT: SupplierInsight = {
  badgeLabel: "Supplier network tracking",
  highlights: [
    "상위 배출 기여 협력사 20개 중 16개사가 응답 완료",
    "Transportation 카테고리 협력사 응답률이 가장 낮음",
    "14개 협력사가 초대 후 14일 이상 미응답 상태",
    "High Risk Supplier 7개사 중 3개사는 아직 데이터 미제출",
  ],
  recommendedActions: [
    "장기 미응답 협력사 우선 리마인드",
    "응답률 낮은 카테고리 집중 관리",
    "High Risk Supplier 우선 검토",
  ],
};

export const MOCK_SUPPLIER_ROWS: SupplierRow[] = [
  {
    id: "1",
    name: "(주)한국부품소재",
    email: "contact@koreaparts.co.kr",
    status: "connected",
    tier: "strategic",
    submissionStatus: "verified",
    riskLevel: "low",
    esgScore: 82,
    category: "Purchased Goods",
  },
  {
    id: "2",
    name: "글로벌로지스틱스",
    email: "esg@globallogistics.com",
    status: "connected",
    tier: "strategic",
    submissionStatus: "submitted",
    riskLevel: "medium",
    esgScore: 75,
    category: "Transportation",
  },
  {
    id: "3",
    name: "에너지서비스코리아",
    email: "data@energyco.kr",
    status: "invited",
    tier: "core",
    submissionStatus: "in_progress",
    riskLevel: "medium",
    esgScore: null,
    category: "Fuel & Energy",
  },
  {
    id: "4",
    name: "대한화학",
    email: "sustainability@dhchem.co.kr",
    status: "pending_response",
    tier: "core",
    submissionStatus: "not_started",
    riskLevel: "high",
    esgScore: null,
    category: "Purchased Goods",
  },
  {
    id: "5",
    name: "시티물류",
    email: "portal@citylogistics.kr",
    status: "connected",
    tier: "strategic",
    submissionStatus: "verified",
    riskLevel: "low",
    esgScore: 88,
    category: "Transportation",
  },
];

export const MOCK_STATUS_DISTRIBUTION: StatusDistribution[] = [
  { status: "Connected", count: 84, fill: "hsl(217 91% 60%)" },
  { status: "Invited", count: 19, fill: "hsl(217 91% 70%)" },
  { status: "Pending Response", count: 25, fill: "hsl(217 30% 75%)" },
  { status: "Not Invited", count: 0, fill: "hsl(var(--muted))" },
];

export const MOCK_TIER_DISTRIBUTION = [
  { tier: "Strategic", count: 45 },
  { tier: "Core", count: 58 },
  { tier: "General", count: 25 },
];

export const MOCK_RISK_DISTRIBUTION = [
  { risk: "Low", count: 85 },
  { risk: "Medium", count: 28 },
  { risk: "High", count: 12 },
  { risk: "Critical", count: 3 },
];

export const MOCK_RESPONSE_TREND: ResponseTrendPoint[] = [
  { week: "W1", invited: 12, responded: 5 },
  { week: "W2", invited: 18, responded: 14 },
  { week: "W3", invited: 15, responded: 18 },
  { week: "W4", invited: 10, responded: 22 },
  { week: "W5", invited: 8, responded: 15 },
  { week: "W6", invited: 6, responded: 10 },
];

export const MOCK_SCOPE3_COVERAGE: Scope3CoverageItem[] = [
  { id: "total", label: "전체 커버리지", value: 68, unit: "%" },
  { id: "key", label: "주요 협력사 커버리지", value: 84, unit: "%" },
  { id: "transport", label: "Transportation 카테고리", value: 42, unit: "%" },
  { id: "purchased", label: "Purchased Goods 카테고리", value: 77, unit: "%" },
];

export function getSupplierDetailById(id: string): SupplierDetail | null {
  const row = MOCK_SUPPLIER_ROWS.find((r) => r.id === id);
  if (!row) return null;
  return {
    ...row,
    contactName: "김담당",
    linkedSite: "본사 구매팀",
    invitedAt: "2025-12-01",
    lastResponseAt: row.submissionStatus !== "not_started" ? "2026-03-01" : undefined,
    remindCount: row.status === "pending_response" ? 2 : 0,
    riskReasons: row.riskLevel === "high" ? ["데이터 미제출 90일 초과", "ESG 평가 이력 없음"] : undefined,
    lastAssessedAt: row.esgScore != null ? "2026-02-15" : undefined,
    scope3Categories: ["Purchased goods & services", "Upstream transportation"],
    scope3Contribution: "약 12%",
    submissionCount: row.submissionStatus === "verified" ? 8 : 2,
    evidenceCount: row.submissionStatus === "verified" ? 5 : 0,
    communicationHistory: [
      { date: "2026-03-01", action: "초대 메일 발송" },
      { date: "2026-03-07", action: "리마인드 발송" },
      { date: "2026-03-10", action: "일부 데이터 제출" },
    ],
  };
}
