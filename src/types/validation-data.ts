/**
 * 데이터 검증(Validation) 페이지용 타입 정의
 * 추후 API 스키마와 맞춰 교체 가능
 */

// MonthlyDataPoint는 types/index.ts에서 통합 관리
export type { MonthlyDataPoint } from "@/types";

/** 검증 상태 */
export type ValidationStatus =
  | "submitted"
  | "under_review"
  | "verified"
  | "missing"
  | "needs_evidence"
  | "ai_anomaly";

/** AI 검증 결과 */
export type AiVerificationResult = "normal" | "anomaly" | "missing_risk";

/** 데이터 출처 */
export type ValidationDataSource =
  | "Manual"
  | "Excel"
  | "ERP"
  | "API"
  | "Supplier Portal"
  | "IoT"
  | string;

/** 검증 요약 KPI 항목 */
export interface ValidationSummaryItem {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  subLabel?: string;
}

/** 검증 테이블 행 */
export interface ValidationDataRow {
  id: string;
  status: ValidationStatus;
  scope: "Scope 1" | "Scope 2" | "Scope 3";
  category: string;
  emissionSource: string;
  site: string;
  period: string;
  activityAmount: string;
  emissions: string;
  evidenceCount: number;
  aiVerification: AiVerificationResult;
  submittedBy: string;
  submittedAt: string;
  dataSource: ValidationDataSource;
}

/** AI 검증 인사이트 */
export interface ValidationAiInsight {
  alerts: string[];
  possibleCauses: string[];
  suggestedActions: string[];
  hasAnomaly: boolean;
}

/** 검증 품질 점수 */
export interface ValidationQualityScore {
  id: string;
  label: string;
  value: number;
  description?: string;
}

/** 워크플로우 단계 */
export interface ValidationWorkflowStep {
  id: string;
  label: string;
  count: number;
  description?: string;
}

/** 상세 드로어용 확장 데이터 */
export interface ValidationDataDetail extends ValidationDataRow {
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
  aiResultText?: string;
  changeHistory: { date: string; action: string; by?: string }[];
}
