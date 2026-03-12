/**
 * 환경 데이터(Environment Data) 페이지용 타입 정의
 * 추후 API 스키마와 맞춰 교체 가능
 */

/** 테이블 행 데이터 상태 */
export type DataStatus =
  | "verified"
  | "estimated"
  | "pending"
  | "missing"
  | "ai_anomaly";

/** 데이터 출처 */
export type DataSource =
  | "API"
  | "ERP"
  | "IoT"
  | "Excel"
  | "Supplier Portal"
  | "Manual"
  | "에너지관리시스템"
  | "Emission Engine"
  | "KEPCO API"
  | string;

/** 환경 데이터 테이블 행 */
export interface EnvironmentDataRow {
  id: string;
  category: string; // 구분: 에너지, 온실가스, 폐기물, 물 등
  indicatorName: string; // 지표명
  value: number;
  unit: string;
  period: string;
  source: DataSource;
  evidenceCount: number; // 증빙 파일 수
  status: DataStatus;
}

/** KPI 요약 카드 항목 */
export interface EnvironmentKpiItem {
  id: string;
  label: string;
  value: string | number;
  subValue?: string; // 전년 대비 등
  changePercent?: number;
  unit?: string;
}

/** AI 인사이트 */
export interface EnvironmentAiInsight {
  alerts: string[];
  possibleCauses: string[];
  recommendedActions: string[];
  hasAnomaly: boolean;
}

/** 데이터 품질 점수 */
export interface DataQualityScore {
  id: string;
  label: string;
  value: number; // 0-100
  description?: string;
}

/** 월별 추이 데이터 (Scope 1·2·3) */
export interface MonthlyEmissionPoint {
  month: string; // "2024-01"
  scope1: number;
  scope2: number;
  scope3: number;
}

/** 에너지 vs 재생에너지 비율 */
export interface EnergyTrendPoint {
  month: string;
  totalEnergy: number; // GJ
  renewablePercent: number;
}

/** Scope 3 세부 카테고리 */
export interface Scope3BreakdownItem {
  id: string;
  name: string;
  value: number; // tCO2e
  code?: string;
}

/** 상세 패널 / 드로어용 확장 데이터 */
export interface EnvironmentDataDetail extends EnvironmentDataRow {
  aiAnalysis?: string;
  evidenceFiles: { id: string; name: string; uploadedAt: string }[];
  changeHistory: { date: string; action: string; by?: string }[];
  memo?: string;
}
