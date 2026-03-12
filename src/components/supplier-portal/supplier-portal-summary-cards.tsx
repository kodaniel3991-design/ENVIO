"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { SupplierSummaryItem } from "@/types/supplier-portal";
import { cn } from "@/lib/utils";

interface SupplierPortalSummaryCardsProps {
  items: SupplierSummaryItem[];
}

/** 협력사 네트워크 현황 KPI 6개 - 공급망 포털 blue accent */
export function SupplierPortalSummaryCards({
  items,
}: SupplierPortalSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map((item, index) => (
        <Card
          key={item.id}
          className={cn(
            "transition-shadow hover:shadow-md border-border/80",
            index === 0 && "border-blue-500/20"
          )}
        >
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">
              {item.label}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={cn(
                  "text-xl font-semibold tracking-tight",
                  index === 0 ? "text-blue-600 dark:text-blue-400" : "text-foreground"
                )}
              >
                {typeof item.value === "number"
                  ? item.value.toLocaleString("ko-KR")
                  : item.value}
              </span>
              {item.unit && (
                <span className="text-xs text-muted-foreground">
                  {item.unit}
                </span>
              )}
            </div>
            {item.subLabel && (
              <p className="mt-1 text-xs text-muted-foreground">
                {item.subLabel}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
