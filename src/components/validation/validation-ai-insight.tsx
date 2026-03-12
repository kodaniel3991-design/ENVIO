"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ValidationAiInsight } from "@/types/validation-data";
import { Sparkles, AlertTriangle } from "lucide-react";

interface ValidationAiInsightProps {
  data: ValidationAiInsight;
}

/** AI 검증 인사이트 패널 - Environment AI Insight 스타일 */
export function ValidationAiInsight({ data }: ValidationAiInsightProps) {
  return (
    <Card className="border-primary/20 bg-primary/5 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold">AI 검증 인사이트</h3>
            {data.hasAnomaly && (
              <Badge variant="destructive" className="text-xs">
                AI anomaly detected
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              AI에게 질문하기
            </Button>
            <Button size="sm">이상 항목만 필터링</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3 text-sm">
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 font-medium text-foreground">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            주요 경고
          </p>
          <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
            {data.alerts.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1.5 font-medium text-foreground">Possible causes</p>
          <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
            {data.possibleCauses.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1.5 font-medium text-foreground">Suggested actions</p>
          <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
            {data.suggestedActions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
