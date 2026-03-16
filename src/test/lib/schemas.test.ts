import { describe, it, expect } from "vitest";
import {
  ScopeSchema,
  DataStatusSchema,
  ChartDataPointSchema,
} from "@/lib/schemas/common";
import { EmissionSummarySchema } from "@/lib/schemas/emissions";
import { DashboardKpiItemSchema } from "@/lib/schemas/dashboard";

describe("ScopeSchema", () => {
  it("유효한 scope 값을 통과시킨다", () => {
    expect(ScopeSchema.parse("scope1")).toBe("scope1");
    expect(ScopeSchema.parse("scope2")).toBe("scope2");
    expect(ScopeSchema.parse("scope3")).toBe("scope3");
  });

  it("유효하지 않은 값은 ZodError를 throw한다", () => {
    expect(() => ScopeSchema.parse("scope4")).toThrow();
  });
});

describe("DataStatusSchema", () => {
  it("모든 유효한 상태를 통과시킨다", () => {
    const valid = ["verified", "estimated", "pending", "missing", "ai_anomaly"];
    valid.forEach((s) => expect(DataStatusSchema.parse(s)).toBe(s));
  });
});

describe("ChartDataPointSchema", () => {
  it("name과 value가 있으면 통과한다", () => {
    const data = ChartDataPointSchema.parse({ name: "Jan", value: 100 });
    expect(data.name).toBe("Jan");
    expect(data.value).toBe(100);
  });

  it("name이 없으면 ZodError를 throw한다", () => {
    expect(() => ChartDataPointSchema.parse({ value: 100 })).toThrow();
  });
});

describe("EmissionSummarySchema", () => {
  it("유효한 데이터를 통과시킨다", () => {
    const data = EmissionSummarySchema.parse({
      totalMtCO2e: 1234.5,
      scope1: 400,
      scope2: 300,
      scope3: 534.5,
      period: "2024",
      yoyChangePercent: -5.2,
    });
    expect(data.totalMtCO2e).toBe(1234.5);
    expect(data.period).toBe("2024");
  });

  it("필수 필드가 없으면 ZodError를 throw한다", () => {
    expect(() =>
      EmissionSummarySchema.parse({ totalMtCO2e: 1234.5 })
    ).toThrow();
  });
});

describe("DashboardKpiItemSchema", () => {
  it("필수 필드가 있으면 통과한다", () => {
    const data = DashboardKpiItemSchema.parse({
      id: "k1",
      label: "탄소 배출량",
      value: "1,234",
      trendText: "+2.1%",
    });
    expect(data.id).toBe("k1");
    expect(data.trendText).toBe("+2.1%");
  });

  it("id가 없으면 ZodError를 throw한다", () => {
    expect(() =>
      DashboardKpiItemSchema.parse({ label: "테스트", value: "0", trendText: "" })
    ).toThrow();
  });
});
