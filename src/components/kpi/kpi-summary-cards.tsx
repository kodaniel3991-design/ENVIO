"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SummaryCardGrid } from "@/components/common/summary-card-grid";
import type { KpiSummaryCard } from "@/types";

interface KpiSummaryCardsProps {
  items: KpiSummaryCard[];
  isLoading?: boolean;
}

export function KpiSummaryCards({ items, isLoading }: KpiSummaryCardsProps) {
  return (
    <SummaryCardGrid
      items={items}
      isLoading={isLoading}
      skeletonCount={4}
      className="grid gap-4 sm:grid-cols-4"
      renderItem={(item, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="p-4 pb-0">
            <p className="text-sm font-medium text-muted-foreground">
              {item.label}
            </p>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <span className="text-xl font-semibold tracking-tight">
              {typeof item.value === "number"
                ? item.value.toLocaleString()
                : item.value}
            </span>
          </CardContent>
        </Card>
      )}
    />
  );
}
