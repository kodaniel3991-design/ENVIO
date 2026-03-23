"use client";

import { useQuery } from "@tanstack/react-query";
import { getKpiPerformance } from "@/services/api";
import { PageHeader } from "@/components/layout/page-header";
import { KpiSubNav } from "@/components/kpi/kpi-sub-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function KpiPerformancePage() {
  const { data: list, isLoading } = useQuery({ queryKey: ["kpi-performance"], queryFn: () => getKpiPerformance() });
  return (
    <>
      <PageHeader title="KPI 실적관리" description="기간별 KPI 실적을 입력하고 관리합니다.">
        <KpiSubNav />
      </PageHeader>
      <div className="mt-8">
        <Card>
          <CardHeader><CardTitle className="text-base">실적 목록</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-40 w-full rounded-lg" /> : list && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/50 text-left"><th className="px-4 py-3 font-medium">KPI</th><th className="px-4 py-3 font-medium">기간</th><th className="px-4 py-3 text-right">실제값</th><th className="px-4 py-3">수정일</th></tr></thead>
                  <tbody>
                    {list.map((r) => (
                      <tr key={r.id} className="border-b border-border/50">
                        <td className="px-4 py-3 font-medium">{r.kpiName}</td>
                        <td className="px-4 py-3">{r.period}</td>
                        <td className="px-4 py-3 text-right">{String(r.actualValue)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.updatedAt.slice(0,10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
