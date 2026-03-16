"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EmissionSourceItem, Scope } from "@/types";
import { formatMtCO2e } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DATA_STATUS_LABEL,
  DATA_STATUS_VARIANT,
} from "@/lib/constants/status-badges";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationBar } from "@/components/common/pagination-bar";

interface EmissionSourcesTableProps {
  data: EmissionSourceItem[];
  isLoading?: boolean;
  title?: string;
}

const SCOPE_LABEL: Record<Scope, string> = {
  scope1: "Scope 1",
  scope2: "Scope 2",
  scope3: "Scope 3",
};

export function EmissionSourcesTable({
  data,
  isLoading,
  title = "배출원 목록",
}: EmissionSourcesTableProps) {
  const pagination = usePagination({ totalItems: data.length, pageSize: 10 });
  const visible = pagination.paginate(data);

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <Skeleton className="h-64 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Scope·카테고리별 배출원과 배출량을 확인할 수 있습니다.
        </p>
      </CardHeader>
      <CardContent className="p-4">
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm" aria-label={title}>
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Scope</th>
                <th className="px-4 py-3 font-medium">배출원</th>
                <th className="px-4 py-3 font-medium">카테고리</th>
                <th className="px-4 py-3 font-medium text-right">배출량</th>
                <th className="px-4 py-3 font-medium">기간</th>
                <th className="px-4 py-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/50 transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">
                    {SCOPE_LABEL[row.scope]}
                  </td>
                  <td className="px-4 py-3">{row.sourceName}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.category}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatMtCO2e(row.value)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.period}
                  </td>
                  <td className="px-4 py-3">
                    {row.status ? (
                      <Badge
                        variant={DATA_STATUS_VARIANT[row.status]}
                        className="text-xs"
                      >
                        {DATA_STATUS_LABEL[row.status]}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationBar pagination={pagination} totalItems={data.length} />
      </CardContent>
    </Card>
  );
}
