"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Lock } from "lucide-react";

/** 최종 확정 정책 안내 - info card */
export function ConfirmationPolicyCard() {
  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-amber-600" />
          <h3 className="text-sm font-semibold">최종 확정 정책</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>• Confirmed 상태 데이터는 수정할 수 없습니다.</p>
        <p>• 재수정이 필요한 경우 Reopen 요청이 필요합니다.</p>
        <p>• Confirmed 데이터만 ESG 보고서 및 공시 데이터에 반영됩니다.</p>
      </CardContent>
    </Card>
  );
}
