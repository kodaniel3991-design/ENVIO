/**
 * 숫자·단위 포맷 유틸 (환경 데이터 등 공통)
 * API 응답 포맷팅 시 재사용
 */

/** 천 단위 콤마 + 소수 자리 */
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** 증감률 표시: +3.1% / -8.2% */
export function formatChangePercent(value: number, decimals = 1): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/** tCO2e 등 단위 붙여서 */
export function formatWithUnit(value: number, unit: string, decimals = 0): string {
  return `${formatNumber(value, decimals)} ${unit}`;
}
