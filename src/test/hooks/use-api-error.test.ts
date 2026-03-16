import { describe, it, expect } from "vitest";
import { ApiError } from "@/lib/api";
import { getApiErrorMessage } from "@/hooks/use-api-error";

describe("getApiErrorMessage", () => {
  it("null/undefined 이면 빈 문자열을 반환한다", () => {
    expect(getApiErrorMessage(null)).toBe("");
    expect(getApiErrorMessage(undefined)).toBe("");
  });

  it("SCHEMA_MISMATCH 코드이면 형식 오류 메시지를 반환한다", () => {
    const err = new ApiError("field: expected number", "SCHEMA_MISMATCH");
    expect(getApiErrorMessage(err)).toMatch("데이터 형식 오류");
  });

  it("401 이면 로그인 필요 메시지를 반환한다", () => {
    const err = new ApiError("Unauthorized", undefined, 401);
    expect(getApiErrorMessage(err)).toBe("로그인이 필요합니다.");
  });

  it("403 이면 권한 없음 메시지를 반환한다", () => {
    const err = new ApiError("Forbidden", undefined, 403);
    expect(getApiErrorMessage(err)).toBe("접근 권한이 없습니다.");
  });

  it("404 이면 데이터 없음 메시지를 반환한다", () => {
    const err = new ApiError("Not Found", undefined, 404);
    expect(getApiErrorMessage(err)).toBe("데이터를 찾을 수 없습니다.");
  });

  it("5xx 이면 서버 오류 메시지를 반환한다", () => {
    const err500 = new ApiError("Internal Server Error", undefined, 500);
    const err503 = new ApiError("Service Unavailable", undefined, 503);
    expect(getApiErrorMessage(err500)).toBe("서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    expect(getApiErrorMessage(err503)).toBe("서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
  });

  it("기타 ApiError는 원본 message를 반환한다", () => {
    const err = new ApiError("커스텀 오류 메시지", undefined, 422);
    expect(getApiErrorMessage(err)).toBe("커스텀 오류 메시지");
  });

  it("일반 Error는 message를 반환한다", () => {
    expect(getApiErrorMessage(new Error("일반 오류"))).toBe("일반 오류");
  });

  it("알 수 없는 타입이면 기본 메시지를 반환한다", () => {
    expect(getApiErrorMessage("string error")).toBe("알 수 없는 오류가 발생했습니다.");
    expect(getApiErrorMessage(42)).toBe("알 수 없는 오류가 발생했습니다.");
  });
});
