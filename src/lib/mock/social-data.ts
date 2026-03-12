/**
 * 사회 데이터 페이지 목업
 * 추후 API 연동 시 제거 또는 fetch 래퍼로 교체
 */

import type {
  SocialKpiItem,
  SocialAiInsight,
  SocialDataRow,
  DataQualityScore,
  SocialTrendPoint,
  SocialCategoryBreakdownItem,
  SocialDataDetail,
} from "@/types/social-data";

export const MOCK_SOCIAL_KPI: SocialKpiItem[] = [
  {
    id: "employees",
    label: "전체 직원 수",
    value: "2,450",
    unit: "명",
    changePercent: 3.2,
  },
  {
    id: "turnover",
    label: "이직률",
    value: "8.2",
    subValue: "%",
    changePercent: -0.5,
    unit: "%",
  },
  {
    id: "training",
    label: "교육 이수율",
    value: "94",
    subValue: "%",
    changePercent: 2.1,
    unit: "%",
  },
  {
    id: "safety",
    label: "안전사고 건수",
    value: "3",
    unit: "건",
    changePercent: -25,
  },
  {
    id: "community",
    label: "사회공헌 투입액",
    value: "1.2",
    subValue: "억 원",
    changePercent: 5.0,
    unit: "억",
  },
  {
    id: "satisfaction",
    label: "직원 만족도",
    value: "78",
    subValue: "점",
    changePercent: 1.5,
    unit: "점",
  },
];

export const MOCK_SOCIAL_AI_INSIGHT: SocialAiInsight = {
  hasAnomaly: true,
  alerts: [
    "부산공장 이직률 전월 대비 +12%p 증가",
    "신규 입사자 온보딩 이수율 미달",
  ],
  possibleCauses: [
    "경쟁사 채용 확대",
    "온보딩 교육 일정 지연",
    "부서별 교육 담당 공백",
  ],
  recommendedActions: [
    "이직 사유 설문 및 인터뷰 실시",
    "온보딩 커리큘럼 1분기 내 보완",
    "HR 담당자 배정 점검",
  ],
};

export const MOCK_SOCIAL_TABLE_ROWS: SocialDataRow[] = [
  {
    id: "1",
    category: "인권",
    indicatorName: "인권 교육 이수율",
    value: 98.5,
    unit: "%",
    period: "2024",
    source: "HR시스템",
    evidenceCount: 2,
    status: "verified",
  },
  {
    id: "2",
    category: "노동",
    indicatorName: "전체 이직률",
    value: 8.2,
    unit: "%",
    period: "2024",
    source: "HR시스템",
    evidenceCount: 1,
    status: "verified",
  },
  {
    id: "3",
    category: "노동",
    indicatorName: "부산공장 이직률",
    value: 12.5,
    unit: "%",
    period: "2024",
    source: "HR시스템",
    evidenceCount: 1,
    status: "ai_anomaly",
  },
  {
    id: "4",
    category: "노동",
    indicatorName: "교육 이수율",
    value: 94,
    unit: "%",
    period: "2024",
    source: "HR시스템",
    evidenceCount: 3,
    status: "verified",
  },
  {
    id: "5",
    category: "안전보건",
    indicatorName: "산업재해 발생 건수",
    value: 3,
    unit: "건",
    period: "2024",
    source: "외부인증",
    evidenceCount: 2,
    status: "verified",
  },
  {
    id: "6",
    category: "안전보건",
    indicatorName: "안전교육 이수율",
    value: 99,
    unit: "%",
    period: "2024",
    source: "HR시스템",
    evidenceCount: 1,
    status: "verified",
  },
  {
    id: "7",
    category: "지역사회",
    indicatorName: "사회공헌 투입액",
    value: 1.2,
    unit: "억 원",
    period: "2024",
    source: "Manual",
    evidenceCount: 0,
    status: "estimated",
  },
  {
    id: "8",
    category: "고객",
    indicatorName: "고객 만족도",
    value: 82,
    unit: "점",
    period: "2024",
    source: "설문",
    evidenceCount: 1,
    status: "pending",
  },
];

export const MOCK_SOCIAL_DATA_QUALITY: DataQualityScore[] = [
  { id: "completeness", label: "Completeness", value: 88, description: "데이터 완전성" },
  { id: "accuracy", label: "Accuracy", value: 91, description: "정확도" },
  { id: "consistency", label: "Consistency", value: 89, description: "일관성" },
  { id: "overall", label: "전체 Data Quality Score", value: 89, description: "종합 점수" },
];

export const MOCK_SOCIAL_TREND: SocialTrendPoint[] = [
  { month: "2024-01", humanRights: 96, labor: 92, safety: 98, community: 85 },
  { month: "2024-02", humanRights: 97, labor: 91, safety: 99, community: 86 },
  { month: "2024-03", humanRights: 97.5, labor: 93, safety: 98, community: 87 },
  { month: "2024-04", humanRights: 98, labor: 92, safety: 99, community: 88 },
  { month: "2024-05", humanRights: 98, labor: 93, safety: 98, community: 86 },
  { month: "2024-06", humanRights: 98.5, labor: 94, safety: 99, community: 89 },
  { month: "2024-07", humanRights: 98, labor: 93, safety: 98, community: 87 },
  { month: "2024-08", humanRights: 98.5, labor: 92, safety: 99, community: 88 },
  { month: "2024-09", humanRights: 98, labor: 93, safety: 98, community: 90 },
  { month: "2024-10", humanRights: 98.5, labor: 94, safety: 99, community: 89 },
  { month: "2024-11", humanRights: 98.5, labor: 93, safety: 98, community: 88 },
  { month: "2024-12", humanRights: 98.5, labor: 94, safety: 99, community: 90 },
];

export const MOCK_SOCIAL_CATEGORY_BREAKDOWN: SocialCategoryBreakdownItem[] = [
  { id: "hr", name: "인권", value: 98.5, unit: "%" },
  { id: "labor", name: "노동", value: 94, unit: "%" },
  { id: "safety", name: "안전보건", value: 99, unit: "%" },
  { id: "community", name: "지역사회", value: 1.2, unit: "억 원" },
  { id: "customer", name: "고객 만족도", value: 82, unit: "점" },
];

export function getSocialDetailById(id: string): SocialDataDetail | null {
  const row = MOCK_SOCIAL_TABLE_ROWS.find((r) => r.id === id);
  if (!row) return null;
  const evidenceFiles =
    row.evidenceCount > 0
      ? [
          { id: "f1", name: "인권교육_이수현황_2024.xlsx", uploadedAt: "2024-02-15" },
          ...(row.evidenceCount > 1
            ? [{ id: "f2", name: "검증보고.pdf", uploadedAt: "2024-02-20" } as const]
            : []),
        ]
      : [];
  return {
    ...row,
    aiAnalysis:
      row.status === "ai_anomaly"
        ? "부산공장 이직률이 전사 평균 대비 높게 나타났습니다. 이직 사유 설문 및 현장 인터뷰를 권장합니다."
        : undefined,
    evidenceFiles,
    changeHistory: [
      { date: "2024-03-02", action: "값 수정", by: "김HR" },
      { date: "2024-02-15", action: "검증 완료", by: "이검증" },
      { date: "2024-01-10", action: "최초 등록", by: "시스템" },
    ],
    memo: "",
  };
}
