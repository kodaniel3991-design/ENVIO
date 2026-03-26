"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getReductionProgressKpis,
  getReductionOpportunities,
  getReductionProjects,
  getReductionScopeSummary,
} from "@/services/api";
import { PageHeader } from "@/components/layout/page-header";
import { ReductionSubNav } from "@/components/reduction/reduction-sub-nav";
import { ReductionKpiCards } from "@/components/reduction/reduction-kpi-cards";
import { ReductionOpportunityTable } from "@/components/reduction/reduction-opportunity-table";
import { ReductionProjectTable } from "@/components/reduction/reduction-project-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReductionHubDashboardPage() {
  const { data: kpis, isLoading: kpiLoading } = useQuery({
    queryKey: ["reduction-kpis"],
    queryFn: getReductionProgressKpis,
  });
  const { data: opps, isLoading: oppLoading } = useQuery({
    queryKey: ["reduction-opportunities"],
    queryFn: getReductionOpportunities,
  });
  const { data: projects, isLoading: projLoading } = useQuery({
    queryKey: ["reduction-projects"],
    queryFn: getReductionProjects,
  });
  const { data: scopeSummary } = useQuery({
    queryKey: ["reduction-scope-summary"],
    queryFn: getReductionScopeSummary,
  });

  return (
    <>
      <PageHeader
        title="감축 허브 대시보드"
        description="감축 아이디어·시나리오·프로젝트를 한 곳에서 관리합니다."
      >
        <ReductionSubNav />
      </PageHeader>

      <div className="mt-8 space-y-8">
        <ReductionKpiCards items={kpis ?? []} isLoading={kpiLoading} />

        <div className="grid gap-8 lg:grid-cols-2">
          <ReductionOpportunityTable
            data={opps ?? []}
            isLoading={oppLoading}
          />
          <ReductionProjectTable
            data={projects ?? []}
            isLoading={projLoading}
          />
        </div>

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
