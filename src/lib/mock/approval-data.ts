/**
 * 데이터 승인/확정 페이지 목업
 * 추후 API 연동 시 제거 또는 fetch 래퍼로 교체
 */

import type {
  ApprovalSummaryItem,
  ApprovalInsight,
  ApprovalDataRow,
  ApprovalWorkflowStep,
  ApprovalDataDetail,
  MonthlyDataPoint,
} from "@/types/approval-data";

export const MOCK_APPROVAL_SUMMARY: ApprovalSummaryItem[] = [
  { id: "pending", label: "승인 대기", value: "14", unit: "건" },
  { id: "approved", label: "승인 완료", value: "124", unit: "건" },
  { id: "rejected", label: "반려", value: "7", unit: "건" },
  { id: "confirmed", label: "확정 완료", value: "96", unit: "건" },
  { id: "reopened", label: "재검토 요청", value: "5", unit: "건" },
  { id: "rate", label: "이번 달 승인율", value: "89", unit: "%", subLabel: "전체 대비" },
];

export const MOCK_APPROVAL_INSIGHT: ApprovalInsight = {
  badgeLabel: "Ready for approval",
  highlights: [
    "승인 대기 데이터 14건 중 5건은 Scope 3 데이터",
    "부산공장 Scope 1 데이터는 모두 검증 완료되어 승인 가능",
    "2건은 증빙 보완 후 승인 권장",
    "1건은 전년 대비 편차가 커서 재검토 필요",
  ],
  recommendedActions: [
    "승인 가능 항목 우선 처리",
    "증빙 미흡 건은 반려 또는 보완 요청",
    "이상 편차 데이터는 재검토 요청",
  ],
};

export const MOCK_APPROVAL_TABLE_ROWS: ApprovalDataRow[] = [
  {
    id: "1",
    status: "pending_approval",
    scope: "Scope 1",
    category: "고정연소",
    emissionSource: "보일러",
    site: "부산공장",
    period: "2024",
    activityAmount: "12,500 Nm3",
    emissions: "18.7 tCO2e",
    evidenceCount: 2,
    verificationStatus: "verified",
    submittedBy: "김OO",
    approver: "박OO",
    submittedAt: "2026-03-10",
  },
  {
    id: "2",
    status: "pending_approval",
    scope: "Scope 2",
    category: "전력",
    emissionSource: "전기사용량",
    site: "울산공장",
    period: "2024",
    activityAmount: "185,000 kWh",
    emissions: "82.4 tCO2e",
    evidenceCount: 1,
    verificationStatus: "verified",
    submittedBy: "이OO",
    approver: "박OO",
    submittedAt: "2026-03-11",
  },
  {
    id: "3",
    status: "rejected",
    scope: "Scope 3",
    category: "Purchased goods & services",
    emissionSource: "구매품 데이터",
    site: "본사",
    period: "2024",
    activityAmount: "245,000,000 KRW",
    emissions: "145.2 tCO2e",
    evidenceCount: 0,
    verificationStatus: "verified",
    submittedBy: "박OO",
    approver: "정OO",
    submittedAt: "2026-03-12",
  },
  {
    id: "4",
    status: "approved",
    scope: "Scope 1",
    category: "이동연소",
    emissionSource: "영업차량",
    site: "본사",
    period: "2024",
    activityAmount: "3,200 L",
    emissions: "8.6 tCO2e",
    evidenceCount: 1,
    verificationStatus: "verified",
    submittedBy: "최OO",
    approver: "박OO",
    submittedAt: "2026-03-09",
  },
  {
    id: "5",
    status: "confirmed",
    scope: "Scope 2",
    category: "전력",
    emissionSource: "전기사용량",
    site: "부산공장",
    period: "2024",
    activityAmount: "220,000 kWh",
    emissions: "97.2 tCO2e",
    evidenceCount: 2,
    verificationStatus: "verified",
    submittedBy: "정OO",
    approver: "박OO",
    submittedAt: "2026-03-08",
  },
];

export const MOCK_APPROVAL_WORKFLOW: ApprovalWorkflowStep[] = [
  { id: "verified", label: "Verified", count: 24, description: "검증 완료" },
  { id: "pending", label: "Pending Approval", count: 14, description: "승인 대기" },
  { id: "approved", label: "Approved", count: 124, description: "승인 완료" },
  { id: "confirmed", label: "Confirmed", count: 96, description: "최종 확정" },
];

function buildMonthlyData(row: ApprovalDataRow): MonthlyDataPoint[] {
  const base = row.scope === "Scope 1" ? 1500 : row.scope === "Scope 2" ? 15000 : 20000000;
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const mult = 0.9 + Math.random() * 0.2;
    return {
      month,
      activityAmount: Math.round(base * mult * (month / 12)),
      emissions: (base * mult * 0.002 * (month / 12)).toFixed(1),
    };
  });
}

export function getApprovalDetailById(id: string): ApprovalDataDetail | null {
  const row = MOCK_APPROVAL_TABLE_ROWS.find((r) => r.id === id);
  if (!row) return null;
  const evidenceFiles =
    row.evidenceCount > 0
      ? [
          { id: "f1", name: "invoice_2024_06.pdf", uploadedAt: "2024-07-01" },
          ...(row.evidenceCount > 1
            ? [{ id: "f2", name: "meter_report_q2.xlsx", uploadedAt: "2024-07-15" } as const]
            : []),
        ]
      : [];
  const isLocked = row.status === "confirmed";
  return {
    ...row,
    year: 2024,
    month: row.period.includes("-") ? parseInt(row.period.split("-")[1], 10) : undefined,
    monthlyData: buildMonthlyData(row),
    emissionFactor: {
      value: row.scope === "Scope 1" ? 2.0 : row.scope === "Scope 2" ? 0.00045 : 0.00059,
      unit: row.scope === "Scope 1" ? "tCO2e/Nm3" : row.scope === "Scope 2" ? "tCO2e/kWh" : "tCO2e/KRW",
      source: "국가 배출계수",
      baseYear: "2023",
    },
    evidenceFiles,
    verificationSummary: {
      verified: true,
      anomalyResolved: row.id !== "3",
      missingResolved: true,
    },
    changeHistory: [
      { date: "2026-03-10 09:20", action: "데이터 입력", by: "김OO" },
      { date: "2026-03-11 14:05", action: "데이터 수정", by: "이OO" },
      { date: "2026-03-12 17:40", action: "검증 완료", by: "박OO" },
      { date: "2026-03-13 09:10", action: row.status === "approved" || row.status === "confirmed" ? "승인 처리" : "검토 중", by: "정OO" },
    ],
    approvedAt: row.status === "approved" || row.status === "confirmed" ? "2026-03-13" : undefined,
    isLocked,
  };
}
