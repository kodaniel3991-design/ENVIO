"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getReductionProgressKpis,
  getReductionScopeSummary,
} from "@/services/api";
import { PageHeader } from "@/components/layout/page-header";
import { ReductionSubNav } from "@/components/reduction/reduction-sub-nav";
import { ReductionKpiCards } from "@/components/reduction/reduction-kpi-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReductionProgressPage() {
  const { data: kpis, isLoading: kpiLoading } = useQuery({
    queryKey: ["reduction-kpis"],
    queryFn: getReductionProgressKpis,
  });
  const { data: scopeSummary } = useQuery({
    queryKey: ["reduction-scope-summary"],
    queryFn: getReductionScopeSummary,
  });

  return (
    <>
      <PageHeader
        title="진행 현황"
        description="감축 목표 대비 현재 진행 현황을 추적합니다."
      >
        <ReductionSubNav />
      </PageHeader>
      <div className="mt-8 space-y-8">
        <ReductionKpiCards items={kpis ?? []} isLoading={kpiLoading} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scope별 감축 성과</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            {scopeSummary?.map((row: any) => (
              <p key={row.scope}>
                {row.scope.toUpperCase()}: 기준 {row.baselineMt.toFixed(1)} →
                감축 {row.reducedMt.toFixed(1)} MtCO₂e
              </p>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

