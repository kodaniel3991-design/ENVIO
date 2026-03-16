/**
 * 데이터 승인/확정(Approval Confirmation) 페이지용 타입 정의
 * 검증 페이지 구조 재사용, 추후 API 스키마와 교체 가능
 */

// MonthlyDataPoint는 types/index.ts에서 통합 관리
export type { MonthlyDataPoint } from "@/types";

/** 승인 상태 */
export type ApprovalStatus =
  | "pending_approval"
  | "approved"
  | "rejected"
  | "confirmed"
  | "reopened";

/** 검증 상태 (테이블용) */
export type VerificationStatusBadge = "verified" | "needs_review";

/** 승인 요약 KPI 항목 */
export interface ApprovalSummaryItem {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  subLabel?: string;
}

/** 승인 테이블 행 */
export interface ApprovalDataRow {
  id: string;
  status: ApprovalStatus;
  scope: "Scope 1" | "Scope 2" | "Scope 3";
  category: string;
  emissionSource: string;
  site: string;
  period: string;
  activityAmount: string;
  emissions: string;
  evidenceCount: number;
  verificationStatus: VerificationStatusBadge;
  submittedBy: string;
  approver: string;
  submittedAt: string;
}

/** 승인 인사이트 */
export interface ApprovalInsight {
  highlights: string[];
  recommendedActions: string[];
  badgeLabel: string;
}

/** 승인 워크플로우 단계 */
export interface ApprovalWorkflowStep {
  id: string;
  label: string;
  count: number;
  description?: string;
}

/** 상세 드로어용 확장 데이터 */
export interface ApprovalDataDetail extends ApprovalDataRow {
  year: number;
  month?: number;
  monthlyData: import("@/types").MonthlyDataPoint[];
  emissionFactor: {
    value: number;
    unit: string;
    source: string;
    baseYear: string;
  };
  evidenceFiles: { id: string; name: string; uploadedAt?: string }[];
  verificationSummary: {
    verified: boolean;
    anomalyResolved: boolean;
    missingResolved: boolean;
  };
  changeHistory: { date: string; action: string; by?: string }[];
  approvedAt?: string;
  isLocked: boolean;
}
