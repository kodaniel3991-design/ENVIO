"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ApprovalInsight } from "@/types/approval-data";
import { Info } from "lucide-react";

interface ApprovalInsightPanelProps {
  data: ApprovalInsight;
}

/** 승인 인사이트 패널 - Validation AI Insight 스타일 재사용 */
export function ApprovalInsightPanel({ data }: ApprovalInsightPanelProps) {
  return (
    <Card className="border-primary/20 bg-primary/5 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold">승인 인사이트</h3>
            <Badge variant="secondary" className="text-xs">
              {data.badgeLabel}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              승인 대기만 보기
            </Button>
            <Button variant="outline" size="sm">
              승인자 메모 보기
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
        <div>
          <p className="mb-1.5 font-medium text-foreground">현황</p>
          <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
            {data.highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1.5 font-medium text-foreground">Recommended actions</p>
          <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
            {data.recommendedActions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
