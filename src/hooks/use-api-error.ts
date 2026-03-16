"use client";

import { ApiError } from "@/lib/api";

/**
 * API 에러 메시지를 사용자 친화적 문자열로 변환합니다.
 * (훅이 아닌 순수 함수 — 조건부 호출 및 인라인 사용 가능)
 */
export function getApiErrorMessage(error: unknown): string {
  if (!error) return "";
  if (error instanceof ApiError) {
    if (error.code === "SCHEMA_MISMATCH") {
      return `데이터 형식 오류가 발생했습니다. 관리자에게 문의하세요. (${error.message})`;
    }
    if (error.status === 401) return "로그인이 필요합니다.";
    if (error.status === 403) return "접근 권한이 없습니다.";
    if (error.status === 404) return "데이터를 찾을 수 없습니다.";
    if (error.status != null && error.status >= 500) {
      return "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "알 수 없는 오류가 발생했습니다.";
}

/**
 * 여러 React Query 결과 중 첫 번째 에러 메시지를 반환합니다.
 *
 * 사용 예시:
 * ```tsx
 * const q1 = useQuery(...);
 * const q2 = useQuery(...);
 * const errorMessage = useFirstApiError([q1, q2]);
 * ```
 */
/**
 * useApiErrorMessage — 훅 래퍼 (기존 호환성 유지)
 * 훅 규칙이 필요한 컴포넌트에서 사용하세요.
 */
export function useApiErrorMessage(error: unknown): string {
  return getApiErrorMessage(error);
}

/**
 * 여러 React Query 결과 중 첫 번째 에러 메시지를 반환합니다.
 *
 * 사용 예시:
 * ```tsx
 * const q1 = useQuery(...);\n * const q2 = useQuery(...);
 * const errorMessage = useFirstApiError([q1, q2]);
 * ```
 */
export function useFirstApiError(
  queries: Array<{ error: unknown; isError: boolean }>
): string {
  const errored = queries.find((q) => q.isError);
  return errored ? getApiErrorMessage(errored.error) : "";
}
