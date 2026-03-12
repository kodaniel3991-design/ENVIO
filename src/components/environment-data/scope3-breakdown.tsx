"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Scope3BreakdownItem } from "@/types/environment-data";
import { formatNumber } from "@/lib/format";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Scope3BreakdownProps {
  items: Scope3BreakdownItem[];
}

/** Scope 3 세부 분석: 가로 막대 + 리스트, "Scope 3 상세 보기" 버튼 */
export function Scope3Breakdown({ items }: Scope3BreakdownProps) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <h3 className="text-sm font-semibold">Scope 3 세부 분석</h3>
        <Button variant="outline" size="sm" asChild>
          <Link href="/data/emissions/scope3">
            Scope 3 상세 보기
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground">
                  {item.name}
                  {item.code && (
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      ({item.code})
                    </span>
                  )}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {formatNumber(item.value)} tCO2e
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
