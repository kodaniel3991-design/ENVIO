/**
 * 거버넌스 데이터(Governance Data) 페이지용 타입 정의
 * 환경 데이터 구조에 맞춰 설계, 추후 API 스키마와 교체 가능
 */

/** 테이블 행 데이터 상태 (환경 데이터와 동일) */
export type DataStatus =
  | "verified"
  | "estimated"
  | "pending"
  | "missing"
  | "ai_anomaly";

/** 데이터 출처 */
export type GovernanceDataSource =
  | "API"
  | "ERP"
  | "Excel"
  | "Manual"
  | "법무팀"
  | "감사팀"
  | "외부감사"
  | "정기보고"
  | string;

/** 거버넌스 데이터 테이블 행 */
export interface GovernanceDataRow {
  id: string;
  category: string; // 구분: 이사회, 윤리, 준법, 리스크, 감사 등
  indicatorName: string;
  value: number;
  unit: string;
  period: string;
  source: GovernanceDataSource;
  evidenceCount: number;
  status: DataStatus;
}

/** KPI 요약 카드 항목 */
export interface GovernanceKpiItem {
  id: string;
  label: string;
  value: string | number;
  subValue?: string;
  changePercent?: number;
  unit?: string;
}

/** AI 인사이트 */
export interface GovernanceAiInsight {
  alerts: string[];
  possibleCauses: string[];
  recommendedActions: string[];
  hasAnomaly: boolean;
}

/** 데이터 품질 점수 */
export interface DataQualityScore {
  id: string;
  label: string;
  value: number;
  description?: string;
}

/** 월별 거버넌스 지표 추이 */
export interface GovernanceTrendPoint {
  month: string;
  board: number;    // 이사회 독립성 등
  ethics: number;   // 윤리
  compliance: number; // 준법
  audit: number;     // 감사
}

/** 거버넌스 카테고리별 요약 */
export interface GovernanceCategoryBreakdownItem {
  id: string;
  name: string;
  value: number;
  unit?: string;
}

/** 상세 드로어용 확장 데이터 */
export interface GovernanceDataDetail extends GovernanceDataRow {
  aiAnalysis?: string;
  evidenceFiles: { id: string; name: string; uploadedAt: string }[];
  changeHistory: { date: string; action: string; by?: string }[];
  memo?: string;
}
