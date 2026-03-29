"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Layers } from "lucide-react";
import type { ScopeCategoryId } from "@/types/scope1";

/* ── 타입 ── */
interface FacilityEmission {
  id: string;
  name: string;
  fuel: string;
  unit: string;
  monthly: number[]; // 12 months of emission values (tCO2e)
  total: number;
}

interface CategoryEmission {
  categoryId: ScopeCategoryId;
  label: string;
  monthly: number[]; // 12 months aggregated
  total: number;
  facilityCount: number;
}

interface YearComparison {
  year: string;
  monthly: number[]; // 12 months aggregated
  total: number;
}

export interface FacilityComparisonDashboardProps {
  /** 현재 카테고리 시설들의 배출량 */
  facilities: FacilityEmission[];
  /** 전체 카테고리별 배출량 (고정/이동/비가스) */
  categories: CategoryEmission[];
  /** 연도별 비교 데이터 (최대 3년) */
  yearComparisons: YearComparison[];
  /** 현재 선택 연도 */
  currentYear: string;
  /** 현재 선택 카테고리 */
  currentCategoryId: ScopeCategoryId;
}

/* ── 색상 팔레트 ── */
const FACILITY_COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#84cc16",
];

const CATEGORY_COLORS: Record<string, string> = {
  fixed: "#10b981",
  mobile: "#3b82f6",
  fugitive: "#f59e0b",
};

const YEAR_COLORS = ["#10b981", "#94a3b8", "#d1d5db"];

const MONTH_LABELS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

type ViewTab = "facility" | "category" | "yoy";

function fmt(v: number, d = 2): string {
  return v.toLocaleString("ko-KR", { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function FacilityComparisonDashboard({
  facilities,
  categories,
  yearComparisons,
  currentYear,
  currentCategoryId,
}: FacilityComparisonDashboardProps) {
  const [viewTab, setViewTab] = useState<ViewTab>("yoy");

  const grandTotal = useMemo(
    () => facilities.reduce((s, f) => s + f.total, 0),
    [facilities],
  );

  /* ── 시설별 Stacked Bar 데이터 ── */
  const stackedBarData = useMemo(() => {
    return MONTH_LABELS.map((label, mi) => {
      const row: Record<string, string | number> = { month: label };
      facilities.forEach((f) => {
        row[f.name] = Math.round((f.monthly[mi] ?? 0) * 1000) / 1000;
      });
      return row;
    });
  }, [facilities]);

  /* ── 시설 랭킹 (비중 순) ── */
  const facilityRanking = useMemo(() => {
    return [...facilities]
      .sort((a, b) => b.total - a.total)
      .map((f) => ({
        ...f,
        percent: grandTotal > 0 ? (f.total / grandTotal) * 100 : 0,
      }));
  }, [facilities, grandTotal]);

  /* ── 도넛 차트 데이터 ── */
  const donutData = useMemo(() => {
    return facilityRanking.map((f, i) => ({
      name: f.name,
      value: Math.round(f.total * 100) / 100,
      color: FACILITY_COLORS[i % FACILITY_COLORS.length],
    }));
  }, [facilityRanking]);

  /* ── 카테고리 비교 Bar 데이터 ── */
  const categoryBarData = useMemo(() => {
    return MONTH_LABELS.map((label, mi) => {
      const row: Record<string, string | number> = { month: label };
      categories.forEach((c) => {
        row[c.label] = Math.round((c.monthly[mi] ?? 0) * 1000) / 1000;
      });
      return row;
    });
  }, [categories]);

  const categoryTotal = useMemo(
    () => categories.reduce((s, c) => s + c.total, 0),
    [categories],
  );

  /* ── YoY 비교 Line 데이터 ── */
  const yoyLineData = useMemo(() => {
    return MONTH_LABELS.map((label, mi) => {
      const row: Record<string, string | number> = { month: label };
      yearComparisons.forEach((yc) => {
        row[yc.year] = Math.round((yc.monthly[mi] ?? 0) * 1000) / 1000;
      });
      return row;
    });
  }, [yearComparisons]);

  const TABS: { key: ViewTab; label: string }[] = [
    { key: "yoy", label: "전년도 대비" },
    { key: "facility", label: "시설별 비교" },
    { key: "category", label: "카테고리별 비교" },
  ];

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              Scope 1 통합 비교 분석
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              시설별 · 카테고리별 · 전년도 대비 배출량을 비교합니다
            </p>
          </div>
          {/* 뷰 탭 */}
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/50 p-0.5">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setViewTab(t.key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  viewTab === t.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pb-5">
        {/* ═══════════ TAB 1: 시설별 비교 ═══════════ */}
        {viewTab === "facility" && (
          <>
            {facilities.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                현재 카테고리에 등록된 시설이 없습니다.
              </div>
            ) : (
              <>
                {/* Stacked Bar Chart */}
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    월별 시설별 배출량 (Stacked)
                  </p>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stackedBarData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={50} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        formatter={(value: number) => [`${fmt(value)} tCO₂e`]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                        iconType="circle"
                        iconSize={8}
                      />
                      {facilities.map((f, i) => (
                        <Bar
                          key={f.id}
                          dataKey={f.name}
                          stackId="a"
                          fill={FACILITY_COLORS[i % FACILITY_COLORS.length]}
                          radius={i === facilities.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 랭킹 테이블 + 도넛 */}
                <div className="grid gap-4 lg:grid-cols-[1fr,240px]">
                  {/* 랭킹 테이블 */}
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground w-8">#</th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">시설명</th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">연료</th>
                          <th className="px-3 py-2 text-right font-medium text-muted-foreground">연간 배출량</th>
                          <th className="px-3 py-2 text-right font-medium text-muted-foreground">비중</th>
                          <th className="px-3 py-2 font-medium text-muted-foreground w-28">추이</th>
                        </tr>
                      </thead>
                      <tbody>
                        {facilityRanking.map((f, i) => {
                          const color = FACILITY_COLORS[i % FACILITY_COLORS.length];
                          const maxM = Math.max(...f.monthly, 0.001);
                          return (
                            <tr key={f.id} className="border-b border-border/50 hover:bg-muted/20">
                              <td className="px-3 py-2 font-medium text-muted-foreground">{i + 1}</td>
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                  <span className="font-medium text-foreground">{f.name}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">{f.fuel}</td>
                              <td className="px-3 py-2 text-right font-medium tabular-nums">{fmt(f.total)} t</td>
                              <td className="px-3 py-2 text-right tabular-nums">{fmt(f.percent, 1)}%</td>
                              <td className="px-3 py-2">
                                {/* 스파크라인 */}
                                <svg viewBox="0 0 100 24" className="h-5 w-full">
                                  <polyline
                                    fill="none"
                                    stroke={color}
                                    strokeWidth="1.8"
                                    strokeLinejoin="round"
                                    strokeLinecap="round"
                                    points={f.monthly
                                      .map((v, mi) => `${(mi / 11) * 100},${24 - (v / maxM) * 20}`)
                                      .join(" ")}
                                  />
                                </svg>
                              </td>
                            </tr>
                          );
                        })}
                        {/* 합계 행 */}
                        <tr className="bg-muted/30 font-semibold">
                          <td className="px-3 py-2" />
                          <td className="px-3 py-2 text-foreground">합계</td>
                          <td className="px-3 py-2" />
                          <td className="px-3 py-2 text-right tabular-nums">{fmt(grandTotal)} t</td>
                          <td className="px-3 py-2 text-right">100%</td>
                          <td className="px-3 py-2" />
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 도넛 차트 */}
                  <div className="flex flex-col items-center justify-center">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">시설별 비중</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {donutData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 8,
                            fontSize: 11,
                          }}
                          formatter={(value: number) => [`${fmt(value)} tCO₂e`]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <p className="text-center text-[11px] text-muted-foreground">
                      총 <span className="font-semibold text-foreground">{fmt(grandTotal)}</span> tCO₂e
                    </p>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ═══════════ TAB 2: 카테고리별 비교 ═══════════ */}
        {viewTab === "category" && (
          <>
            {/* 카테고리 요약 카드 */}
            <div className="grid grid-cols-3 gap-3">
              {categories.map((c) => {
                const pct = categoryTotal > 0 ? (c.total / categoryTotal) * 100 : 0;
                const isActive = c.categoryId === currentCategoryId;
                return (
                  <div
                    key={c.categoryId}
                    className={cn(
                      "rounded-lg border p-3 transition-all",
                      isActive ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20" : "border-border"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[c.categoryId] }}
                      />
                      <span className="text-xs font-semibold text-foreground">{c.label}</span>
                      {isActive && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">현재</span>
                      )}
                    </div>
                    <div className="mt-2">
                      <span className="text-lg font-bold tabular-nums text-foreground">{fmt(c.total)}</span>
                      <span className="ml-1 text-xs text-muted-foreground">tCO₂e</span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{c.facilityCount}개 시설</span>
                      <span className="font-medium">{fmt(pct, 1)}%</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: CATEGORY_COLORS[c.categoryId] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 카테고리 Grouped Bar Chart */}
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">월별 카테고리별 배출량</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={categoryBarData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [`${fmt(value)} tCO₂e`]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} />
                  {categories.map((c) => (
                    <Bar
                      key={c.categoryId}
                      dataKey={c.label}
                      fill={CATEGORY_COLORS[c.categoryId]}
                      radius={[3, 3, 0, 0]}
                      barSize={20}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 카테고리 비중 도넛 */}
            <div className="flex items-center justify-center gap-8">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={categories.map((c) => ({
                      name: c.label,
                      value: Math.round(c.total * 100) / 100,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {categories.map((c) => (
                      <Cell key={c.categoryId} fill={CATEGORY_COLORS[c.categoryId]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    formatter={(value: number) => [`${fmt(value)} tCO₂e`]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {categories.map((c) => {
                  const pct = categoryTotal > 0 ? (c.total / categoryTotal) * 100 : 0;
                  return (
                    <div key={c.categoryId} className="flex items-center gap-3 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[c.categoryId] }} />
                      <span className="w-16 font-medium text-foreground">{c.label}</span>
                      <span className="tabular-nums text-muted-foreground">{fmt(c.total)} t</span>
                      <span className="tabular-nums font-medium text-foreground">{fmt(pct, 1)}%</span>
                    </div>
                  );
                })}
                <div className="border-t border-border pt-2 flex items-center gap-3 text-xs font-semibold">
                  <span className="h-2.5 w-2.5 shrink-0" />
                  <span className="w-16">합계</span>
                  <span className="tabular-nums">{fmt(categoryTotal)} t</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══════════ TAB 3: 전년도 대비 ═══════════ */}
        {viewTab === "yoy" && (
          <>
            {yearComparisons.length < 2 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                전년도 비교 데이터가 부족합니다. 2개 이상 연도의 데이터가 필요합니다.
              </div>
            ) : (
              <>
                {/* YoY 요약 카드 */}
                <div className="grid grid-cols-3 gap-3">
                  {yearComparisons.slice(0, 3).map((yc, i) => {
                    const prevTotal = yearComparisons[i + 1]?.total;
                    const change = prevTotal && prevTotal > 0
                      ? ((yc.total - prevTotal) / prevTotal) * 100
                      : null;
                    return (
                      <div
                        key={yc.year}
                        className={cn(
                          "rounded-lg border p-3",
                          i === 0 ? "border-primary/50 bg-primary/5" : "border-border"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground">
                            {yc.year}년
                            {i === 0 && <span className="ml-1.5 text-[10px] font-normal text-primary">(현재)</span>}
                          </span>
                          {change !== null && (
                            <div className={cn(
                              "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                              change < 0
                                ? "bg-green-50 text-carbon-success"
                                : change > 0
                                  ? "bg-destructive/10 text-carbon-danger"
                                  : "bg-muted text-muted-foreground"
                            )}>
                              {change < 0 ? <TrendingDown className="h-3 w-3" /> :
                               change > 0 ? <TrendingUp className="h-3 w-3" /> :
                               <Minus className="h-3 w-3" />}
                              {change > 0 ? "+" : ""}{fmt(change, 1)}%
                            </div>
                          )}
                        </div>
                        <div className="mt-2">
                          <span className="text-lg font-bold tabular-nums text-foreground">{fmt(yc.total)}</span>
                          <span className="ml-1 text-xs text-muted-foreground">tCO₂e</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* YoY Line Chart */}
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">연도별 월간 배출량 추이</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={yoyLineData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={50} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        formatter={(value: number, name: string) => [`${fmt(value)} tCO₂e`, `${name}년`]}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="line" />
                      {yearComparisons.map((yc, i) => (
                        <Line
                          key={yc.year}
                          type="monotone"
                          dataKey={yc.year}
                          name={yc.year}
                          stroke={YEAR_COLORS[i % YEAR_COLORS.length]}
                          strokeWidth={i === 0 ? 2.5 : 1.5}
                          strokeDasharray={i > 0 ? "5 3" : undefined}
                          dot={i === 0 ? { r: 3.5, fill: "#fff", strokeWidth: 2 } : false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* 월별 증감 테이블 */}
                {yearComparisons.length >= 2 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      월별 전년 대비 증감 ({yearComparisons[0].year} vs {yearComparisons[1].year})
                    </p>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border bg-muted/50">
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground sticky left-0 bg-muted/50">연도</th>
                              {MONTH_LABELS.map((m) => (
                                <th key={m} className="px-2 py-2 text-center font-medium text-muted-foreground">{m}</th>
                              ))}
                              <th className="px-3 py-2 text-right font-medium text-muted-foreground">합계</th>
                            </tr>
                          </thead>
                          <tbody>
                            {yearComparisons.slice(0, 2).map((yc, i) => (
                              <tr key={yc.year} className="border-b border-border/50">
                                <td className={cn("px-3 py-2 font-medium sticky left-0", i === 0 ? "text-foreground bg-card" : "text-muted-foreground bg-card")}>
                                  {yc.year}
                                </td>
                                {yc.monthly.map((v, mi) => (
                                  <td key={mi} className="px-2 py-2 text-center tabular-nums">{fmt(v)}</td>
                                ))}
                                <td className="px-3 py-2 text-right font-semibold tabular-nums">{fmt(yc.total)}</td>
                              </tr>
                            ))}
                            {/* 증감 행 */}
                            <tr className="bg-muted/30 font-medium">
                              <td className="px-3 py-2 sticky left-0 bg-muted/30 text-muted-foreground">증감</td>
                              {yearComparisons[0].monthly.map((v, mi) => {
                                const diff = v - (yearComparisons[1].monthly[mi] ?? 0);
                                return (
                                  <td
                                    key={mi}
                                    className={cn(
                                      "px-2 py-2 text-center tabular-nums",
                                      diff < 0 ? "text-carbon-success" : diff > 0 ? "text-carbon-danger" : "text-muted-foreground"
                                    )}
                                  >
                                    {diff > 0 ? "+" : ""}{fmt(diff)}
                                  </td>
                                );
                              })}
                              <td className={cn(
                                "px-3 py-2 text-right font-bold tabular-nums",
                                (yearComparisons[0].total - yearComparisons[1].total) < 0 ? "text-carbon-success" : "text-carbon-danger"
                              )}>
                                {(yearComparisons[0].total - yearComparisons[1].total) > 0 ? "+" : ""}
                                {fmt(yearComparisons[0].total - yearComparisons[1].total)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
