"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatChangePercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { GovernanceKpiItem } from "@/types/governance-data";
import { TrendingDown, TrendingUp } from "lucide-react";

interface GovernanceKpiCardsProps {
  items: GovernanceKpiItem[];
}

/** 거버넌스 KPI 요약 카드 6개 */
export function GovernanceKpiCards({ items }: GovernanceKpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => (
        <Card
          key={item.id}
          className="transition-shadow hover:shadow-md border-border/80"
        >
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">
              {item.label}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-semibold tracking-tight text-foreground">
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
            {item.changePercent != null && item.changePercent !== 0 && (
              <div className="mt-1.5 flex items-center gap-1">
                {item.changePercent >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    item.changePercent >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  전년 대비 {formatChangePercent(item.changePercent)}
                </span>
              </div>
            )}
            {item.subValue && (item.changePercent == null || item.changePercent === 0) && (
              <p className="mt-1 text-xs text-muted-foreground">{item.subValue}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
