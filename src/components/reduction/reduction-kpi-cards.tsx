"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryCardGrid } from "@/components/common/summary-card-grid";
import type { ReductionProgressKpi } from "@/types";

export function ReductionKpiCards({
  items,
  isLoading,
}: {
  items: ReductionProgressKpi[];
  isLoading?: boolean;
}) {
  return (
    <SummaryCardGrid
      items={items}
      isLoading={isLoading}
      skeletonCount={4}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      renderItem={(kpi) => (
        <Card key={kpi.id}>
          <CardHeader className="p-4 pb-1">
            <p className="text-sm font-medium text-muted-foreground">
              {kpi.label}
            </p>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight">
                {typeof kpi.value === "number"
                  ? kpi.value.toLocaleString()
                  : kpi.value}
              </span>
              {kpi.unit && (
                <span className="text-xs text-muted-foreground">
                  {kpi.unit}
                </span>
              )}
            </div>
            {kpi.target != null && (
              <p className="mt-1 text-xs text-muted-foreground">
                목표 {kpi.target}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    />
  );
}

