"use client";

import { useQuery } from "@tanstack/react-query";
import { getMaterialityIssues, getMaterialityMatrix } from "@/services/api";
import { PageHeader } from "@/components/layout/page-header";
import { MaterialitySubNav } from "@/components/materiality/materiality-sub-nav";
import { MaterialityMatrix } from "@/components/materiality/materiality-matrix";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Users, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MaterialityIssue, MaterialityEsgDimension } from "@/types";

const DIM_LABEL: Record<MaterialityEsgDimension, string> = { environment: "환경", social: "사회", governance: "거버넌스" };
const DIM_COLOR: Record<MaterialityEsgDimension, string> = { environment: "text-green-600 bg-green-100", social: "text-blue-600 bg-blue-100", governance: "text-amber-700 bg-amber-100" };
const THRESHOLD = 3.5;

export default function ResultPage() {
  const { data: issues = [] } = useQuery<MaterialityIssue[]>({ queryKey: ["materiality-issues"], queryFn: getMaterialityIssues });
  const { data: matrix = [], isLoading: matrixLoading } = useQuery({ queryKey: ["materiality-matrix"], queryFn: getMaterialityMatrix });

  const getImpact = (i: MaterialityIssue) => i.impactScore ?? 0;
  const getFinancial = (i: MaterialityIssue) => i.financialScore ?? 0;

  const dual = issues.filter((i) => getImpact(i) >= THRESHOLD && getFinancial(i) >= THRESHOLD);
  const impactOnly = issues.filter((i) => getImpact(i) >= THRESHOLD && getFinancial(i) < THRESHOLD);
  const financialOnly = issues.filter((i) => getImpact(i) < THRESHOLD && getFinancial(i) >= THRESHOLD);
  const allMaterial = [...dual, ...impactOnly, ...financialOnly];

  return (
    <div>
      <PageHeader title="이중 중대성 평가" description="ESG 이슈의 영향 중대성과 재무 중대성을 단계별로 평가합니다 — CSRD/GRI 기준">
        <MaterialitySubNav />
      </PageHeader>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <MaterialityMatrix points={matrix} isLoading={matrixLoading} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">④ 보고 대상 이슈 (CSRD 기준)</CardTitle>
            <p className="text-xs text-muted-foreground">영향 또는 재무 중 하나라도 {THRESHOLD} 이상이면 보고 대상</p>
          </CardHeader>
          <CardContent>
            {allMaterial.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">2~3단계 평가를 완료하면 결과가 표시됩니다.</p>
            ) : (
              <div className="space-y-1.5">
                {dual.length > 0 && <p className="text-[10px] font-bold text-destructive mt-1 mb-0.5">이중 중대 ({dual.length})</p>}
                {dual.map((i) => <Row key={i.id} issue={i} impact={getImpact(i)} financial={getFinancial(i)} type="dual" />)}
                {impactOnly.length > 0 && <p className="text-[10px] font-bold text-green-600 mt-2 mb-0.5">영향 중대 ({impactOnly.length})</p>}
                {impactOnly.map((i) => <Row key={i.id} issue={i} impact={getImpact(i)} financial={getFinancial(i)} type="impact" />)}
                {financialOnly.length > 0 && <p className="text-[10px] font-bold text-blue-600 mt-2 mb-0.5">재무 중대 ({financialOnly.length})</p>}
                {financialOnly.map((i) => <Row key={i.id} issue={i} impact={getImpact(i)} financial={getFinancial(i)} type="financial" />)}
              </div>
            )}
            <div className="mt-4 rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
              <p>전체 {issues.length}개 중 <strong className="text-foreground">{allMaterial.length}개</strong> 보고 대상</p>
              <p>이중 중대 <strong className="text-destructive">{dual.length}</strong> · 영향 중대 <strong className="text-green-600">{impactOnly.length}</strong> · 재무 중대 <strong className="text-blue-600">{financialOnly.length}</strong></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ issue, impact, financial, type }: { issue: MaterialityIssue; impact: number; financial: number; type: string }) {
  const color = DIM_COLOR[issue.dimension];
  return (
    <div className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5">
      <span className={cn("rounded px-1 py-0.5 text-[9px] font-bold", color)}>{DIM_LABEL[issue.dimension].charAt(0)}</span>
      <span className="flex-1 text-xs font-medium">{issue.name}</span>
      <span className={cn("text-[10px]", type !== "financial" ? "font-bold" : "text-muted-foreground")}>영향 {impact.toFixed(1)}</span>
      <span className={cn("text-[10px]", type !== "impact" ? "font-bold" : "text-muted-foreground")}>재무 {financial.toFixed(1)}</span>
    </div>
  );
}
