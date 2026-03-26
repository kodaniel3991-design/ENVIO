"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { getReductionScenarios, runSimulation } from "@/services/api";
import { PageHeader } from "@/components/layout/page-header";
import { ReductionSubNav } from "@/components/reduction/reduction-sub-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calculator, Play } from "lucide-react";
import { formatMtCO2e, formatNumber } from "@/lib/utils";

export default function ReductionScenariosPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: scenarios, isLoading: scenariosLoading } = useQuery({
    queryKey: ["reduction-scenarios"],
    queryFn: getReductionScenarios,
  });

  const runMutation = useMutation({
    mutationFn: runSimulation,
  });

  const handleRun = (id: string) => {
    setSelectedId(id);
    runMutation.mutate(id);
  };

  const result = runMutation.data;

  return (
    <>
      <PageHeader
        title="시나리오"
        description="여러 감축 시나리오를 비교하고 예상 감축량과 비용 영향을 확인합니다."
      >
        <ReductionSubNav />
      </PageHeader>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          {scenariosLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {scenarios?.map((scenario: any) => (
                <Card
                  key={scenario.id}
                  className={
                    selectedId === scenario.id ? "ring-2 ring-primary" : undefined
                  }
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">
                        {scenario.name}
                      </CardTitle>
                      <Badge variant="secondary">
                        {scenario.costImpact} 비용
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {scenario.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span>
                        예상 감축{" "}
                        <strong>{scenario.estimatedReductionPercent}%</strong>
                      </span>
                      <span>
                        기간{" "}
                        <strong>{scenario.timelineMonths}개월</strong>
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleRun(scenario.id)}
                      disabled={runMutation.isPending}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      시뮬레이션 실행
                    </Button>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">시나리오 결과</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                선택한 시나리오 적용 시 예상 배출량과 감축 효과입니다.
              </p>
            </CardHeader>
            <CardContent>
              {runMutation.isPending ? (
                <Skeleton className="h-48 w-full rounded-lg" />
              ) : result ? (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Baseline</span>
                    <span>{formatMtCO2e(result.baselineMtCO2e)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Projected</span>
                    <span className="text-primary">
                      {formatMtCO2e(result.projectedMtCO2e)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="text-muted-foreground">감축률</span>
                    <span className="font-semibold text-carbon-success">
                      {formatNumber(result.reductionPercent)}%
                    </span>
                  </div>
                  {result.costEstimate != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">비용 영향</span>
                      <span>{result.costEstimate}M (추정)</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  좌측에서 시나리오를 선택하고 실행해 주세요.
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}

