/**
 * 사회 데이터(Social Data) 페이지용 타입 정의
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
export type SocialDataSource =
  | "API"
  | "ERP"
  | "Excel"
  | "Manual"
  | "HR시스템"
  | "설문"
  | "외부인증"
  | string;

/** 사회 데이터 테이블 행 */
export interface SocialDataRow {
  id: string;
  category: string; // 구분: 인권, 노동, 안전보건, 지역사회, 고객 등
  indicatorName: string;
  value: number;
  unit: string;
  period: string;
  source: SocialDataSource;
  evidenceCount: number;
  status: DataStatus;
}

/** KPI 요약 카드 항목 */
export interface SocialKpiItem {
  id: string;
  label: string;
  value: string | number;
  subValue?: string;
  changePercent?: number;
  unit?: string;
}

/** AI 인사이트 */
export interface SocialAiInsight {
  alerts: string[];
  possibleCauses: string[];
  recommendedActions: string[];
  hasAnomaly: boolean;
}

/** 데이터 품질 점수 (환경과 동일 구조) */
export interface DataQualityScore {
  id: string;
  label: string;
  value: number;
  description?: string;
}

/** 월별 사회 지표 추이 (카테고리별) */
export interface SocialTrendPoint {
  month: string;
  humanRights: number;   // 인권 지표
  labor: number;        // 노동
  safety: number;        // 안전보건
  community: number;     // 지역사회
}

/** 사회 카테고리별 요약 (인권, 노동, 안전보건 등) */
export interface SocialCategoryBreakdownItem {
  id: string;
  name: string;
  value: number;
  unit?: string;
}

/** 상세 드로어용 확장 데이터 */
export interface SocialDataDetail extends SocialDataRow {
  aiAnalysis?: string;
  evidenceFiles: { id: string; name: string; uploadedAt: string }[];
  changeHistory: { date: string; action: string; by?: string }[];
  memo?: string;
}
