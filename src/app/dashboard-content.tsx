"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { TrendingUp, TrendingDown, ArrowRight, CircleDot, Leaf, Database, Target, Network } from "lucide-react";
import { cn } from "@/lib/utils";

const CarbonFootprintChart = dynamic(
  () =>
    import("@/components/dashboard/carbon-footprint-chart").then((m) => ({
      default: m.CarbonFootprintChart,
    })),
  { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-lg" /> }
);

// ── 헬퍼 ─────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
}

function TrendBadge({ dir, value }: { dir?: string; value?: string }) {
  const up = dir === "up";
  return (
    <span className={cn("flex items-center gap-0.5 text-xs font-medium", up ? "text-destructive" : "text-carbon-success")}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {value}
    </span>
  );
}

// ── Scope 배출량 카드 ──────────────────────────────────
function ScopeCard({
  label,
  tCO2e,
  pct,
  trend,
  color,
  isLoading,
}: {
  label: string;
  tCO2e: number;
  pct: number;
  trend: "up" | "down";
  color: string;
  isLoading: boolean;
}) {
  if (isLoading) return <Skeleton className="h-28 rounded-xl" />;
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{label} 배출량</span>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-foreground">{fmt(tCO2e)}</span>
        <span className="mb-0.5 text-xs text-muted-foreground">tCO₂e</span>
        <TrendBadge dir={trend} value={`${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`} />
      </div>
      <div className="h-1 w-full rounded-full bg-muted">
        <div className="h-1 rounded-full animate-bar" style={{ width: `${Math.min(pct * 10 + 50, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

// ── 데이터 수집 요약 테이블 ────────────────────────────
function DataSummaryTable({ data }: { data: { scope: string; rate: number; pending: number; needed: number }[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
      <span className="text-sm font-semibold text-foreground">데이터 수집 요약</span>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th className="pb-2 text-left font-medium">구분</th>
            <th className="pb-2 text-right font-medium">완료율</th>
            <th className="pb-2 text-right font-medium">전항 과기</th>
            <th className="pb-2 text-right font-medium">행항 만료</th>
            <th className="pb-2 text-right font-medium">응 가수</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row) => (
            <tr key={row.scope}>
              <td className="py-1.5 font-medium">{row.scope}</td>
              <td className="py-1.5 text-right font-semibold text-carbon-success">{row.rate}%</td>
              <td className="py-1.5 text-right text-muted-foreground">{row.pending > 0 ? row.pending : "–"}</td>
              <td className="py-1.5 text-right text-muted-foreground">{row.needed > 0 ? row.needed : "–"}</td>
              <td className="py-1.5 text-right text-muted-foreground">{row.rate > 0 ? Math.round(row.rate / 5) : 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link href="/data" className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline">
        협력사 관리 <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

// ── 공급망 참여 현황 ───────────────────────────────────
function SupplyChainCard({
  vendors,
  isLoading,
}: {
  vendors: { id: string; vendorName: string; emissionsKg: number; trendDirection: string }[];
  isLoading: boolean;
}) {
  if (isLoading) return <Skeleton className="h-40 rounded-xl" />;
  const max = Math.max(...vendors.map((v) => v.emissionsKg), 1);
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">공급망 참여 현황</span>
        <Link href="/scope3/vendors" className="text-xs text-primary hover:underline">협력사 관리 &gt;</Link>
      </div>
      <div className="flex flex-col gap-2">
        {vendors.slice(0, 4).map((v) => (
          <div key={v.id} className="flex items-center gap-2">
            <span className="w-20 truncate text-xs text-foreground">{v.vendorName}</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-2 rounded-full bg-primary/60 animate-bar"
                style={{ width: `${(v.emissionsKg / max) * 100}%` }}
              />
            </div>
            <span className="w-8 text-right text-xs text-muted-foreground">
              {v.emissionsKg > 0 ? v.emissionsKg.toFixed(0) : "–"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 공급량 카드 ────────────────────────────────────────
function SupplyEmissionsCard({
  vendors,
  isLoading,
}: {
  vendors: { id: string; vendorName: string; emissionsKg: number; trendDirection: string }[];
  isLoading: boolean;
}) {
  if (isLoading) return <Skeleton className="h-40 rounded-xl" />;
  const total = vendors.reduce((s, v) => s + v.emissionsKg, 0);
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">공급망</span>
        <Link href="/scope3" className="text-xs text-primary hover:underline">협력사 관리 &gt;</Link>
      </div>
      <div className="flex flex-col gap-2">
        {vendors.slice(0, 3).map((v) => {
          const pct = total > 0 ? (v.emissionsKg / total) * 100 : 0;
          const up = v.trendDirection === "up";
          return (
            <div key={v.id} className="flex items-center gap-2">
              <CircleDot className={cn("h-3 w-3 shrink-0", up ? "text-carbon-success" : "text-muted-foreground")} />
              <span className="flex-1 truncate text-xs text-foreground">{v.vendorName}</span>
              <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-1.5 rounded-full bg-primary/50 animate-bar" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-12 text-right text-xs font-medium text-foreground">
                {pct.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 메인 대시보드 ──────────────────────────────────────
export function DashboardContent() {
  const {
    kpisQuery,
    trendQuery,
    scopeDonutQuery,
    topVendorsQuery,
  } = useDashboardData();

  const scopeData = scopeDonutQuery.data ?? [];
  const scopeLoading = scopeDonutQuery.isLoading;
  const trendData = trendQuery.data ?? [];
  const trendLoading = trendQuery.isLoading;
  const topVendors = topVendorsQuery.data ?? [];
  const vendorsLoading = topVendorsQuery.isLoading;
  const kpis = kpisQuery.data ?? [];
  const kpisLoading = kpisQuery.isLoading;

  const scope1 = scopeData.find((s) => s.name === "Scope 1");
  const scope2 = scopeData.find((s) => s.name === "Scope 2");
  const scope3 = scopeData.find((s) => s.name === "Scope 3");
  const totalTco2e = (scope1?.tCO2e ?? 0) + (scope2?.tCO2e ?? 0) + (scope3?.tCO2e ?? 0);

  const dataRows = [
    { scope: "Scope 1", rate: 98, pending: 0, needed: 2 },
    { scope: "Scope 2", rate: 92, pending: 2, needed: 2 },
    { scope: "Scope 3", rate: 42, pending: 21, needed: 18 },
  ];

  return (
    <div className="flex h-full gap-4 min-h-0">
      {/* ── 좌측 메인 영역 ── */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">

        {/* ESG 현황 — Stat Cards Clean Minimal */}
        <div className="grid grid-cols-4 gap-4 animate-fade-up">
          {/* ESG 점수 */}
          <div className="overflow-hidden rounded-xl border border-border/80 bg-card p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-green-50 text-carbon-success">
                <Leaf className="h-5 w-5" />
              </div>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-50 text-carbon-success">
                ↑ 3.5%
              </span>
            </div>
            <p className="mt-3 text-xs font-medium text-muted-foreground">ESG 점수</p>
            <div className="mt-1 flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-[28px] font-bold tracking-[-0.04em] text-foreground animate-count">82</span>
                <span className="text-sm font-medium text-muted-foreground">점</span>
              </div>
              <div className="flex gap-2 text-[12px] font-medium">
                <span className="text-green-500">E 85</span>
                <span className="text-taupe-400">S 76</span>
                <span className="text-taupe-300">G 84</span>
              </div>
            </div>
            <div className="mt-2 h-1 w-full rounded-full bg-muted">
              <div className="h-full rounded-full bg-carbon-success animate-bar" style={{ width: "82%" }} />
            </div>
          </div>

          {/* 데이터 수집 완료율 */}
          <div className="overflow-hidden rounded-xl border border-border/80 bg-card p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-navy-50 text-navy-500">
                <Database className="h-5 w-5" />
              </div>
              {!scopeLoading && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-50 text-carbon-success">
                  ↑ 5.4%
                </span>
              )}
            </div>
            <p className="mt-3 text-xs font-medium text-muted-foreground">데이터 수집 완료율</p>
            {scopeLoading ? <Skeleton className="mt-1 h-8 w-20" /> : (
              <>
                <div className="mt-1 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-[28px] font-bold tracking-[-0.04em] text-foreground">83</span>
                    <span className="text-sm font-medium text-muted-foreground">%</span>
                  </div>
                  <span className="text-[12px] font-medium text-muted-foreground">57 / 69 항목</span>
                </div>
                <div className="mt-2 h-1 w-full rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary animate-bar" style={{ width: "83%" }} />
                </div>
              </>
            )}
          </div>

          {/* 목표 KPI 달성률 */}
          <div className="overflow-hidden rounded-xl border border-border/80 bg-card p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-green-50 text-carbon-success">
                <Target className="h-5 w-5" />
              </div>
              {!kpisLoading && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-50 text-carbon-success">
                  ↑ 3.2%
                </span>
              )}
            </div>
            <p className="mt-3 text-xs font-medium text-muted-foreground">목표 KPI 달성률</p>
            {kpisLoading ? <Skeleton className="mt-1 h-8 w-16" /> : (
              <>
                <div className="mt-1 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-[28px] font-bold tracking-[-0.04em] text-foreground">74</span>
                    <span className="text-sm font-medium text-muted-foreground">%</span>
                  </div>
                  <span className="text-[12px] font-medium text-muted-foreground">9 / 12 KPI</span>
                </div>
                <div className="mt-2 h-1 w-full rounded-full bg-muted">
                  <div className="h-full rounded-full bg-carbon-success animate-bar" style={{ width: "74%" }} />
                </div>
              </>
            )}
          </div>

          {/* 참여사 감이율 */}
          <div className="overflow-hidden rounded-xl border border-border/80 bg-card p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-taupe-50 text-carbon-warning">
                <Network className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-xs font-medium text-muted-foreground">참여사 감이율</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-display text-[28px] font-bold tracking-[-0.04em] text-foreground">71</span>
              <span className="text-sm font-medium text-muted-foreground">%</span>
            </div>
            <div className="mt-3 h-1 w-full rounded-full bg-muted">
              <div className="h-full rounded-full bg-carbon-warning animate-bar" style={{ width: "71%" }} />
            </div>
          </div>
        </div>

        {/* Scope 1 / 2 / 3 배출량 카드 */}
        <div className="grid grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <ScopeCard
            label="Scope 1"
            tCO2e={scope1?.tCO2e ?? 8245}
            pct={1.8}
            trend="up"
            color="hsl(var(--taupe-400))"
            isLoading={scopeLoading}
          />
          <ScopeCard
            label="Scope 2"
            tCO2e={scope2?.tCO2e ?? 14287}
            pct={3.2}
            trend="up"
            color="hsl(var(--carbon-success))"
            isLoading={scopeLoading}
          />
          <ScopeCard
            label="Scope 3"
            tCO2e={scope3?.tCO2e ?? 52841}
            pct={2.4}
            trend="up"
            color="hsl(var(--taupe-300))"
            isLoading={scopeLoading}
          />
        </div>

        {/* 주요 ESG KPI 현황 + 데이터 수집 요약 */}
        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0 animate-fade-up" style={{ animationDelay: "0.3s" }}>
          {/* KPI 현황 */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 overflow-auto">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">주요 ESG KPI 현황</span>
              <Link href="/kpi" className="text-xs text-primary hover:underline">자세히 보기</Link>
            </div>
            {kpisLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
              </div>
            ) : kpis.length === 0 ? (
              <p className="text-xs text-muted-foreground">등록된 KPI가 없습니다.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {kpis.slice(0, 3).map((kpi) => (
                  <div key={kpi.id} className="overflow-hidden rounded-lg border border-border/80 p-3 flex flex-col gap-1 transition-all hover:shadow-md hover:-translate-y-0.5">
                    <span className="text-[10px] text-muted-foreground truncate">{kpi.label}</span>
                    <span className="font-display text-lg font-bold tracking-[-0.04em] text-foreground">{kpi.value}</span>
                    <span className="text-[10px] text-muted-foreground">{kpi.subLabel}</span>
                    <div className="mt-1 h-1 w-full rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary/60" style={{ width: "60%" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 데이터 수집 요약 */}
          <DataSummaryTable data={dataRows} />
        </div>
      </div>

      {/* ── 우측 패널 ── */}
      <div className="flex w-96 shrink-0 flex-col gap-4">
        {/* 합산 배출량 추이 */}
        <div className="min-h-[220px] flex flex-col">
          <div className="rounded-xl border border-border bg-card px-4 pt-3 pb-1 mb-1">
            <span className="text-sm font-semibold text-foreground">합산 배출량 추이</span>
          </div>
          <div className="flex-1 min-h-0">
            <CarbonFootprintChart
              data={trendData}
              totalLabel={`${fmt(totalTco2e)} tCO₂e`}
              isLoading={trendLoading}
              fillHeight
            />
          </div>
        </div>

        {/* 공급망 참여 현황 */}
        <SupplyChainCard vendors={topVendors} isLoading={vendorsLoading} />

        {/* 공급망 */}
        <SupplyEmissionsCard vendors={topVendors} isLoading={vendorsLoading} />
      </div>
    </div>
  );
}
