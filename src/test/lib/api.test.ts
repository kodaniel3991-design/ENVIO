import { describe, it, expect } from "vitest";
import { z } from "zod";
import { ApiError, apiCall } from "@/lib/api";

describe("ApiError", () => {
  it("name이 'ApiError'로 설정된다", () => {
    const err = new ApiError("오류");
    expect(err.name).toBe("ApiError");
  });

  it("message, code, status가 올바르게 저장된다", () => {
    const err = new ApiError("서버 오류", "SERVER_ERROR", 500);
    expect(err.message).toBe("서버 오류");
    expect(err.code).toBe("SERVER_ERROR");
    expect(err.status).toBe(500);
  });

  it("instanceof Error를 만족한다", () => {
    const err = new ApiError("오류");
    expect(err instanceof Error).toBe(true);
  });
});

describe("apiCall", () => {
  it("성공 시 값을 그대로 반환한다", async () => {
    const result = await apiCall(async () => 42);
    expect(result).toBe(42);
  });

  it("ApiError는 그대로 재throw한다", async () => {
    const original = new ApiError("원본 오류", "ORIG", 400);
    await expect(apiCall(async () => { throw original; })).rejects.toBe(original);
  });

  it("ZodError를 SCHEMA_MISMATCH ApiError로 변환한다", async () => {
    const schema = z.object({ value: z.number() });
    await expect(
      apiCall(async () => schema.parse({ value: "wrong" }))
    ).rejects.toMatchObject({
      code: "SCHEMA_MISMATCH",
      name: "ApiError",
    });
  });

  it("일반 Error를 ApiError로 변환한다", async () => {
    await expect(
      apiCall(async () => { throw new Error("네트워크 오류"); })
    ).rejects.toMatchObject({
      message: "네트워크 오류",
      name: "ApiError",
    });
  });

  it("알 수 없는 값을 throw하면 기본 메시지를 가진 ApiError로 변환한다", async () => {
    await expect(
      apiCall(async () => { throw "문자열 오류"; })
    ).rejects.toMatchObject({
      message: "알 수 없는 오류가 발생했습니다.",
      name: "ApiError",
    });
  });
});
