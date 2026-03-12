"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { DataQualityScore } from "@/types/environment-data";
import { cn } from "@/lib/utils";

interface DataQualityCardsProps {
  items: DataQualityScore[];
}

function getScoreColor(value: number): string {
  if (value >= 90) return "text-green-600 dark:text-green-400";
  if (value >= 70) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

/** 데이터 품질 요약 카드: Completeness, Accuracy, Consistency, 전체 점수 */
export function DataQualityCards({ items }: DataQualityCardsProps) {
  const overall = items.find((i) => i.id === "overall");
  const rest = items.filter((i) => i.id !== "overall");

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {rest.map((item) => (
        <Card key={item.id} className="border-border/80">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">
              {item.label}
            </p>
            {item.description && (
              <p className="mt-0.5 text-xs text-muted-foreground/80">
                {item.description}
              </p>
            )}
            <div className="mt-3 flex items-center gap-3">
              <Progress value={item.value} className="h-2 flex-1" />
              <span
                className={cn(
                  "text-lg font-semibold tabular-nums",
                  getScoreColor(item.value)
                )}
              >
                {item.value}%
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
      {overall && (
        <Card className="border-primary/30 bg-primary/5 sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">
              {overall.label}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-primary">
              {overall.value}
              <span className="text-lg font-normal text-muted-foreground">
                /100
              </span>
            </p>
            <Progress value={overall.value} className="mt-2 h-2" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
