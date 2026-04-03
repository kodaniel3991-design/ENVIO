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
const SEVERITY = [
  { value: 1, label: "경미", desc: "거의 영향 없음" },
  { value: 2, label: "보통", desc: "제한적 영향" },
  { value: 3, label: "유의", desc: "눈에 띄는 영향" },
  { value: 4, label: "심각", desc: "상당한 영향" },
  { value: 5, label: "치명적", desc: "극심한 영향" },
];

interface EditScore { scale: number; scope: number; irremediability: number; }
function calcImpact(s: EditScore) { return Math.round(((s.scale + s.scope + s.irremediability) / 3) * 100) / 100; }

function Selector({ value, onChange, options }: { value: number; onChange: (v: number) => void; options: typeof SEVERITY }) {
  return (
    <div className="flex gap-1">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={cn("flex-1 rounded-md border px-1 py-1.5 text-center transition-all",
            value === o.value ? "border-primary bg-primary/10 text-primary font-bold" : "border-border text-muted-foreground hover:border-primary/40"
          )}>
          <p className="text-[11px] font-semibold">{o.label}</p><p className="text-[9px] opacity-70">{o.desc}</p>
        </button>
      ))}
    </div>
  );
}

export default function ImpactPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: issues = [] } = useQuery<MaterialityIssue[]>({ queryKey: ["materiality-issues"], queryFn: getMaterialityIssues });
  const [edits, setEdits] = useState<Record<string, EditScore>>({});
  const hasEdits = Object.keys(edits).length > 0;

  const saveMutation = useMutation({
    mutationFn: saveMaterialityIssues,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["materiality-issues"] }); setEdits({}); toast.success("영향 중대성 평가가 저장되었습니다."); },
  });

  const getScore = (i: MaterialityIssue): EditScore => edits[i.id] ?? { scale: i.impactScale ?? 3, scope: i.impactScope ?? 3, irremediability: i.impactIrremediability ?? 3 };
  const handleChange = (id: string, field: keyof EditScore, value: number) => {
    const issue = issues.find((i) => i.id === id); if (!issue) return;
    setEdits((p) => ({ ...p, [id]: { ...getScore(issue), [field]: value } }));
  };

  const handleSave = () => {
    const updated = issues.filter((i) => edits[i.id]).map((i) => {
      const s = edits[i.id]; const impact = calcImpact(s);
      return { ...i, impactScale: s.scale, impactScope: s.scope, impactIrremediability: s.irremediability, impactScore: impact };
    });
    if (updated.length > 0) saveMutation.mutate(updated);
  };

  const handleNext = () => { if (hasEdits) handleSave(); router.push("/materiality/financial"); };

  return (
    <div>
      <PageHeader title="이중 중대성 평가" description="ESG 이슈의 영향 중대성과 재무 중대성을 단계별로 평가합니다 — CSRD/GRI 기준">
        <MaterialitySubNav />
      </PageHeader>
      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">② 영향 중대성 평가 (GRI 심각성 3요소)</CardTitle>
              <p className="text-sm text-muted-foreground">각 이슈가 환경·사회에 미치는 영향의 규모, 범위, 복구불가성을 평가해 주세요.</p>
            </div>
            {hasEdits && <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}><Save className="mr-1 h-3.5 w-3.5" /> 저장</Button>}
          </CardHeader>
          <CardContent className="space-y-2">
            {issues.map((issue) => {
              const Icon = DIM_ICON[issue.dimension]; const color = DIM_COLOR[issue.dimension];
              const s = getScore(issue); const impact = calcImpact(s); const isExpanded = expandedId === issue.id;
              return (
                <div key={issue.id} className={cn("rounded-lg border transition-all", impact >= THRESHOLD ? "border-green-300 bg-green-50/30" : "border-border")}>
                  <button type="button" onClick={() => setExpandedId(isExpanded ? null : issue.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", color)}><Icon className="mr-0.5 inline h-3 w-3" />{DIM_LABEL[issue.dimension]}</span>
                    <span className="flex-1 text-sm font-semibold">{issue.name}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", impact >= THRESHOLD ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground")}>영향 {impact.toFixed(1)}</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border px-4 py-4 space-y-4">
                      <div><p className="text-xs font-semibold mb-1.5">이 이슈의 영향이 얼마나 심각한가요? <span className="text-muted-foreground font-normal">(규모)</span></p>
                        <Selector value={s.scale} onChange={(v) => handleChange(issue.id, "scale", v)} options={SEVERITY} /></div>
                      <div><p className="text-xs font-semibold mb-1.5">영향을 받는 대상 범위가 얼마나 넓은가요? <span className="text-muted-foreground font-normal">(범위)</span></p>
                        <Selector value={s.scope} onChange={(v) => handleChange(issue.id, "scope", v)} options={SEVERITY} /></div>
                      <div><p className="text-xs font-semibold mb-1.5">발생 시 원상복구가 가능한가요? <span className="text-muted-foreground font-normal">(복구불가성)</span></p>
                        <Selector value={s.irremediability} onChange={(v) => handleChange(issue.id, "irremediability", v)} options={SEVERITY} /></div>
                      <div className="rounded-lg bg-muted/30 p-3">
                        <p className="text-[10px] text-muted-foreground">({s.scale} + {s.scope} + {s.irremediability}) ÷ 3</p>
                        <p className="text-sm font-bold">= {impact.toFixed(2)} {impact >= THRESHOLD ? "✓ 중대" : ""}</p>
                      </div>
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
          다음: 재무 중대성 <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
