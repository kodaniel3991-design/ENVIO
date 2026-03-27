"use client";

import { useRouter } from "next/navigation";
import { useWizardStore } from "../wizard-store";
import { FRAMEWORKS, getAiRecommendation } from "@/lib/ai-recommendations";
import { Sparkles, CheckCircle2, ArrowLeft, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FrameworkPage() {
  const router = useRouter();
  const { state, updateFramework, markStepComplete } = useWizardStore();
  const { framework, organization, kpi } = state;

  const aiRec = organization.industry ? getAiRecommendation(organization.industry) : null;
  const recommendedFrameworks = aiRec?.frameworks ?? [];

  const toggle = (id: string) => {
    const current = framework.selected;
    updateFramework({
      selected: current.includes(id) ? current.filter((f) => f !== id) : [...current, id],
    });
  };

  // 선택된 프레임워크에 따른 KPI 매핑 미리보기
  const mappedKpis: string[] = [];
  if (framework.selected.includes("GRI")) mappedKpis.push(...(kpi.environmental.slice(0, 2)), ...(kpi.social.slice(0, 1)));
  if (framework.selected.includes("ISSB")) mappedKpis.push(...(kpi.environmental.slice(0, 2)));
  if (framework.selected.includes("CDP")) mappedKpis.push(kpi.environmental[0] ?? "");
  if (framework.selected.includes("K-ESG")) mappedKpis.push(...(kpi.governance.slice(0, 2)));
  const uniqueMapped = mappedKpis.filter((k, i, arr) => k && arr.indexOf(k) === i);

  const handleComplete = () => {
    markStepComplete(5);
    router.push("/getting-started");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6">
        <h2 className="text-base font-bold text-foreground">⑤ 공시 기준 선택</h2>
        <p className="text-sm text-muted-foreground">
          공시 프레임워크를 선택하면 KPI가 자동 매핑됩니다.
          {aiRec && (
            <span className="ml-2 inline-flex items-center gap-1 text-violet-600 dark:text-violet-400">
              <Sparkles className="h-3 w-3" />
              {organization.industry} 산업 AI 추천 포함
            </span>
          )}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FRAMEWORKS.map((fw) => {
          const selected = framework.selected.includes(fw.id);
          const recommended = recommendedFrameworks.includes(fw.id);
          return (
            <button
              key={fw.id}
              onClick={() => toggle(fw.id)}
              className={cn(
                "relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : recommended
                  ? "border-violet-300 bg-violet-50/50 dark:border-violet-700 dark:bg-violet-950/20"
                  : "border-border hover:border-primary/30"
              )}
            >
              {/* 선택 체크 */}
              {selected && (
                <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-primary" />
              )}

              {/* 배지 */}
              <div className="flex items-center gap-2">
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                  selected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {fw.id}
                </span>
                {recommended && (
                  <span className="flex items-center gap-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                    <Sparkles className="h-3 w-3" /> AI 추천
                  </span>
                )}
                <span className="ml-auto text-[10px] text-muted-foreground">{fw.badge}</span>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground">{fw.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{fw.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* KPI 자동 매핑 미리보기 */}
      {framework.selected.length > 0 && uniqueMapped.length > 0 && (
        <div className="mt-5 rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-950">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-violet-700 dark:text-violet-400">
            <Sparkles className="h-4 w-4" />
            자동 매핑된 KPI 미리보기
          </p>
          <div className="flex flex-wrap gap-1.5">
            {uniqueMapped.map((k) => (
              <span
                key={k}
                className="rounded-full border border-violet-200 bg-white px-2.5 py-0.5 text-xs text-violet-700 dark:border-violet-700 dark:bg-violet-900 dark:text-violet-300"
              >
                {k}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            선택한 프레임워크({framework.selected.join(", ")})에 해당 KPI들이 자동으로 매핑됩니다.
          </p>
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => router.push("/getting-started/kpi")}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> 이전
        </button>
        <button
          onClick={handleComplete}
          disabled={framework.selected.length === 0}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40 hover:opacity-90"
        >
          <PartyPopper className="h-4 w-4" />
          설정 완료!
        </button>
      </div>
    </div>
  );
}
