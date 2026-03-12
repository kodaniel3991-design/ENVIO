"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { ValidationSummaryItem } from "@/types/validation-data";

interface ValidationSummaryCardsProps {
  items: ValidationSummaryItem[];
}

/** 검증 운영 현황 KPI 카드 6개 - Environment KPI 카드 스타일 재사용 */
export function ValidationSummaryCards({ items }: ValidationSummaryCardsProps) {
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
