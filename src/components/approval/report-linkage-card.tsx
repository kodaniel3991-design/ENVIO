"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink } from "lucide-react";

/** 확정 데이터의 보고서 연계 상태 */
export function ReportLinkageCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold">보고서 연계</h3>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          보고서 반영 가능 데이터: <strong className="text-foreground">96건</strong>
        </p>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• K-ESG 보고서 연결</li>
          <li>• CSRD 보고서 연결</li>
          <li>• GRI Index 연동 가능</li>
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            보고서 반영 대상 보기
          </Button>
          <Button size="sm">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            보고서 생성으로 이동
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
