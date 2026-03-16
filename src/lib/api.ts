/**
 * 공통 API 유틸리티
 *
 * - delay   : mock 딜레이 (백엔드 연동 시 제거)
 * - ApiError: 에러 표준화 클래스
 * - apiCall : try/catch 래퍼 — 모든 API 함수에서 사용
 */

import { ZodError } from "zod";

/** mock 딜레이 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 표준화된 API 에러 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * API 호출 래퍼 — 에러를 ApiError로 변환
 *
 * - ZodError: 백엔드 응답 스키마 불일치 (SCHEMA_MISMATCH)
 * - 일반 Error: 메시지 전달
 * - 기타: 알 수 없는 오류
 */
export async function apiCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof ZodError) {
      const first = error.issues[0];
      const field = first?.path.join(".") ?? "";
      const msg = first?.message ?? error.message;
      throw new ApiError(
        `데이터 형식 오류${field ? ` (${field})` : ""}: ${msg}`,
        "SCHEMA_MISMATCH"
      );
    }
    if (error instanceof Error) {
      throw new ApiError(error.message);
    }
    throw new ApiError("알 수 없는 오류가 발생했습니다.");
  }
}
