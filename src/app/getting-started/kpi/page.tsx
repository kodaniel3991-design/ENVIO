"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "../wizard-store";
import { ALL_KPI, getAiRecommendation } from "@/lib/ai-recommendations";
import { Sparkles, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type KpiCategory = "environmental" | "social" | "governance";

const CATEGORY_LABELS: Record<KpiCategory, { label: string; emoji: string; color: string }> = {
  environmental: { label: "환경 (Environmental)", emoji: "🌿", color: "emerald" },
  social: { label: "사회 (Social)", emoji: "🤝", color: "blue" },
  governance: { label: "거버넌스 (Governance)", emoji: "⚖️", color: "violet" },
};

export default function KpiPage() {
  const router = useRouter();
  const { state, updateKpi, markStepComplete } = useWizardStore();
  const { kpi, organization } = state;

  const aiRec = organization.industry ? getAiRecommendation(organization.industry) : null;

  // 산업 선택 시 AI 추천 KPI 자동 선택 (첫 방문 시)
  useEffect(() => {
    if (aiRec && !state.completedSteps.includes(4)) {
      if (kpi.environmental.length === 0 && kpi.social.length === 0) {
        updateKpi({
          environmental: aiRec.kpi.environmental,
          social: aiRec.kpi.social,
          governance: aiRec.kpi.governance,
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (category: KpiCategory, item: string) => {
    const current = kpi[category];
    updateKpi({
      [category]: current.includes(item)
        ? current.filter((k) => k !== item)
        : [...current, item],
    });
  };

  const handleNext = () => {
    markStepComplete(4);
    router.push("/getting-started/framework");
  };

  const totalSelected = kpi.environmental.length + kpi.social.length + kpi.governance.length;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-2">
        <h2 className="text-base font-bold text-foreground">④ KPI 선택</h2>
        <p className="text-sm text-muted-foreground">
          관리할 ESG KPI를 선택해 주세요.
          {aiRec && (
            <span className="ml-2 inline-flex items-center gap-1 text-violet-600 dark:text-violet-400">
              <Sparkles className="h-3 w-3" />
              {organization.industry} 산업 AI 추천이 자동 적용됐습니다.
            </span>
          )}
        </p>
      </div>

      {aiRec && (
        <div className="mb-5 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 dark:border-violet-800 dark:bg-violet-950">
          <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">
            💡 AI 추천 기준: {organization.industry} 산업에서 주로 보고되는 핵심 KPI가 체크됩니다.
            필요에 따라 추가/제거해 주세요.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-5">
        {(["environmental", "social", "governance"] as KpiCategory[]).map((cat) => {
          const meta = CATEGORY_LABELS[cat];
          const recommended = aiRec?.kpi[cat] ?? [];
          return (
            <div key={cat}>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <span>{meta.emoji}</span> {meta.label}
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  {kpi[cat].length}개 선택
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_KPI[cat].map((item) => {
                  const selected = kpi[cat].includes(item);
                  const isAiRec = recommended.includes(item);
                  return (
                    <button
                      key={item}
                      onClick={() => toggle(cat, item)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all",
                        selected
                          ? cat === "environmental"
                            ? "border-emerald-400 bg-emerald-100 font-semibold text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                            : cat === "social"
                            ? "border-blue-400 bg-blue-100 font-semibold text-blue-800 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            : "border-violet-400 bg-violet-100 font-semibold text-violet-800 dark:border-violet-700 dark:bg-violet-900 dark:text-violet-300"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      {isAiRec && <Sparkles className="h-3 w-3 text-violet-500 shrink-0" />}
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
        <p className="text-xs text-muted-foreground">
          총 <span className="font-semibold text-foreground">{totalSelected}개</span> KPI 선택됨
          {aiRec && (
            <span className="ml-2 text-violet-600 dark:text-violet-400">
              (AI 추천 포함)
            </span>
          )}
        </p>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => router.push("/getting-started/scope")}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> 이전
        </button>
        <button
          onClick={handleNext}
          disabled={totalSelected === 0}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-40 hover:opacity-90"
        >
          다음: 공시 기준 선택 <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
