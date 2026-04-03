"use client";

import { useQuery } from "@tanstack/react-query";
import { getMaterialityIssues, getMaterialityMatrix } from "@/services/api";
import { PageHeader } from "@/components/layout/page-header";
import { MaterialitySubNav } from "@/components/materiality/materiality-sub-nav";
import { MaterialityMatrix } from "@/components/materiality/materiality-matrix";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { MaterialityIssue, MaterialityEsgDimension } from "@/types";

const DIM_LABEL: Record<MaterialityEsgDimension, string> = { environment: "환경", social: "사회", governance: "거버넌스" };
const DIM_COLOR: Record<MaterialityEsgDimension, string> = { environment: "text-green-600 bg-green-100", social: "text-blue-600 bg-blue-100", governance: "text-amber-700 bg-amber-100" };
const THRESHOLD = 3.5;

export default function MaterialityDashboardPage() {
  const { data: issues = [], isLoading } = useQuery<MaterialityIssue[]>({ queryKey: ["materiality-issues"], queryFn: getMaterialityIssues });
  const { data: matrix = [], isLoading: matrixLoading } = useQuery({ queryKey: ["materiality-matrix"], queryFn: getMaterialityMatrix });

  const getImpact = (i: MaterialityIssue) => i.impactScore ?? 0;
  const getFinancial = (i: MaterialityIssue) => i.financialScore ?? 0;
  const assessed = issues.filter((i) => i.impactScore != null && i.financialScore != null).length;
  const dual = issues.filter((i) => getImpact(i) >= THRESHOLD && getFinancial(i) >= THRESHOLD);
  const impactOnly = issues.filter((i) => getImpact(i) >= THRESHOLD && getFinancial(i) < THRESHOLD);
  const financialOnly = issues.filter((i) => getImpact(i) < THRESHOLD && getFinancial(i) >= THRESHOLD);
  const allMaterial = [...dual, ...impactOnly, ...financialOnly];
  const completionPct = issues.length > 0 ? Math.round((assessed / issues.length) * 100) : 0;

  return (
    <div>
      <PageHeader title="이중 중대성 평가" description="ESG 이슈의 영향 중대성과 재무 중대성을 단계별로 평가합니다 — CSRD/GRI 기준">
        <MaterialitySubNav />
      </PageHeader>

      {/* 진행률 */}
      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">평가 진행 현황</h2>
            <p className="text-sm text-muted-foreground">{issues.length}개 이슈 중 {assessed}개 평가 완료</p>
          </div>
          <span className="text-2xl font-bold text-primary">{completionPct}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-2.5 rounded-full bg-primary transition-all duration-500" style={{ width: `${completionPct}%` }} />
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="mt-4 grid grid-cols-5 gap-4">
        <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">전체 이슈</p><p className="text-2xl font-bold">{issues.length}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">평가 완료</p><p className="text-2xl font-bold text-green-600">{assessed}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">미평가</p><p className="text-2xl font-bold text-amber-600">{issues.length - assessed}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-destructive font-medium">이중 중대</p><p className="text-2xl font-bold text-destructive">{dual.length}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">보고 대상 (CSRD)</p><p className="text-2xl font-bold text-primary">{allMaterial.length}</p></CardContent></Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* 매트릭스 미리보기 */}
        <MaterialityMatrix points={matrix} isLoading={matrixLoading} />

        {/* 보고 대상 이슈 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">보고 대상 이슈 (CSRD)</CardTitle>
            <p className="text-xs text-muted-foreground">영향 또는 재무 ≥ {THRESHOLD}</p>
          </CardHeader>
          <CardContent>
            {allMaterial.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">평가를 시작하면 보고 대상 이슈가 표시됩니다.</p>
                <Link href="/materiality/issues">
                  <Button size="sm"><ArrowRight className="mr-1.5 h-3.5 w-3.5" /> 평가 시작하기</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5">
                {dual.length > 0 && <p className="text-[10px] font-bold text-destructive mt-1 mb-0.5">이중 중대 ({dual.length})</p>}
                {dual.map((i) => <IssueRow key={i.id} issue={i} impact={getImpact(i)} financial={getFinancial(i)} type="dual" />)}
                {impactOnly.length > 0 && <p className="text-[10px] font-bold text-green-600 mt-2 mb-0.5">영향 중대 ({impactOnly.length})</p>}
                {impactOnly.map((i) => <IssueRow key={i.id} issue={i} impact={getImpact(i)} financial={getFinancial(i)} type="impact" />)}
                {financialOnly.length > 0 && <p className="text-[10px] font-bold text-blue-600 mt-2 mb-0.5">재무 중대 ({financialOnly.length})</p>}
                {financialOnly.map((i) => <IssueRow key={i.id} issue={i} impact={getImpact(i)} financial={getFinancial(i)} type="financial" />)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 다음 단계 안내 */}
      {issues.length > 0 && assessed < issues.length && (
        <div className="mt-6 flex justify-center">
          <Link href={assessed === 0 ? "/materiality/issues" : "/materiality/impact"}>
            <Button size="lg">
              <ArrowRight className="mr-2 h-4 w-4" />
              {assessed === 0 ? "1단계: 이슈 확인부터 시작" : "평가 이어서 진행하기"}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function IssueRow({ issue, impact, financial, type }: { issue: MaterialityIssue; impact: number; financial: number; type: string }) {
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
