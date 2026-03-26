"use client";

import { useQuery } from "@tanstack/react-query";
import { getMaterialityReportLinks } from "@/services/api";
import { PageHeader } from "@/components/layout/page-header";
import { MaterialitySubNav } from "@/components/materiality/materiality-sub-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MaterialityReportsPage() {
  const { data: links, isLoading } = useQuery({ queryKey: ["materiality-report-links"], queryFn: () => getMaterialityReportLinks() });
  return (
    <>
      <PageHeader title="보고서 연계" description="중대성 이슈와 보고서 연결 상태">
        <MaterialitySubNav />
      </PageHeader>
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">보고서 연결 목록</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && <Skeleton className="h-40 w-full rounded-lg" />}
            {!isLoading && links && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left">
                    <th className="px-4 py-3 font-medium">이슈 ID</th>
                    <th className="px-4 py-3 font-medium">보고서</th>
                    <th className="px-4 py-3 font-medium">유형</th>
                    <th className="px-4 py-3 font-medium">연결일</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((r: any) => (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="px-4 py-3 font-mono text-xs">{r.issueId}</td>
                      <td className="px-4 py-3 font-medium">{r.reportTitle}</td>
                      <td className="px-4 py-3">{r.reportType}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.linkedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
