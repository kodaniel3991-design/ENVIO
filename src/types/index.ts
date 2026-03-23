// CarbonOS – Central type definitions for frontend
// Ready for 1:1 mapping to FastAPI DTOs later

export type Scope = "scope1" | "scope2" | "scope3";

// ========== 공통 데이터 상태 / 품질 ==========

/** 데이터 행 상태 — environment/social/governance 공통 */
export type DataStatus =
  | "verified"
  | "estimated"
  | "pending"
  | "missing"
  | "ai_anomaly";

/** 데이터 품질 점수 카드 — environment/social/governance 공통 */
export interface DataQualityScore {
  id: string;
  label: string;
  value: number; // 0-100
  description?: string;
}

/** 월별 데이터 포인트 — validation/approval 공통 */
export interface MonthlyDataPoint {
  month: number;
  activityAmount: string | number;
  emissions: string | number;
  isAnomaly?: boolean;
}

export interface EmissionSummary {
  totalMtCO2e: number;
  scope1: number;
  scope2: number;
  scope3: number;
  period: string;
  yoyChangePercent: number;
}

export interface EmissionTrend {
  period: string;
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
}

export interface ScopeBreakdown {
  scope: Scope;
  label: string;
  value: number;
  percent: number;
  categoryBreakdown?: CategoryEmission[];
}

export interface CategoryEmission {
  category: string;
  value: number;
  unit: string;
}

/** 배출원 목록용 (배출량 관리 페이지) */
export interface EmissionSourceItem {
  id: string;
  sourceName: string;
  scope: Scope;
  category: string;
  value: number;
  unit: string;
  period: string;
  status?: "verified" | "estimated" | "pending";
}

/** 출퇴근 교통수단 옵션 */
export type CommuteTransportType =
  | "public"      // 대중교통
  | "car"         // 자가용 (연료는 fuel 필드에서 별도 관리)
  | "ev"          // 전기·수소
  | "walk_bike";  // 도보·자전거

export type DistanceApiProvider = "none" | "kakao" | "naver" | "google" | "custom";

export interface WorksiteLocation {
  name: string;
  address: string;
  addressDetail?: string;
}

export interface WorksiteItem extends WorksiteLocation {
  id: string;
}

export interface OrganizationSettings {
  organizationName: string;
  organizationAddress?: string;
  organizationAddressDetail?: string;
  worksites: WorksiteItem[];
  defaultWorksiteId?: string;
}

export interface DistanceApiSettings {
  provider: DistanceApiProvider;
  /** custom provider일 때 요청 base url */
  baseUrl?: string;
  /** 외부 API 키 */
  apiKey?: string;
  enabled: boolean;
}

/** 직원 출퇴근: 설정에서 등록하는 직원명부 항목 */
export interface EmployeeRosterItem {
  id: string;
  /** 소속 사업장 ID */
  worksiteId?: string;
  /** 부서 */
  department?: string;
  /** 이름 */
  name: string;
  /** 사원번호 */
  employeeId?: string;
  /** 출퇴근 교통수단 */
  commuteTransport?: CommuteTransportType;
  /** 연료 (자가용인 경우 등) */
  fuel?: string;
  /** 주소 (거주지 또는 출퇴근 기준) */
  address?: string;
  /** 상세주소 (거리 산출 정밀도를 위해) */
  addressDetail?: string;
  /** 주소 ↔ 사업장(출근지) 거리 (km) */
  commuteDistanceKm?: number;
  /** 등록일자 */
  createdAt?: string;
  /** 변경일자 */
  updatedAt?: string;
}

// ========== 사용자 및 권한 ==========

export type UserStatus = "active" | "invited" | "disabled";

export interface RoleItem {
  id: string;
  name: string;
  description?: string;
  /** e.g. "Admin", "Manager" */
  systemCode?: string;
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  department?: string;
  jobTitle?: string;
  roleId?: string;
  status: UserStatus;
  lastLoginAt?: string;
  createdAt?: string;
}

/** 직원 출퇴근: 연도별 직원별 월별 근무일수 (employeeId → 12개월) */
export interface CommutingWorkDaysByYear {
  year: string;
  workDays: Record<string, number[]>; // employeeId -> [1월..12월]
}

export interface CarbonFlowNode {
  id: string;
  name: string;
  type: "organization" | "facility" | "category" | "activity";
  value: number;
  unit: string;
  children?: CarbonFlowNode[];
}

export interface SupplyChainNode {
  id: string;
  name: string;
  tier: number;
  category: string;
  emissionsMtCO2e: number;
  riskLevel: "low" | "medium" | "high";
  status: "verified" | "estimated" | "pending";
  children?: SupplyChainNode[];
}

export interface AIInsight {
  id: string;
  title: string;
  summary: string;
  category: "reduction" | "risk" | "opportunity" | "compliance";
  confidence: number;
  createdAt: string;
  actions?: string[];
}

// AI 분석 – 대시보드/이상치/시나리오/리포트용
export interface AiKpiCard {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  changePercent?: number;
  riskLevel?: "low" | "medium" | "high";
}

export interface AiAnomalyItem {
  id: string;
  source: string;
  dimension: "carbon" | "esg" | "supply_chain";
  kpiName?: string;
  severity: "low" | "medium" | "high";
  deviationPercent: number;
  period: string;
  causeSummary: string;
  linkedKpiCount: number;
  linkedVendorCount: number;
}

export interface AiScenarioItem {
  id: string;
  name: string;
  description: string;
  reductionMtCO2e: number;
  reductionPercent: number;
  costImpact: "low" | "medium" | "high";
  roiYears?: number;
}

export interface AiForecastPoint extends ChartDataPoint {
  scenarioId: string;
}

export interface AiRoiPoint {
  scenarioId: string;
  label: string;
  investment: number;
  benefit: number;
  roiPercent: number;
}

export interface AiRiskSummary {
  kpiAtRiskCount: number;
  anomalyCount: number;
  highRiskVendors: number;
  supplyChainHotspots: number;
}

export interface AiSupplyChainRiskItem {
  id: string;
  vendorName: string;
  tier: number;
  category: string;
  riskLevel: "low" | "medium" | "high";
  emissionsSharePercent: number;
  anomalyCount: number;
}

export interface AiInsightReportItem {
  id: string;
  title: string;
  summary: string;
  readyForReport: boolean;
  relatedKpiCount: number;
  relatedIssueCount: number;
  createdAt: string;
}

export interface ReductionScenario {
  id: string;
  name: string;
  description: string;
  estimatedReductionPercent: number;
  costImpact: "low" | "medium" | "high";
  timelineMonths: number;
}

export interface SimulatorResult {
  scenarioId: string;
  baselineMtCO2e: number;
  projectedMtCO2e: number;
  reductionPercent: number;
  costEstimate?: number;
}

// 감축 허브 – 기회/프로젝트/진행 현황

export interface ReductionOpportunity {
  id: string;
  name: string;
  category: "energy" | "process" | "fleet" | "supply_chain";
  scope: Scope;
  description?: string;
  estimatedReductionMt: number;
  estimatedCostM: number;
  roiYears?: number;
  status: "idea" | "assessed" | "approved";
}

export interface ReductionProject {
  id: string;
  name: string;
  opportunityId?: string;
  owner: string;
  status: "planning" | "in_progress" | "blocked" | "completed";
  startDate?: string;
  endDate?: string;
  expectedReductionMt: number;
  actualReductionMt?: number;
}

export interface ReductionProgressKpi {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  target?: string | number;
}

export interface ReductionScopeSummary {
  scope: Scope;
  baselineMt: number;
  reducedMt: number;
}

export type ReportFramework = "ESG" | "K-ESG" | "GRI" | "ISSB" | "CSRD";

export interface ESGReport {
  id: string;
  title: string;
  type: "annual" | "quarterly" | "cdp" | "tcfd";
  period: string;
  status: "draft" | "published";
  publishedAt?: string;
  framework?: ReportFramework;
  version?: string;
}

export interface ComplianceItem {
  id: string;
  framework: string;
  requirement: string;
  status: "compliant" | "partial" | "non_compliant" | "not_applicable";
  dueDate?: string;
  lastChecked: string;
}

// 보고서 생성/프레임워크/매핑/템플릿

export interface ReportTemplate {
  id: string;
  name: string;
  framework: ReportFramework;
  description?: string;
  isDefault: boolean;
  lastUsedAt?: string;
}

export interface ReportGenerationReadiness {
  framework: ReportFramework;
  readinessPercent: number;
  coveragePercent: number;
  missingKpiCount: number;
}

export interface ReportGenerationHistoryItem {
  id: string;
  title: string;
  framework: ReportFramework;
  period: string;
  createdAt: string;
  status: "draft" | "generated";
}

export interface DisclosureFrameworkItem {
  id: string;
  framework: ReportFramework;
  code: string;
  name: string;
  linkedKpiCodes: string[];
  dataStatus: "complete" | "partial" | "missing";
  inReports: boolean;
}

export interface MappingEngineItem {
  id: string;
  kpiCode: string;
  kpiName: string;
  kpiCategory: KpiCategory;
  framework: ReportFramework;
  disclosureCode: string;
  status: "linked" | "partial" | "unlinked";
}

export interface DashboardKpi {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  unit?: string;
}

export interface ChartDataPoint {
  name: string;
  value?: number;
  [key: string]: string | number | undefined;
}

// Dashboard-specific (reference UI)
export type DashboardKpiStatus = "on_track" | "attention" | "anomaly";

export interface DashboardKpiItem {
  id: string;
  label: string;
  value: string | number;
  subLabel?: string;
  status?: DashboardKpiStatus;
  trendDirection?: "up" | "down";
  trendText: string;
}

export interface TopVendorEmission {
  id: string;
  vendorName: string;
  scope: Scope;
  emissionsKg: number;
  trendDirection: "up" | "down";
  trendPercent?: number;
  status: "linked" | "pending" | "not_linked";
}

export interface OffsetSummary {
  totalEmissionsT: number;
  offsetT: number;
}

export type DashboardNotificationType = "report" | "data" | "system";

export interface DashboardNotification {
  id: string;
  type: DashboardNotificationType;
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
  timestamp?: string;
  dismissible: boolean;
}

export type DashboardInsightType = "anomaly" | "recommendation" | "report";

export interface DashboardInsightItem {
  id: string;
  type: DashboardInsightType;
  title: string;
  detail: string;
  actionLabel: string;
  actionHref?: string;
}

// ESG 데이터관리
export type EsgDomain = "environment" | "social" | "governance";

export interface EsgMetricItem {
  id: string;
  category: string;
  indicatorName: string;
  value: string | number;
  unit: string;
  period: string;
  source?: string;
  status?: "verified" | "estimated" | "pending";
}

export interface EsgSummaryCard {
  label: string;
  value: string | number;
  unit?: string;
  changePercent?: number;
}

// ========== KPI 관리 (FastAPI 연동 시 DTO 매핑) ==========

export type KpiCategory = "environment" | "social" | "governance" | "carbon";

export type KpiStatus = "on_track" | "attention" | "anomaly";

export interface KpiManagementItem {
  id: string;
  name: string;
  category: KpiCategory;
  unit: string;
  target: number | string;
  actual?: number | string;
  achievementPercent?: number;
  period: string;
  status?: KpiStatus;
  /** 누락 KPI 여부 (데이터 미입력) */
  isMissing?: boolean;
  /** 보고서 반영 가능 여부 */
  reportIncluded?: boolean;
}

export interface KpiSummaryCard {
  label: string;
  value: string | number;
}

/** KPI 마스터 – 지표 정의 */
export interface KpiMasterItem {
  id: string;
  code: string;
  name: string;
  category: KpiCategory;
  unit: string;
  description?: string;
  reportIncluded: boolean;
  createdAt: string;
}

/** KPI 목표 */
export interface KpiTargetItem {
  id: string;
  kpiId: string;
  kpiName: string;
  period: string;
  targetValue: number | string;
  updatedAt: string;
  updatedBy?: string;
}

/** KPI 실적 */
export interface KpiPerformanceItem {
  id: string;
  kpiId: string;
  kpiName: string;
  period: string;
  actualValue: number | string;
  updatedAt: string;
  updatedBy?: string;
}

/** KPI 커버리지 – 영역별 데이터 보유 현황 */
export interface KpiCoverageItem {
  category: KpiCategory;
  totalCount: number;
  withDataCount: number;
  coveragePercent: number;
  missingKpiNames?: string[];
}

/** KPI 카테고리(분류) 마스터 */
export interface KpiCategoryItem {
  id: string;
  name: string;
  code: string;
  esgArea: KpiCategory;
  description?: string;
  sortOrder: number;
}

/** KPI 변경 이력 */
export interface KpiChangeLogItem {
  id: string;
  kpiId: string;
  kpiName: string;
  field: string;
  oldValue: string | number;
  newValue: string | number;
  changedAt: string;
  changedBy: string;
}

/** KPI 설정 */
export interface KpiSettings {
  defaultPeriod: string;
  reportInclusionDefault: boolean;
  targetUpdateAllowed: boolean;
  decimalPlaces: number;
}

// ========== 공급망 포털 (Supply Chain Portal) ==========
// FastAPI DTO 매핑용 – 필드명 snake_case 유지 가능

export type PortalVendorStatus = "active" | "invited" | "pending" | "suspended";

export type SubmissionStatusType = "not_started" | "in_progress" | "submitted" | "verified" | "rejected";

export type VerificationStepStatus = "pending" | "in_review" | "approved" | "rejected";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface PortalVendor {
  id: string;
  name: string;
  email: string;
  status: PortalVendorStatus;
  tier: number;
  category: string;
  invitedAt?: string;
  linkedAt?: string;
  submissionStatus: SubmissionStatusType;
  esgScore?: number;
  riskLevel: RiskLevel;
}

export interface PortalInvitation {
  id: string;
  vendorId: string;
  vendorName: string;
  email: string;
  sentAt: string;
  expiresAt: string;
  status: "pending" | "accepted" | "expired";
}

export interface SubmissionByVendor {
  vendorId: string;
  vendorName: string;
  period: string;
  status: SubmissionStatusType;
  submittedAt?: string;
  scope3CategoriesCompleted: number;
  scope3CategoriesTotal: number;
  emissionsTco2e?: number;
}

export interface Scope3CategoryPortal {
  id: string;
  name: string;
  code: string;
  totalEmissionsTco2e: number;
  completionPercent: number;
  vendorCount: number;
  verifiedCount: number;
}

export interface VendorEsgScore {
  vendorId: string;
  vendorName: string;
  overallScore: number;
  environmentScore: number;
  socialScore: number;
  governanceScore: number;
  riskLevel: RiskLevel;
  trend: "up" | "down" | "stable";
  lastUpdated: string;
}

export interface VerificationItem {
  id: string;
  vendorId: string;
  vendorName: string;
  period: string;
  step: "data_review" | "evidence_check" | "approval";
  stepStatus: VerificationStepStatus;
  requestedAt: string;
  completedAt?: string;
  assignedTo?: string;
}

export interface EvidenceFile {
  id: string;
  verificationId: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  uploadedBy: string;
  status: "pending" | "approved" | "rejected";
}

export interface PortalSettings {
  invitationExpiryDays: number;
  reminderDaysBeforeExpiry: number;
  defaultTier: number;
  requireEvidence: boolean;
  allowedFileTypes: string[];
}

// ========== 중대성 평가 (Materiality Assessment) ==========
// 내부 전문가 평가 + 산업 벤치마크 + KPI 영향도 + AI 추천 기반

export type MaterialityEsgDimension = "environment" | "social" | "governance";

/** ESG 이슈 – 평가 대상 */
export interface MaterialityIssue {
  id: string;
  code: string;
  name: string;
  dimension: MaterialityEsgDimension;
  description?: string;
  /** 내부 전문가 평가 점수 (1–5) */
  expertScore: number;
  /** 산업 벤치마크 점수 (1–5) */
  benchmarkScore: number;
  /** KPI 연결 수 */
  kpiLinkedCount: number;
  /** KPI 연결 여부/상태 */
  kpiConnectionStatus: "none" | "partial" | "full";
  /** AI 추천 우선순위 (1=최상) */
  aiRecommendRank?: number;
  /** 중대성 매트릭스 x (영향도) */
  impactScore: number;
  /** 중대성 매트릭스 y (관련자 중요도) */
  stakeholderScore: number;
  /** 보고서 연결 수 */
  reportLinkedCount: number;
  updatedAt: string;
}

/** AI 추천 카드 */
export interface MaterialityAiRecommendation {
  id: string;
  issueId: string;
  issueName: string;
  reason: string;
  suggestedPriority: number;
  confidence: number;
  createdAt: string;
}

/** 중대성 매트릭스 데이터 포인트 */
export interface MaterialityMatrixPoint {
  issueId: string;
  issueName: string;
  dimension: MaterialityEsgDimension;
  x: number;
  y: number;
}

/** 핵심 이슈 랭킹 */
export interface MaterialityIssueRanking {
  rank: number;
  issueId: string;
  issueName: string;
  dimension: MaterialityEsgDimension;
  compositeScore: number;
  expertScore: number;
  benchmarkScore: number;
  kpiLinkedCount: number;
}

/** 보고서 연계 */
export interface MaterialityReportLink {
  id: string;
  issueId: string;
  reportId: string;
  reportTitle: string;
  reportType: string;
  sectionRef?: string;
  linkedAt: string;
}

/** 중대성 평가 버전 이력 */
export interface MaterialityVersionHistory {
  id: string;
  version: string;
  description: string;
  issueCount: number;
  createdAt: string;
  createdBy: string;
}

/** 중대성 평가 설정 */
export interface MaterialitySettings {
  assessmentPeriod: string;
  expertWeight: number;
  benchmarkWeight: number;
  kpiImpactWeight: number;
  matrixThresholdHigh: number;
  matrixThresholdMedium: number;
}
