"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { GovernanceCategoryBreakdownItem } from "@/types/governance-data";
import { formatNumber } from "@/lib/format";

interface GovernanceCategoryBreakdownProps {
  items: GovernanceCategoryBreakdownItem[];
}

/** 거버넌스 카테고리별 요약: 이사회, 윤리, 준법, 감사, 리스크 */
export function GovernanceCategoryBreakdown({
  items,
}: GovernanceCategoryBreakdownProps) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <h3 className="text-sm font-semibold">거버넌스 카테고리별 요약</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground">{item.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatNumber(item.value)}
                  {item.unit ? ` ${item.unit}` : ""}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/80 transition-all"
                  style={{ width: `${(item.value / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
