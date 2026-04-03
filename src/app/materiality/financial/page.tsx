"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getMaterialityIssues, saveMaterialityIssues } from "@/services/api";
import { PageHeader } from "@/components/layout/page-header";
import { MaterialitySubNav } from "@/components/materiality/materiality-sub-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Leaf, Users, Scale, Save, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MaterialityIssue, MaterialityEsgDimension } from "@/types";

const DIM_LABEL: Record<MaterialityEsgDimension, string> = { environment: "환경", social: "사회", governance: "거버넌스" };
const DIM_ICON: Record<MaterialityEsgDimension, typeof Leaf> = { environment: Leaf, social: Users, governance: Scale };
const DIM_COLOR: Record<MaterialityEsgDimension, string> = { environment: "text-green-600 bg-green-100", social: "text-blue-600 bg-blue-100", governance: "text-amber-700 bg-amber-100" };
const THRESHOLD = 3.5;
const FINANCIAL_OPTIONS = [
  { value: 1, label: "거의 없음", desc: "재무 영향 미미" },
  { value: 2, label: "낮음", desc: "소규모 비용 영향" },
  { value: 3, label: "보통", desc: "관리 필요 수준" },
  { value: 4, label: "높음", desc: "상당한 재무 리스크" },
  { value: 5, label: "매우 높음", desc: "사업 지속성 위협" },
];

function Selector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {FINANCIAL_OPTIONS.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={cn("flex-1 rounded-md border px-1 py-1.5 text-center transition-all",
            value === o.value ? "border-blue-500 bg-blue-50 text-blue-700 font-bold" : "border-border text-muted-foreground hover:border-blue-300"
          )}>
          <p className="text-[11px] font-semibold">{o.label}</p><p className="text-[9px] opacity-70">{o.desc}</p>
        </button>
      ))}
    </div>
  );
}

export default function FinancialPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: issues = [] } = useQuery<MaterialityIssue[]>({ queryKey: ["materiality-issues"], queryFn: getMaterialityIssues });
  const [edits, setEdits] = useState<Record<string, number>>({});
  const hasEdits = Object.keys(edits).length > 0;

  const saveMutation = useMutation({
    mutationFn: saveMaterialityIssues,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["materiality-issues"] }); setEdits({}); toast.success("재무 중대성 평가가 저장되었습니다."); },
  });

  const getFinancial = (i: MaterialityIssue) => edits[i.id] ?? i.financialScore ?? 3;
  const handleChange = (id: string, v: number) => setEdits((p) => ({ ...p, [id]: v }));

  const handleSave = () => {
    const updated = issues.filter((i) => edits[i.id] != null).map((i) => ({ ...i, financialScore: edits[i.id] }));
    if (updated.length > 0) saveMutation.mutate(updated);
  };

  const handleNext = () => { if (hasEdits) handleSave(); router.push("/materiality/result"); };

  return (
    <div>
      <PageHeader title="이중 중대성 평가" description="ESG 이슈의 영향 중대성과 재무 중대성을 단계별로 평가합니다 — CSRD/GRI 기준">
        <MaterialitySubNav />
      </PageHeader>
      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">③ 재무 중대성 평가</CardTitle>
              <p className="text-sm text-muted-foreground">각 이슈가 기업 재무에 미치는 리스크와 기회 수준을 평가해 주세요.</p>
            </div>
            {hasEdits && <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}><Save className="mr-1 h-3.5 w-3.5" /> 저장</Button>}
          </CardHeader>
          <CardContent className="space-y-2">
            {issues.map((issue) => {
              const Icon = DIM_ICON[issue.dimension]; const color = DIM_COLOR[issue.dimension];
              const fin = getFinancial(issue); const isExpanded = expandedId === issue.id;
              return (
                <div key={issue.id} className={cn("rounded-lg border transition-all", fin >= THRESHOLD ? "border-blue-300 bg-blue-50/30" : "border-border")}>
                  <button type="button" onClick={() => setExpandedId(isExpanded ? null : issue.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", color)}><Icon className="mr-0.5 inline h-3 w-3" />{DIM_LABEL[issue.dimension]}</span>
                    <span className="flex-1 text-sm font-semibold">{issue.name}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", fin >= THRESHOLD ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground")}>재무 {fin.toFixed(1)}</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border px-4 py-4 space-y-3">
                      {issue.description && <p className="text-xs text-muted-foreground">{issue.description}</p>}
                      <p className="text-xs font-semibold">이 이슈가 기업 재무에 미치는 리스크/기회는 어느 수준인가요?</p>
                      <Selector value={fin} onChange={(v) => handleChange(issue.id, v)} />
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
      <div className="mt-6 flex justify-end">
        <button onClick={handleNext} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
          다음: 결과 확인 <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
