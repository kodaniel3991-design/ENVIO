"use client";

import { useQuery } from "@tanstack/react-query";
import { X, Download, Flame, Zap, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatNumber } from "@/lib/utils";
import {
  ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from "recharts";

const SCOPE_COLORS = {
  scope1: "hsl(var(--taupe-400))",
  scope2: "hsl(var(--carbon-success))",
  scope3: "hsl(var(--taupe-300))",
};

const SCOPE_ICONS = {
  1: Flame,
  2: Zap,
  3: Package,
};

interface EmissionReportModalProps {
  open: boolean;
  onClose: () => void;
  year: number;
  scope?: string; // "all" | "1" | "2" | "3"
  title?: string;
}

export function EmissionReportModal({ open, onClose, year, scope = "all", title }: EmissionReportModalProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["emission-report", year, scope],
    queryFn: async () => {
      const res = await fetch(`/api/environment/report?year=${year}&scope=${scope}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: open,
  });

  if (!open) return null;

  const bd = data?.scopeBreakdown ?? { scope1: 0, scope2: 0, scope3: 0, total: 0 };
  const trend = data?.monthlyTrend ?? [];
  const details = data?.facilityDetails ?? [];

  return (
    <>
      {/* backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* modal */}
      <div className="fixed inset-4 z-50 flex items-start justify-center overflow-y-auto pt-8 pb-8">
        <div className="w-full max-w-4xl rounded-xl border border-border bg-card shadow-xl">
          {/* header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {title ?? "배출량 상세 레포트"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {year}년 · {scope === "all" ? "Scope 1+2+3 합산" : `Scope ${scope}`}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">데이터 로딩 중...</div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Scope 요약 카드 */}
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  { key: "total", label: "총 배출량", value: bd.total, color: "bg-primary/10 text-primary" },
                  { key: "scope1", label: "Scope 1", value: bd.scope1, color: "bg-taupe-50 text-taupe-500" },
                  { key: "scope2", label: "Scope 2", value: bd.scope2, color: "bg-green-50 text-carbon-success" },
                  { key: "scope3", label: "Scope 3", value: bd.scope3, color: "bg-taupe-50/70 text-taupe-400" },
                ].map((item) => (
                  <div key={item.key} className={cn("rounded-lg border border-border p-3", item.color)}>
                    <p className="text-[11px] font-medium opacity-70">{item.label}</p>
                    <p className="mt-1 text-lg font-bold tabular-nums">{formatNumber(item.value, 2)}</p>
                    <p className="text-[10px] opacity-60">tCO₂e</p>
                  </div>
                ))}
              </div>

              {/* 월별 추이 차트 */}
              <div className="rounded-lg border border-border p-4">
                <h3 className="text-sm font-medium text-foreground mb-3">월별 배출량 추이</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={45} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                          fontSize: 12,
                        }}
                        formatter={(value: number) => [`${formatNumber(value, 4)} tCO₂e`]}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="scope1" name="Scope 1" fill={SCOPE_COLORS.scope1} stackId="a" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="scope2" name="Scope 2" fill={SCOPE_COLORS.scope2} stackId="a" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="scope3" name="Scope 3" fill={SCOPE_COLORS.scope3} stackId="a" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 시설별 상세 테이블 */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="border-b border-border px-4 py-2.5 bg-muted/30">
                  <h3 className="text-sm font-medium text-foreground">배출원별 상세 내역 ({details.length}건)</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-muted/50">
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="px-3 py-2 text-left font-medium">Scope</th>
                        <th className="px-3 py-2 text-left font-medium">카테고리</th>
                        <th className="px-3 py-2 text-left font-medium">배출시설</th>
                        <th className="px-3 py-2 text-left font-medium">연료/에너지</th>
                        <th className="px-3 py-2 text-right font-medium">활동량</th>
                        <th className="px-3 py-2 text-right font-medium">배출계수</th>
                        <th className="px-3 py-2 text-right font-medium">배출량 (tCO₂e)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                            해당 기간에 입력된 배출 데이터가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        details.map((d: any) => {
                          const ScopeIcon = SCOPE_ICONS[d.scope as 1 | 2 | 3] ?? Package;
                          return (
                            <tr key={d.id} className="border-b border-border/50 hover:bg-muted/20">
                              <td className="px-3 py-2">
                                <span className="inline-flex items-center gap-1">
                                  <ScopeIcon className="h-3 w-3" />
                                  S{d.scope}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">{d.categoryName}</td>
                              <td className="px-3 py-2 font-medium">{d.facilityName}</td>
                              <td className="px-3 py-2 text-muted-foreground">{d.fuelType}</td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {formatNumber(d.activityValue, 2)} <span className="text-muted-foreground">{d.activityUnit}</span>
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                                {d.emissionFactor > 0 ? d.emissionFactor.toExponential(3) : "-"}
                              </td>
                              <td className="px-3 py-2 text-right font-medium tabular-nums">
                                {formatNumber(d.totalEmissions, 4)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {details.length > 0 && (
                      <tfoot>
                        <tr className="border-t border-border bg-muted/30 font-medium">
                          <td colSpan={6} className="px-3 py-2 text-right">합계</td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {formatNumber(bd.total, 4)} tCO₂e
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* footer */}
          <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-3">
            <Button variant="outline" size="sm" onClick={onClose}>
              닫기
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
