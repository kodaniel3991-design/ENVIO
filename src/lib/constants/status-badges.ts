/**
 * 공통 상태 뱃지 상수
 *
 * 동일한 status → label/variant 매핑이 여러 컴포넌트에 중복되는 문제를 해결합니다.
 * Badge 컴포넌트의 variant 타입과 1:1 대응합니다.
 */

// ─────────────────────────────────────────────
// DataStatus: verified / estimated / pending / missing / ai_anomaly
// (환경·사회·거버넌스 데이터, 배출원, ESG 지표 공통)
// ─────────────────────────────────────────────

export const DATA_STATUS_LABEL: Record<string, string> = {
  verified: "검증됨",
  estimated: "추정",
  pending: "입력대기",
  missing: "누락",
  ai_anomaly: "AI 이상",
};

export const DATA_STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "secondary" | "danger"
> = {
  verified: "success",
  estimated: "warning",
  pending: "secondary",
  missing: "danger",
  ai_anomaly: "warning",
};

// ─────────────────────────────────────────────
// ComplianceStatus: compliant / partial / non_compliant / not_applicable
// ─────────────────────────────────────────────

export const COMPLIANCE_STATUS_LABEL: Record<string, string> = {
  compliant: "준수",
  partial: "일부 준수",
  non_compliant: "미준수",
  not_applicable: "해당 없음",
};

export const COMPLIANCE_STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "danger" | "secondary"
> = {
  compliant: "success",
  partial: "warning",
  non_compliant: "danger",
  not_applicable: "secondary",
};

// ─────────────────────────────────────────────
// UserStatus: active / invited / disabled
// ─────────────────────────────────────────────

export const USER_STATUS_LABEL: Record<string, string> = {
  active: "활성",
  invited: "초대됨",
  disabled: "비활성",
};

export const USER_STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "secondary"
> = {
  active: "success",
  invited: "warning",
  disabled: "secondary",
};

// ─────────────────────────────────────────────
// TopVendorStatus: linked / pending / not_linked
// ─────────────────────────────────────────────

export const VENDOR_LINK_STATUS_LABEL: Record<string, string> = {
  linked: "연동 완료",
  pending: "입력 대기 중",
  not_linked: "미연동",
};

export const VENDOR_LINK_STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "secondary"
> = {
  linked: "success",
  pending: "warning",
  not_linked: "secondary",
};
