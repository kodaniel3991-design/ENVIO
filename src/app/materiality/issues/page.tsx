"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getMaterialityIssues, saveMaterialityIssues } from "@/services/api";
import { getMaterialityScoreRecommendation, getMaterialityScoreWithReason } from "@/lib/ai-recommendations";
import { PageHeader } from "@/components/layout/page-header";
import { MaterialitySubNav } from "@/components/materiality/materiality-sub-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Leaf, Users, Scale, RefreshCw, AlertTriangle, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MaterialityIssue, MaterialityEsgDimension } from "@/types";

const DIM_LABEL: Record<MaterialityEsgDimension, string> = { environment: "환경", social: "사회", governance: "거버넌스" };
const DIM_ICON: Record<MaterialityEsgDimension, typeof Leaf> = { environment: Leaf, social: Users, governance: Scale };
const DIM_COLOR: Record<MaterialityEsgDimension, string> = { environment: "text-green-600 bg-green-100", social: "text-blue-600 bg-blue-100", governance: "text-amber-700 bg-amber-100" };
const THRESHOLD = 3.5;

export default function MaterialityIssuesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [industry, setIndustry] = useState("");

  useEffect(() => {
    try { const s = localStorage.getItem("esg_setup_wizard"); if (s) setIndustry(JSON.parse(s).organization?.industry ?? ""); } catch {}
  }, []);

  const { data: issues = [], isLoading } = useQuery<MaterialityIssue[]>({ queryKey: ["materiality-issues"], queryFn: getMaterialityIssues });

  const generateMutation = useMutation({
    mutationFn: async () => { const r = await fetch("/api/materiality?type=generate"); if (!r.ok) throw new Error(""); return r.json(); },
    onSuccess: (d) => { queryClient.invalidateQueries({ queryKey: ["materiality-issues"] }); toast.success(`${d.count}개 이슈 생성`); },
  });

  const saveMutation = useMutation({
    mutationFn: saveMaterialityIssues,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["materiality-issues"] }); toast.success("AI 추천 점수가 적용되었습니다."); },
  });

  const applyAiScores = () => {
    const updated = issues.map((issue) => {
      const rec = getMaterialityScoreRecommendation(industry, issue.kpiGroup ?? issue.name);
      const impact = Math.round(((rec.scale + rec.scope + rec.irremediability) / 3) * 100) / 100;
      return { ...issue, impactScale: rec.scale, impactScope: rec.scope, impactIrremediability: rec.irremediability, impactScore: impact, financialScore: rec.financial };
    });
    saveMutation.mutate(updated);
  };

  return (
    <div>
      <PageHeader title="이중 중대성 평가" description="ESG 이슈의 영향 중대성과 재무 중대성을 단계별로 평가합니다 — CSRD/GRI 기준">
        <MaterialitySubNav />
      </PageHeader>
      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">① 평가 대상 ESG 이슈 확인</CardTitle>
              <p className="text-sm text-muted-foreground">KPI 카탈로그 그룹 기반 {issues.length}개 이슈. AI 추천 점수를 적용한 후 다음 단계로 진행하세요.</p>
            </div>
            <div className="flex gap-2">
              {issues.length === 0 && (
                <Button size="sm" variant="outline" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
                  <RefreshCw className="mr-1 h-3.5 w-3.5" /> 이슈 자동 생성
                </Button>
              )}
              {issues.length > 0 && (
                <Button size="sm" onClick={applyAiScores} disabled={saveMutation.isPending}>
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" /> AI 추천 점수 적용{industry && ` (${industry})`}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <p className="text-sm text-muted-foreground">불러오는 중...</p> : issues.length === 0 ? (
              <div className="py-8 text-center"><AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">이슈가 없습니다. &ldquo;이슈 자동 생성&rdquo;을 클릭하세요.</p></div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {(["environment", "social", "governance"] as const).map((dim) => {
                  const dimIssues = issues.filter((i) => i.dimension === dim);
                  const Icon = DIM_ICON[dim];
                  const color = DIM_COLOR[dim];
                  return (
                    <div key={dim} className="rounded-lg border border-border p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={cn("rounded px-2 py-1 text-xs font-bold", color)}><Icon className="mr-1 inline h-3.5 w-3.5" />{DIM_LABEL[dim]}</span>
                        <span className="text-sm text-muted-foreground">{dimIssues.length}개</span>
                      </div>
                      <div className="space-y-1.5">
                        {dimIssues.map((issue) => {
                          const hasScore = issue.impactScore != null;
                          return (
                            <div key={issue.id} className="flex items-center justify-between rounded border border-border/50 px-3 py-2 text-xs">
                              <span className="font-medium">{issue.name}</span>
                              <div className="flex items-center gap-2">
                                {hasScore ? (
                                  <>
                                    <span className="text-muted-foreground">영향 <strong className="text-foreground">{(issue.impactScore ?? 0).toFixed(1)}</strong></span>
                                    <span className="text-muted-foreground">재무 <strong className="text-foreground">{(issue.financialScore ?? 0).toFixed(1)}</strong></span>
                                  </>
                                ) : (
                                  <span className="text-amber-500">미평가</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* AI 추천 점수 근거 */}
      {issues.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> AI 추천 점수 근거
                {industry && <span className="text-xs font-normal text-muted-foreground">— {industry} 산업 기준</span>}
              </CardTitle>
              <p className="text-xs text-muted-foreground">산업 특성과 글로벌 ESG 프레임워크 요구사항에 기반한 추천 점수입니다.</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-2 pr-2 font-medium">영역</th>
                      <th className="py-2 pr-2 font-medium">이슈</th>
                      <th className="py-2 pr-2 font-medium text-center">규모</th>
                      <th className="py-2 pr-2 font-medium text-center">범위</th>
                      <th className="py-2 pr-2 font-medium text-center">복구불가</th>
                      <th className="py-2 pr-2 font-medium text-center">영향</th>
                      <th className="py-2 pr-2 font-medium text-center">재무</th>
                      <th className="py-2 font-medium">추천 근거</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {issues.map((issue) => {
                      const rec = getMaterialityScoreWithReason(industry, issue.kpiGroup ?? issue.name);
                      const impact = ((rec.scale + rec.scope + rec.irremediability) / 3);
                      const isMaterial = impact >= THRESHOLD || rec.financial >= THRESHOLD;
                      const color = DIM_COLOR[issue.dimension];
                      return (
                        <tr key={issue.id} className={isMaterial ? "bg-primary/[0.02]" : ""}>
                          <td className="py-2 pr-2">
                            <span className={cn("rounded px-1 py-0.5 text-[9px] font-bold", color)}>{DIM_LABEL[issue.dimension].charAt(0)}</span>
                          </td>
                          <td className="py-2 pr-2 font-medium whitespace-nowrap">{issue.name}</td>
                          <td className="py-2 pr-2 text-center">{rec.scale}</td>
                          <td className="py-2 pr-2 text-center">{rec.scope}</td>
                          <td className="py-2 pr-2 text-center">{rec.irremediability}</td>
                          <td className="py-2 pr-2 text-center">
                            <span className={cn("font-bold", impact >= THRESHOLD ? "text-green-600" : "")}>{impact.toFixed(1)}</span>
                          </td>
                          <td className="py-2 pr-2 text-center">
                            <span className={cn("font-bold", rec.financial >= THRESHOLD ? "text-blue-600" : "")}>{rec.financial}</span>
                          </td>
                          <td className="py-2 text-muted-foreground">
                            {rec.reason}
                            {rec.hasIndustryAdjustment && (
                              <span className="ml-1 rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold text-amber-700">{industry} 가중</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button onClick={() => router.push("/materiality/impact")}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
          다음: 영향 중대성 <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
