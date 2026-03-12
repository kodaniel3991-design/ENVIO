"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SupplierInsight } from "@/types/supplier-portal";
import { Network } from "lucide-react";

interface SupplierPortalInsightPanelProps {
  data: SupplierInsight;
}

/** 공급망 네트워크 인사이트 패널 - blue accent */
export function SupplierPortalInsightPanel({
  data,
}: SupplierPortalInsightPanelProps) {
  return (
    <Card className="border-blue-500/20 bg-blue-500/5 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-semibold">공급망 네트워크 인사이트</h3>
            <Badge variant="secondary" className="text-xs bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30">
              {data.badgeLabel}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-blue-500/30">
              미응답만 보기
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              High Risk만 보기
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
