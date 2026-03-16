"use client";

import { useQuery } from "@tanstack/react-query";
import { getKpiCoverage } from "@/services/api";
import { PageHeader } from "@/components/layout/page-header";
import { KpiSubNav } from "@/components/kpi/kpi-sub-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/error-state";
import { getApiErrorMessage } from "@/hooks/use-api-error";
import type { KpiCategory } from "@/types";

const CAT: Record<KpiCategory, string> = { environment: "환경", social: "사회", governance: "거버넌스", carbon: "탄소" };

export default function KpiCoveragePage() {
  const { data: list, isLoading, error, isError, refetch } = useQuery({ queryKey: ["kpi-coverage"], queryFn: getKpiCoverage });

  return (
    <>
      <PageHeader title="KPI 커버리지" description="ESG 영역별 데이터 보유 현황과 누락 KPI를 확인합니다.">
        <KpiSubNav />
      </PageHeader>
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">영역별 커버리지</CardTitle>
            <p className="text-sm text-muted-foreground">데이터 입력 완료 비율 및 누락 지표</p>
          </CardHeader>
          <CardContent>
            {isLoading && <Skeleton className="h-48 w-full rounded-lg" />}
            {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}
            {!isLoading && !isError && (
              <div className="space-y-4">
                {list?.map((row) => (
                  <div key={row.category} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{CAT[row.category]}</span>
                      <span className="text-sm text-muted-foreground">{row.withDataCount} / {row.totalCount} ({row.coveragePercent}%)</span>
                    </div>
                    <Progress value={row.coveragePercent} className="mt-2 h-2" />
                    {row.missingKpiNames?.length ? (
                      <p className="mt-2 text-xs text-carbon-warning">누락: {row.missingKpiNames.join(", ")}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
