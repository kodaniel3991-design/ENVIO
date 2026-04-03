"use client";

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMaterialityIssues, getMaterialityMatrix, getMaterialitySettings } from "@/services/api";
import { PageHeader } from "@/components/layout/page-header";
import { MaterialitySubNav } from "@/components/materiality/materiality-sub-nav";
import { MaterialityMatrix } from "@/components/materiality/materiality-matrix";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MaterialityIssue, MaterialityEsgDimension } from "@/types";

const DIM_LABEL: Record<MaterialityEsgDimension, string> = { environment: "환경", social: "사회", governance: "거버넌스" };
const DIM_COLOR: Record<MaterialityEsgDimension, string> = { environment: "text-green-600 bg-green-100", social: "text-blue-600 bg-blue-100", governance: "text-amber-700 bg-amber-100" };
const THRESHOLD = 3.5;

export default function ResultPage() {
  const reportRef = useRef<HTMLDivElement>(null);
  const { data: issues = [] } = useQuery<MaterialityIssue[]>({ queryKey: ["materiality-issues"], queryFn: getMaterialityIssues });
  const { data: matrix = [], isLoading: matrixLoading } = useQuery({ queryKey: ["materiality-matrix"], queryFn: getMaterialityMatrix });
  const { data: settings } = useQuery<any>({ queryKey: ["materiality-settings"], queryFn: getMaterialitySettings });

  const getImpact = (i: MaterialityIssue) => i.impactScore ?? 0;
  const getFinancial = (i: MaterialityIssue) => i.financialScore ?? 0;
  const assessed = issues.filter((i) => i.impactScore != null && i.financialScore != null).length;

  const dual = issues.filter((i) => getImpact(i) >= THRESHOLD && getFinancial(i) >= THRESHOLD);
  const impactOnly = issues.filter((i) => getImpact(i) >= THRESHOLD && getFinancial(i) < THRESHOLD);
  const financialOnly = issues.filter((i) => getImpact(i) < THRESHOLD && getFinancial(i) >= THRESHOLD);
  const allMaterial = [...dual, ...impactOnly, ...financialOnly];
  const nonMaterial = issues.filter((i) => getImpact(i) < THRESHOLD && getFinancial(i) < THRESHOLD);

  const handlePrint = () => {
    const content = reportRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>이중 중대성 평가 보고서</title>
      <style>
        body { font-family: 'Pretendard', sans-serif; padding: 40px; color: #1a1a1a; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 12px; }
        h2 { font-size: 18px; margin-top: 32px; color: #333; }
        h3 { font-size: 14px; margin-top: 20px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
        .dual { background: #fee2e2; color: #dc2626; }
        .impact { background: #dcfce7; color: #16a34a; }
        .financial { background: #dbeafe; color: #2563eb; }
        .summary { background: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 16px; }
        .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #999; }
        @media print { body { padding: 20px; } }
      </style></head><body>${content.innerHTML}
      <div class="footer">
        <p>본 보고서는 CSRD/ESRS 이중 중대성 평가 기준에 따라 작성되었습니다.</p>
        <p>생성일: ${new Date().toLocaleDateString("ko-KR")} | ESG ON Platform</p>
      </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const year = settings?.year ?? new Date().getFullYear();

  return (
    <div>
      <PageHeader title="이중 중대성 평가" description="ESG 이슈의 영향 중대성과 재무 중대성을 단계별로 평가합니다 — CSRD/GRI 기준">
        <MaterialitySubNav />
      </PageHeader>

      {/* 액션 버튼 */}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-1.5 h-3.5 w-3.5" /> 보고서 인쇄 / PDF
        </Button>
      </div>

      {/* 매트릭스 + 보고 대상 이슈 */}
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <MaterialityMatrix points={matrix} isLoading={matrixLoading} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">④ 보고 대상 이슈 (CSRD 기준)</CardTitle>
            <p className="text-xs text-muted-foreground">영향 또는 재무 ≥ {THRESHOLD}</p>
          </CardHeader>
          <CardContent>
            {allMaterial.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">2~3단계 평가를 완료하면 결과가 표시됩니다.</p>
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
            <div className="mt-4 rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
              <p>전체 {issues.length}개 중 <strong className="text-foreground">{allMaterial.length}개</strong> 보고 대상</p>
              <p>이중 중대 <strong className="text-destructive">{dual.length}</strong> · 영향 중대 <strong className="text-green-600">{impactOnly.length}</strong> · 재무 중대 <strong className="text-blue-600">{financialOnly.length}</strong></p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 보고서용 콘텐츠 (인쇄/PDF용) */}
      <div ref={reportRef} className="mt-8 rounded-xl border border-border bg-card p-8 space-y-8">
        <div>
          <h1 className="text-xl font-bold">이중 중대성 평가 보고서</h1>
          <p className="text-sm text-muted-foreground mt-1">{year}년 · CSRD/ESRS 이중 중대성 평가 기준</p>
        </div>

        {/* 1. 평가 개요 */}
        <section>
          <h2 className="text-base font-bold border-b border-border pb-2 mb-3">1. 평가 개요</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">평가 기준</span><p className="font-medium">CSRD/ESRS 이중 중대성 (Double Materiality)</p></div>
            <div><span className="text-muted-foreground">평가 기준 연도</span><p className="font-medium">{year}년</p></div>
            <div><span className="text-muted-foreground">평가 방법론</span><p className="font-medium">영향 중대성(GRI 심각성 3요소) + 재무 중대성</p></div>
            <div><span className="text-muted-foreground">보고 대상 기준</span><p className="font-medium">영향 또는 재무 ≥ {THRESHOLD} (CSRD 기준: 둘 중 하나)</p></div>
            <div><span className="text-muted-foreground">전체 이슈</span><p className="font-medium">{issues.length}개</p></div>
            <div><span className="text-muted-foreground">평가 완료</span><p className="font-medium">{assessed}개</p></div>
          </div>
        </section>

        {/* 2. 평가 결과 요약 */}
        <section>
          <h2 className="text-base font-bold border-b border-border pb-2 mb-3">2. 평가 결과 요약</h2>
          <div className="rounded-lg bg-muted/30 p-4 text-sm space-y-2">
            <p>전체 <strong>{issues.length}개</strong> ESG 이슈 중 <strong className="text-primary">{allMaterial.length}개</strong>가 보고 대상으로 선정되었습니다.</p>
            <div className="flex gap-4">
              <span><span className="inline-block rounded bg-destructive/15 px-2 py-0.5 text-xs font-bold text-destructive">이중 중대</span> {dual.length}개</span>
              <span><span className="inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">영향 중대</span> {impactOnly.length}개</span>
              <span><span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">재무 중대</span> {financialOnly.length}개</span>
              <span className="text-muted-foreground">비중대 {nonMaterial.length}개</span>
            </div>
          </div>
        </section>

        {/* 3. 이중 중대성 매트릭스 */}
        <section>
          <h2 className="text-base font-bold border-b border-border pb-2 mb-3">3. 이중 중대성 매트릭스</h2>
          <p className="text-xs text-muted-foreground mb-3">X축: 영향 중대성 (환경·사회 영향) | Y축: 재무 중대성 (기업 리스크/기회) | 기준선: {THRESHOLD}</p>
          <PrintableMatrix issues={issues} getImpact={getImpact} getFinancial={getFinancial} threshold={THRESHOLD} />
        </section>

        {/* 4. 보고 대상 이슈 상세 */}
        <section>
          <h2 className="text-base font-bold border-b border-border pb-2 mb-3">4. 보고 대상 이슈 상세</h2>

          {dual.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-destructive mt-4 mb-2">4-1. 이중 중대 이슈 ({dual.length}개)</h3>
              <p className="text-xs text-muted-foreground mb-2">영향 중대성과 재무 중대성 모두 높아 최우선 관리가 필요한 이슈</p>
              <ReportTable issues={dual} getImpact={getImpact} getFinancial={getFinancial} />
            </>
          )}

          {impactOnly.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-green-700 mt-4 mb-2">4-2. 영향 중대 이슈 ({impactOnly.length}개)</h3>
              <p className="text-xs text-muted-foreground mb-2">환경·사회에 대한 영향이 유의미하여 보고 대상인 이슈</p>
              <ReportTable issues={impactOnly} getImpact={getImpact} getFinancial={getFinancial} />
            </>
          )}

          {financialOnly.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-blue-700 mt-4 mb-2">4-3. 재무 중대 이슈 ({financialOnly.length}개)</h3>
              <p className="text-xs text-muted-foreground mb-2">기업 재무에 대한 리스크/기회가 유의미하여 보고 대상인 이슈</p>
              <ReportTable issues={financialOnly} getImpact={getImpact} getFinancial={getFinancial} />
            </>
          )}
        </section>

        {/* 5. 전체 이슈 평가 결과 */}
        <section>
          <h2 className="text-base font-bold border-b border-border pb-2 mb-3">5. 전체 이슈 평가 결과</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-border bg-muted/50">
                  <th className="py-2 px-3 text-left font-semibold">영역</th>
                  <th className="py-2 px-3 text-left font-semibold">이슈명</th>
                  <th className="py-2 px-3 text-center font-semibold">규모</th>
                  <th className="py-2 px-3 text-center font-semibold">범위</th>
                  <th className="py-2 px-3 text-center font-semibold">복구불가</th>
                  <th className="py-2 px-3 text-center font-semibold">영향 점수</th>
                  <th className="py-2 px-3 text-center font-semibold">재무 점수</th>
                  <th className="py-2 px-3 text-center font-semibold">KPI</th>
                  <th className="py-2 px-3 text-left font-semibold">분류</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {issues.map((issue) => {
                  const impact = getImpact(issue);
                  const financial = getFinancial(issue);
                  const isDual = impact >= THRESHOLD && financial >= THRESHOLD;
                  const isImpact = impact >= THRESHOLD && financial < THRESHOLD;
                  const isFinancial = impact < THRESHOLD && financial >= THRESHOLD;
                  const color = DIM_COLOR[issue.dimension];
                  return (
                    <tr key={issue.id} className={isDual ? "bg-destructive/[0.03]" : (isImpact || isFinancial) ? "bg-primary/[0.02]" : ""}>
                      <td className="py-2 px-3"><span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold", color)}>{DIM_LABEL[issue.dimension]}</span></td>
                      <td className="py-2 px-3 font-medium">{issue.name}</td>
                      <td className="py-2 px-3 text-center">{issue.impactScale?.toFixed(1) ?? "—"}</td>
                      <td className="py-2 px-3 text-center">{issue.impactScope?.toFixed(1) ?? "—"}</td>
                      <td className="py-2 px-3 text-center">{issue.impactIrremediability?.toFixed(1) ?? "—"}</td>
                      <td className="py-2 px-3 text-center font-bold">{impact > 0 ? impact.toFixed(1) : "—"}</td>
                      <td className="py-2 px-3 text-center font-bold">{financial > 0 ? financial.toFixed(1) : "—"}</td>
                      <td className="py-2 px-3 text-center">{issue.kpiLinkedCount}</td>
                      <td className="py-2 px-3">
                        {isDual && <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[9px] font-bold text-destructive">이중 중대</span>}
                        {isImpact && <span className="rounded bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">영향 중대</span>}
                        {isFinancial && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">재무 중대</span>}
                        {!isDual && !isImpact && !isFinancial && <span className="text-muted-foreground text-[9px]">비중대</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
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

function ReportTable({ issues, getImpact, getFinancial }: { issues: MaterialityIssue[]; getImpact: (i: MaterialityIssue) => number; getFinancial: (i: MaterialityIssue) => number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="py-1.5 px-3 text-left font-semibold">영역</th>
            <th className="py-1.5 px-3 text-left font-semibold">이슈</th>
            <th className="py-1.5 px-3 text-left font-semibold">설명</th>
            <th className="py-1.5 px-3 text-center font-semibold">영향</th>
            <th className="py-1.5 px-3 text-center font-semibold">재무</th>
            <th className="py-1.5 px-3 text-center font-semibold">KPI 연결</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {issues.map((issue) => (
            <tr key={issue.id}>
              <td className="py-1.5 px-3"><span className={cn("rounded px-1 py-0.5 text-[9px] font-bold", DIM_COLOR[issue.dimension])}>{DIM_LABEL[issue.dimension]}</span></td>
              <td className="py-1.5 px-3 font-medium">{issue.name}</td>
              <td className="py-1.5 px-3 text-muted-foreground max-w-[250px] truncate">{issue.description}</td>
              <td className="py-1.5 px-3 text-center font-bold">{getImpact(issue).toFixed(1)}</td>
              <td className="py-1.5 px-3 text-center font-bold">{getFinancial(issue).toFixed(1)}</td>
              <td className="py-1.5 px-3 text-center">{issue.kpiLinkedCount}개</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const DIM_DOT_COLOR: Record<string, string> = { environment: "#22c55e", social: "#3b82f6", governance: "#d97706" };

function PrintableMatrix({ issues, getImpact, getFinancial, threshold }: {
  issues: MaterialityIssue[];
  getImpact: (i: MaterialityIssue) => number;
  getFinancial: (i: MaterialityIssue) => number;
  threshold: number;
}) {
  const size = 400;
  const pad = 40;
  const toX = (v: number) => pad + ((v - 1) / 4) * (size - pad * 2);
  const toY = (v: number) => size - pad - ((v - 1) / 4) * (size - pad * 2);
  const thX = toX(threshold);
  const thY = toY(threshold);

  const assessed = issues.filter((i) => getImpact(i) > 0 && getFinancial(i) > 0);

  return (
    <div className="flex gap-6 items-start">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="border border-border rounded-lg bg-white shrink-0">
        {/* 4분면 배경 */}
        <rect x={pad} y={pad} width={thX - pad} height={thY - pad} fill="#f9fafb" />
        <rect x={thX} y={pad} width={size - pad - thX} height={thY - pad} fill="#fef2f2" fillOpacity={0.5} />
        <rect x={pad} y={thY} width={thX - pad} height={size - pad - thY} fill="#fafafa" />
        <rect x={thX} y={thY} width={size - pad - thX} height={size - pad - thY} fill="#f0fdf4" fillOpacity={0.5} />

        {/* 기준선 */}
        <line x1={thX} y1={pad} x2={thX} y2={size - pad} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4 3" />
        <line x1={pad} y1={thY} x2={size - pad} y2={thY} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4 3" />

        {/* 외곽선 */}
        <rect x={pad} y={pad} width={size - pad * 2} height={size - pad * 2} fill="none" stroke="#e5e7eb" strokeWidth={1} />

        {/* 축 라벨 */}
        <text x={size / 2} y={size - 8} textAnchor="middle" fontSize={10} fill="#6b7280">→ 영향 중대성 (Impact)</text>
        <text x={12} y={size / 2} textAnchor="middle" fontSize={10} fill="#6b7280" transform={`rotate(-90, 12, ${size / 2})`}>↑ 재무 중대성 (Financial)</text>

        {/* 4분면 라벨 */}
        <text x={pad + 4} y={pad + 12} fontSize={8} fill="#9ca3af">재무 중대</text>
        <text x={size - pad - 4} y={pad + 12} fontSize={8} fill="#dc2626" textAnchor="end" fontWeight={700}>이중 중대</text>
        <text x={pad + 4} y={size - pad - 6} fontSize={8} fill="#d1d5db">비중대</text>
        <text x={size - pad - 4} y={size - pad - 6} fontSize={8} fill="#16a34a" textAnchor="end">영향 중대</text>

        {/* 눈금 */}
        {[1, 2, 3, 4, 5].map((v) => (
          <g key={v}>
            <text x={toX(v)} y={size - pad + 14} textAnchor="middle" fontSize={9} fill="#9ca3af">{v}</text>
            <text x={pad - 8} y={toY(v) + 3} textAnchor="end" fontSize={9} fill="#9ca3af">{v}</text>
          </g>
        ))}

        {/* 데이터 포인트 */}
        {assessed.map((issue) => {
          const x = toX(getImpact(issue));
          const y = toY(getFinancial(issue));
          const color = DIM_DOT_COLOR[issue.dimension] ?? "#6b7280";
          return (
            <g key={issue.id}>
              <circle cx={x} cy={y} r={6} fill={color} stroke="white" strokeWidth={2} opacity={0.9} />
              <text x={x + 9} y={y + 3} fontSize={8} fill="#374151">{issue.name.length > 6 ? issue.name.slice(0, 6) + "…" : issue.name}</text>
            </g>
          );
        })}
      </svg>

      {/* 범례 */}
      <div className="text-xs space-y-2 pt-2">
        <p className="font-semibold text-sm">범례</p>
        <div className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full" style={{ background: "#22c55e" }} /> 환경 (E)</div>
        <div className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full" style={{ background: "#3b82f6" }} /> 사회 (S)</div>
        <div className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full" style={{ background: "#d97706" }} /> 거버넌스 (G)</div>
        <div className="mt-3 pt-2 border-t border-border space-y-1 text-muted-foreground">
          <p>점선: 기준선 ({threshold})</p>
          <p>우상단: 이중 중대 (핵심)</p>
          <p>우하단: 영향 중대</p>
          <p>좌상단: 재무 중대</p>
        </div>
      </div>
    </div>
  );
}
