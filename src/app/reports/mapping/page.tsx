"use client";

import { useQuery } from "@tanstack/react-query";
import { getMappingItems } from "@/services/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsMappingPage() {
  const { data: items, isLoading } = useQuery({
    queryKey: ["report-mapping"],
    queryFn: getMappingItems,
  });

  return (
    <>
      <PageHeader
        title="매핑 엔진"
        description="KPI · 중대성 이슈를 공시 프레임워크와 보고서 구조에 매핑합니다."
      />
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">KPI 매핑 테이블</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading || !items ? (
              <Skeleton className="h-40 w-full rounded-lg" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">KPI 코드</th>
                      <th className="px-4 py-3 font-medium">KPI 이름</th>
                      <th className="px-4 py-3 font-medium">ESG 영역</th>
                      <th className="px-4 py-3 font-medium">프레임워크</th>
                      <th className="px-4 py-3 font-medium">공시 코드</th>
                      <th className="px-4 py-3 font-medium">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row: any) => (
                      <tr key={row.id} className="border-b border-border/50">
                        <td className="px-4 py-3 font-mono text-xs">{row.kpiCode}</td>
                        <td className="px-4 py-3 font-medium">{row.kpiName}</td>
                        <td className="px-4 py-3">{row.kpiCategory}</td>
                        <td className="px-4 py-3">{row.framework}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{row.disclosureCode}</td>
                        <td className="px-4 py-3">
                          <Badge variant={row.status === "linked" ? "success" : row.status === "partial" ? "warning" : "secondary"}>
                            {row.status}
                          </Badge>
                        </td>
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
