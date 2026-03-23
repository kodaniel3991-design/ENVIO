"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getEnvironmentMetrics,
  getSocialMetrics,
  getGovernanceMetrics,
} from "@/services/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { EsgDomain } from "@/types";

export default function ESGDatabookPage() {
  const { data: env, isLoading: envLoading } = useQuery({
    queryKey: ["esg-env-metrics"],
    queryFn: () => getEnvironmentMetrics(),
  });
  const { data: soc, isLoading: socLoading } = useQuery({
    queryKey: ["esg-soc-metrics"],
    queryFn: () => getSocialMetrics(),
  });
  const { data: gov, isLoading: govLoading } = useQuery({
    queryKey: ["esg-gov-metrics"],
    queryFn: () => getGovernanceMetrics(),
  });
  const domains: EsgDomain[] = ["environment", "social", "governance"];

  return (
    <>
      <PageHeader
        title="ESG 데이터북"
        description="환경·사회·거버넌스 정량 데이터를 연도별로 비교합니다."
      />
      <div className="mt-8 space-y-6">
        {domains.map((d) => (
          <Card key={d}>
            <CardHeader>
              <CardTitle className="text-base">
                {d === "environment" ? "환경" : d === "social" ? "사회" : "거버넌스"}
              </CardTitle>
            </CardHeader>
              <CardContent>
              {((d === "environment" && (envLoading || !env)) ||
                (d === "social" && (socLoading || !soc)) ||
                (d === "governance" && (govLoading || !gov))) ? (
                <Skeleton className="h-32 w-full rounded-lg" />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">지표명</th>
                      <th className="px-4 py-3 font-medium">값</th>
                      <th className="px-4 py-3 font-medium">단위</th>
                      <th className="px-4 py-3 font-medium">기간</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(d === "environment" ? env : d === "social" ? soc : gov)!
                      .map((m) => (
                        <tr key={m.id} className="border-b border-border/50">
                          <td className="px-4 py-3 font-medium">{m.indicatorName}</td>
                          <td className="px-4 py-3">
                            {typeof m.value === "number" ? m.value.toLocaleString() : m.value}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{m.unit}</td>
                          <td className="px-4 py-3 text-muted-foreground">{m.period}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
