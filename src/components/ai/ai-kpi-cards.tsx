"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryCardGrid } from "@/components/common/summary-card-grid";
import type { AiKpiCard } from "@/types";

export function AiKpiCards({ items, isLoading }: { items: AiKpiCard[]; isLoading?: boolean }) {
  return (
    <SummaryCardGrid
      items={items}
      isLoading={isLoading}
      skeletonCount={4}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      renderItem={(item) => (
        <Card key={item.id}>
          <CardHeader className="p-4 pb-1">
            <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold">
                {typeof item.value === "number"
                  ? item.value.toLocaleString()
                  : item.value}
              </span>
              {item.unit && (
                <span className="text-xs text-muted-foreground">{item.unit}</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    />
  );
}

