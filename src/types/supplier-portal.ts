/**
 * 협력사 포털(Supplier Portal) 페이지용 타입 정의
 * 공급망 포털 전용, 추후 API 스키마와 교체 가능
 */

/** 협력사 상태 */
export type SupplierStatus =
  | "connected"
  | "invited"
  | "pending_response"
  | "not_invited";

/** Tier / 협력사 등급 */
export type SupplierTier = "strategic" | "core" | "general";

/** 리스크 수준 */
export type SupplierRiskLevel = "low" | "medium" | "high" | "critical";

/** 제출 상태 */
export type SubmissionStatus =
  | "verified"
  | "submitted"
  | "in_progress"
  | "not_started"
  | "overdue";

/** KPI 요약 항목 */
export interface SupplierSummaryItem {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  subLabel?: string;
}

/** 협력사 테이블 행 */
export interface SupplierRow {
  id: string;
  name: string;
  email: string;
  status: SupplierStatus;
  tier: SupplierTier;
  submissionStatus: SubmissionStatus;
  riskLevel: SupplierRiskLevel;
  esgScore: number | null;
  category?: string;
}

/** 인사이트 */
export interface SupplierInsight {
  highlights: string[];
  recommendedActions: string[];
  badgeLabel: string;
}

/** 상세 드로어용 확장 */
export interface SupplierDetail extends SupplierRow {
  contactName?: string;
  linkedSite?: string;
  invitedAt?: string;
  lastResponseAt?: string;
  remindCount?: number;
  riskReasons?: string[];
  lastAssessedAt?: string;
  scope3Categories?: string[];
  scope3Contribution?: string;
  submissionCount?: number;
  evidenceCount?: number;
  communicationHistory: { date: string; action: string }[];
}

/** 차트용 상태별 분포 */
export interface StatusDistribution {
  status: string;
  count: number;
  fill?: string;
}

/** 주차별 응답 추이 */
export interface ResponseTrendPoint {
  week: string;
  invited: number;
  responded: number;
}

/** Scope 3 커버리지 */
export interface Scope3CoverageItem {
  id: string;
  label: string;
  value: number;
  unit?: string;
}
