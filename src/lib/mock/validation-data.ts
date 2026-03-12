/**
 * 데이터 검증 페이지 목업
 * 추후 API 연동 시 제거 또는 fetch 래퍼로 교체
 */

import type {
  ValidationSummaryItem,
  ValidationAiInsight,
  ValidationDataRow,
  ValidationQualityScore,
  ValidationWorkflowStep,
  ValidationDataDetail,
  MonthlyDataPoint,
} from "@/types/validation-data";

export const MOCK_VALIDATION_SUMMARY: ValidationSummaryItem[] = [
  { id: "pending", label: "검토 대기", value: "18", unit: "건" },
  { id: "in_review", label: "검토 중", value: "9", unit: "건" },
  { id: "anomaly", label: "이상치 감지", value: "5", unit: "건" },
  { id: "missing", label: "누락 데이터", value: "7", unit: "건" },
  { id: "no_evidence", label: "증빙 미첨부", value: "9", unit: "건" },
  { id: "completion", label: "검증 완료율", value: "78", unit: "%", subLabel: "전체 대비" },
];

export const MOCK_VALIDATION_AI_INSIGHT: ValidationAiInsight = {
  hasAnomaly: true,
  alerts: [
    "Scope 1 보일러 데이터: 6월 사용량이 최근 3개월 평균 대비 210% 증가",
    "Scope 2 전기사용량: 9월 데이터 누락 가능성",
    "Scope 3 구매품 데이터: 증빙 미첨부",
  ],
  possibleCauses: [
    "입력 오류",
    "계량기 집계 누락",
    "구매량 일시 급증",
    "사업장별 데이터 편차",
  ],
  suggestedActions: [
    "월별 데이터 재확인",
    "증빙 파일 업로드 요청",
    "사업장 담당자 확인",
  ],
};

export const MOCK_VALIDATION_TABLE_ROWS: ValidationDataRow[] = [
  {
    id: "1",
    status: "submitted",
    scope: "Scope 1",
    category: "고정연소",
    emissionSource: "보일러",
    site: "부산공장",
    period: "2024",
    activityAmount: "12,500 Nm3",
    emissions: "18.7 tCO2e",
    evidenceCount: 2,
    aiVerification: "normal",
    submittedBy: "김OO",
    submittedAt: "2026-03-10",
    dataSource: "Manual",
  },
  {
    id: "2",
    status: "under_review",
    scope: "Scope 2",
    category: "전력",
    emissionSource: "전기사용량",
    site: "울산공장",
    period: "2024",
    activityAmount: "185,000 kWh",
    emissions: "82.4 tCO2e",
    evidenceCount: 1,
    aiVerification: "anomaly",
    submittedBy: "이OO",
    submittedAt: "2026-03-11",
    dataSource: "ERP",
  },
  {
    id: "3",
    status: "needs_evidence",
    scope: "Scope 3",
    category: "Purchased goods & services",
    emissionSource: "구매품 데이터",
    site: "본사",
    period: "2024",
    activityAmount: "245,000,000 KRW",
    emissions: "145.2 tCO2e",
    evidenceCount: 0,
    aiVerification: "normal",
    submittedBy: "박OO",
    submittedAt: "2026-03-12",
    dataSource: "Excel",
  },
  {
    id: "4",
    status: "missing",
    scope: "Scope 2",
    category: "전력",
    emissionSource: "전기사용량",
    site: "부산공장",
    period: "2024-09",
    activityAmount: "-",
    emissions: "-",
    evidenceCount: 0,
    aiVerification: "missing_risk",
    submittedBy: "최OO",
    submittedAt: "2026-03-12",
    dataSource: "Manual",
  },
  {
    id: "5",
    status: "verified",
    scope: "Scope 1",
    category: "이동연소",
    emissionSource: "영업차량",
    site: "본사",
    period: "2024",
    activityAmount: "3,200 L",
    emissions: "8.6 tCO2e",
    evidenceCount: 1,
    aiVerification: "normal",
    submittedBy: "정OO",
    submittedAt: "2026-03-09",
    dataSource: "Manual",
  },
];

export const MOCK_VALIDATION_QUALITY: ValidationQualityScore[] = [
  { id: "completeness", label: "Completeness", value: 91, description: "데이터 완전성" },
  { id: "accuracy", label: "Accuracy", value: 87, description: "정확도" },
  { id: "consistency", label: "Consistency", value: 93, description: "일관성" },
  { id: "overall", label: "Validation Score", value: 89, description: "종합 검증 점수" },
];

export const MOCK_VALIDATION_WORKFLOW: ValidationWorkflowStep[] = [
  { id: "submitted", label: "Submitted", count: 18, description: "검토 대기" },
  { id: "under_review", label: "Under Review", count: 9, description: "검토 중" },
  { id: "verified", label: "Verified", count: 124, description: "검증 완료" },
];

function buildMonthlyData(row: ValidationDataRow): MonthlyDataPoint[] {
  const base = row.scope === "Scope 1" ? 1500 : row.scope === "Scope 2" ? 15000 : 20000000;
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const mult = month === 6 && row.id === "1" ? 3.1 : month === 9 && row.id === "4" ? 0 : 0.9 + Math.random() * 0.2;
    return {
      month,
      activityAmount: month === 9 && row.id === "4" ? "-" : Math.round(base * mult * (month / 12)),
      emissions: month === 9 && row.id === "4" ? "-" : (base * mult * 0.002 * (month / 12)).toFixed(1),
      isAnomaly: month === 6 && row.id === "1",
    };
  });
}

export function getValidationDetailById(id: string): ValidationDataDetail | null {
  const row = MOCK_VALIDATION_TABLE_ROWS.find((r) => r.id === id);
  if (!row) return null;
  const evidenceFiles =
    row.evidenceCount > 0
      ? [
          { id: "f1", name: "invoice_2024_06.pdf", uploadedAt: "2024-07-01" },
          ...(row.evidenceCount > 1
            ? [{ id: "f2", name: "meter_report_q2.xlsx", uploadedAt: "2024-07-15" } as const]
            : []),
        ]
      : row.category.includes("Purchased")
        ? []
        : [];
  if (row.category.includes("Purchased")) {
    evidenceFiles.push({ id: "f0", name: "supplier_data.csv", uploadedAt: "2024-03-01" });
  }
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
    aiResultText:
      row.id === "1"
        ? "6월 활동량이 최근 평균 대비 210% 증가. 전년 동기 대비 +48%."
        : row.id === "4"
          ? "9월 데이터 누락 가능성. 계량기 또는 입력 확인 필요."
          : row.id === "2"
            ? "전기 사용량이 동기 대비 15% 증가. 사업장 확인 권장."
            : undefined,
    changeHistory: [
      { date: "2026-03-10 09:20", action: "데이터 입력", by: "김OO" },
      { date: "2026-03-11 14:05", action: "데이터 수정", by: "이OO" },
      { date: "2026-03-12 17:40", action: "검토 요청", by: "박OO" },
    ],
  };
}
