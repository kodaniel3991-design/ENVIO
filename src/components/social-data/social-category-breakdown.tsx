"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { SocialCategoryBreakdownItem } from "@/types/social-data";
import { formatNumber } from "@/lib/format";

interface SocialCategoryBreakdownProps {
  items: SocialCategoryBreakdownItem[];
}

/** 사회 카테고리별 요약: 인권, 노동, 안전보건, 지역사회, 고객 등 */
export function SocialCategoryBreakdown({
  items,
}: SocialCategoryBreakdownProps) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <h3 className="text-sm font-semibold">사회 카테고리별 요약</h3>
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
