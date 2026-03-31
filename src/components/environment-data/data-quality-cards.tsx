"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { DataQualityScore } from "@/types/environment-data";
import { cn } from "@/lib/utils";

interface DataQualityCardsProps {
  items: DataQualityScore[];
}

function getScoreColor(value: number): string {
  if (value >= 90) return "text-carbon-success dark:text-carbon-success";
  if (value >= 70) return "text-carbon-warning dark:text-carbon-warning";
  return "text-carbon-danger";
}

const QUALITY_DETAIL: Record<string, string> = {
  completeness: "등록된 배출시설의 12개월 활동량 입력 비율",
  accuracy: "배출계수가 정상 매칭된 배출시설 비율",
  consistency: "전월 대비 ±20% 이내로 안정적인 월 비율",
  overall: "완전성 40% + 정확도 30% + 일관성 30% 가중 평균",
};

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
            {QUALITY_DETAIL[item.id] && (
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {QUALITY_DETAIL[item.id]}
              </p>
            )}
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
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              {QUALITY_DETAIL.overall}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
