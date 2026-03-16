"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TopVendorEmission } from "@/types";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  VENDOR_LINK_STATUS_LABEL,
  VENDOR_LINK_STATUS_VARIANT,
} from "@/lib/constants/status-badges";

interface TopVendorsTableProps {
  data: TopVendorEmission[];
  isLoading?: boolean;
  fillHeight?: boolean;
}

export function TopVendorsTable({ data, isLoading, fillHeight }: TopVendorsTableProps) {
  const cardClass = fillHeight
    ? "flex h-full min-h-0 flex-col overflow-hidden"
    : "overflow-hidden";

  if (isLoading) {
    return (
      <Card className={cardClass}>
        <CardHeader className="shrink-0 p-3 pb-0">
          <Skeleton className="h-5 w-56" />
        </CardHeader>
        <CardContent className="p-3">
          <Skeleton className="h-24 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cardClass}>
      <CardHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 p-3 pb-1">
        <CardTitle className="text-sm font-medium">
          공급망 협력사별 Scope 3 배출량 상위 5개사
        </CardTitle>
        <Link
          href="/scope3"
          className="text-xs font-medium text-primary hover:underline"
        >
          View all &gt;
        </Link>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-auto p-3 pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs" aria-label="공급망 협력사별 Scope 3 배출량 상위 5개사">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 font-medium">배출원 / 협력사</th>
                <th className="pb-2 font-medium">구분</th>
                <th className="pb-2 font-medium">배출량</th>
                <th className="pb-2 font-medium">추이</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b border-border/50">
                  <td className="py-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{row.vendorName}</span>
                      <Badge
                        variant={VENDOR_LINK_STATUS_VARIANT[row.status]}
                        className="w-fit text-xs"
                      >
                        {VENDOR_LINK_STATUS_LABEL[row.status]}
                      </Badge>
                    </div>
                  </td>
                  <td className="py-2 text-muted-foreground">
                    S{row.scope === "scope1" ? "1" : row.scope === "scope2" ? "2" : "3"}
                  </td>
                  <td className="py-2">
                    {row.emissionsKg.toLocaleString()} kg
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-1">
                      <div
                        className={`h-2 w-8 rounded-sm ${
                          row.trendDirection === "up"
                            ? "bg-carbon-danger/50"
                            : "bg-carbon-success/50"
                        }`}
                      />
                      {row.trendDirection === "up" ? (
                        <TrendingUp className="h-4 w-4 text-carbon-danger" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-carbon-success" />
                      )}
                      {row.trendPercent != null && (
                        <span className="text-xs text-muted-foreground">
                          {row.trendPercent}%
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
