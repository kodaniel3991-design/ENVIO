/**
 * 거버넌스 데이터 페이지 목업
 * 추후 API 연동 시 제거 또는 fetch 래퍼로 교체
 */

import type {
  GovernanceKpiItem,
  GovernanceAiInsight,
  GovernanceDataRow,
  DataQualityScore,
  GovernanceTrendPoint,
  GovernanceCategoryBreakdownItem,
  GovernanceDataDetail,
} from "@/types/governance-data";

export const MOCK_GOV_KPI: GovernanceKpiItem[] = [
  {
    id: "board-independence",
    label: "독립이사 비율",
    value: "62.5",
    unit: "%",
    changePercent: 2.5,
  },
  {
    id: "female-directors",
    label: "여성 이사 비율",
    value: "30",
    subValue: "%",
    changePercent: 5.0,
    unit: "%",
  },
  {
    id: "ethics-training",
    label: "윤리교육 이수율",
    value: "99",
    unit: "%",
    changePercent: 0.5,
  },
  {
    id: "compliance-programs",
    label: "준법 프로그램 수",
    value: "12",
    unit: "개",
    changePercent: 1,
  },
  {
    id: "audit-meetings",
    label: "감사위원회 회의",
    value: "8",
    subValue: "회/년",
    changePercent: 0,
    unit: "회",
  },
  {
    id: "risk-rating",
    label: "리스크 등급",
    value: "낮음",
    changePercent: 0,
  },
];

export const MOCK_GOV_AI_INSIGHT: GovernanceAiInsight = {
  hasAnomaly: true,
  alerts: [
    "준법 교육 미이수 건수 전월 대비 증가",
    "외부 감사 지적사항 1건 미해결",
  ],
  possibleCauses: [
    "신규 입사자 교육 일정 지연",
    "개선 조치 검토 지연",
    "관련 부서 인력 부족",
  ],
  recommendedActions: [
    "미이수자 대상 집합 교육 실시",
    "지적사항 해결 기한 설정 및 추적",
    "준법 담당 인력 보강 검토",
  ],
};

export const MOCK_GOV_TABLE_ROWS: GovernanceDataRow[] = [
  {
    id: "1",
    category: "이사회",
    indicatorName: "독립이사 비율",
    value: 62.5,
    unit: "%",
    period: "2024",
    source: "정기보고",
    evidenceCount: 2,
    status: "verified",
  },
  {
    id: "2",
    category: "이사회",
    indicatorName: "여성 이사 비율",
    value: 30,
    unit: "%",
    period: "2024",
    source: "정기보고",
    evidenceCount: 1,
    status: "verified",
  },
  {
    id: "3",
    category: "윤리",
    indicatorName: "윤리교육 이수율",
    value: 99,
    unit: "%",
    period: "2024",
    source: "법무팀",
    evidenceCount: 3,
    status: "verified",
  },
  {
    id: "4",
    category: "윤리",
    indicatorName: "준법 교육 미이수 건수",
    value: 5,
    unit: "건",
    period: "2024",
    source: "법무팀",
    evidenceCount: 1,
    status: "ai_anomaly",
  },
  {
    id: "5",
    category: "준법",
    indicatorName: "준법 프로그램 수",
    value: 12,
    unit: "개",
    period: "2024",
    source: "법무팀",
    evidenceCount: 2,
    status: "verified",
  },
  {
    id: "6",
    category: "감사",
    indicatorName: "감사위원회 회의 횟수",
    value: 8,
    unit: "회",
    period: "2024",
    source: "감사팀",
    evidenceCount: 1,
    status: "verified",
  },
  {
    id: "7",
    category: "리스크",
    indicatorName: "리스크 등급",
    value: 1,
    unit: "등급",
    period: "2024",
    source: "외부감사",
    evidenceCount: 0,
    status: "estimated",
  },
  {
    id: "8",
    category: "감사",
    indicatorName: "외부 감사 지적사항",
    value: 1,
    unit: "건",
    period: "2024",
    source: "외부감사",
    evidenceCount: 1,
    status: "pending",
  },
];

export const MOCK_GOV_DATA_QUALITY: DataQualityScore[] = [
  { id: "completeness", label: "Completeness", value: 90, description: "데이터 완전성" },
  { id: "accuracy", label: "Accuracy", value: 93, description: "정확도" },
  { id: "consistency", label: "Consistency", value: 91, description: "일관성" },
  { id: "overall", label: "전체 Data Quality Score", value: 91, description: "종합 점수" },
];

export const MOCK_GOV_TREND: GovernanceTrendPoint[] = [
  { month: "2024-01", board: 60, ethics: 97, compliance: 95, audit: 98 },
  { month: "2024-02", board: 60, ethics: 98, compliance: 96, audit: 98 },
  { month: "2024-03", board: 61, ethics: 98, compliance: 96, audit: 99 },
  { month: "2024-04", board: 61, ethics: 98.5, compliance: 97, audit: 99 },
  { month: "2024-05", board: 62, ethics: 99, compliance: 97, audit: 99 },
  { month: "2024-06", board: 62, ethics: 99, compliance: 97, audit: 98 },
  { month: "2024-07", board: 62.5, ethics: 99, compliance: 96, audit: 99 },
  { month: "2024-08", board: 62.5, ethics: 99, compliance: 97, audit: 99 },
  { month: "2024-09", board: 62.5, ethics: 99, compliance: 97, audit: 99 },
  { month: "2024-10", board: 62.5, ethics: 99, compliance: 98, audit: 99 },
  { month: "2024-11", board: 62.5, ethics: 99, compliance: 98, audit: 99 },
  { month: "2024-12", board: 62.5, ethics: 99, compliance: 98, audit: 99 },
];

export const MOCK_GOV_CATEGORY_BREAKDOWN: GovernanceCategoryBreakdownItem[] = [
  { id: "board", name: "이사회", value: 62.5, unit: "%" },
  { id: "ethics", name: "윤리", value: 99, unit: "%" },
  { id: "compliance", name: "준법", value: 98, unit: "%" },
  { id: "audit", name: "감사", value: 99, unit: "%" },
  { id: "risk", name: "리스크 등급", value: 1, unit: "등급" },
];

export function getGovernanceDetailById(id: string): GovernanceDataDetail | null {
  const row = MOCK_GOV_TABLE_ROWS.find((r) => r.id === id);
  if (!row) return null;
  const evidenceFiles =
    row.evidenceCount > 0
      ? [
          { id: "f1", name: "이사회_구성_2024.pdf", uploadedAt: "2024-02-15" },
          ...(row.evidenceCount > 1
            ? [{ id: "f2", name: "정기보고서_발췌.pdf", uploadedAt: "2024-02-20" } as const]
            : []),
        ]
      : [];
  return {
    ...row,
    aiAnalysis:
      row.status === "ai_anomaly"
        ? "준법 교육 미이수 건수가 전월 대비 증가했습니다. 미이수자 대상 집합 교육 실시 및 일정 관리를 권장합니다."
        : undefined,
    evidenceFiles,
    changeHistory: [
      { date: "2024-03-02", action: "값 수정", by: "김준법" },
      { date: "2024-02-15", action: "검증 완료", by: "감사팀" },
      { date: "2024-01-10", action: "최초 등록", by: "시스템" },
    ],
    memo: "",
  };
}
