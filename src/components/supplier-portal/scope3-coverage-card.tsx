"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Scope3CoverageItem } from "@/types/supplier-portal";
import { BarChart3, Users } from "lucide-react";

interface Scope3CoverageCardProps {
  items: Scope3CoverageItem[];
}

/** Scope 3 커버리지 요약 카드 */
export function Scope3CoverageCard({ items }: Scope3CoverageCardProps) {
  return (
    <Card className="border-blue-500/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold">Scope 3 커버리지</h3>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-blue-500/30 text-xs">
              커버리지 상세 보기
            </Button>
            <Button variant="ghost" size="sm" className="text-xs">
              <Users className="mr-1 h-3.5 w-3.5" />
              미응답 협력사 보기
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-foreground">{item.label}</span>
              <span className="tabular-nums text-muted-foreground">
                {item.value}
                {item.unit ?? "%"}
              </span>
            </div>
            <Progress value={item.value} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
