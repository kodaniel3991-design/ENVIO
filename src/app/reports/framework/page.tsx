"use client";

import { useQuery } from "@tanstack/react-query";
import { getDisclosureFrameworkItems } from "@/services/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function DisclosureFrameworkPage() {
  const { data: items, isLoading } = useQuery({
    queryKey: ["disclosure-framework"],
    queryFn: getDisclosureFrameworkItems,
  });

  return (
    <>
      <PageHeader
        title="공시 프레임워크"
        description="K-ESG / GRI / ISSB / CSRD 기준 충족 상태를 확인합니다."
      />
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">프레임워크 충족 상태</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading || !items ? (
              <Skeleton className="h-40 w-full rounded-lg" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">프레임워크</th>
                      <th className="px-4 py-3 font-medium">공시 코드</th>
                      <th className="px-4 py-3 font-medium">항목명</th>
                      <th className="px-4 py-3 font-medium">연결 KPI</th>
                      <th className="px-4 py-3 font-medium">데이터 상태</th>
                      <th className="px-4 py-3 font-medium">보고서 반영</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row: any) => (
                      <tr key={row.id} className="border-b border-border/50">
                        <td className="px-4 py-3">{row.framework}</td>
                        <td className="px-4 py-3 font-mono text-xs">{row.code}</td>
                        <td className="px-4 py-3 font-medium">{row.name}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {row.linkedKpiCodes.join(", ") || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={row.dataStatus === "complete" ? "success" : row.dataStatus === "partial" ? "warning" : "danger"}>
                            {row.dataStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {row.inReports ? <Badge variant="secondary">반영</Badge> : "미반영"}
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
