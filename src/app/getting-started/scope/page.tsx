"use client";

import { useRouter } from "next/navigation";
import { useWizardStore } from "../wizard-store";
import { ALL_SCOPE3_CATEGORIES, getAiRecommendation } from "@/lib/ai-recommendations";
import { ArrowLeft, ArrowRight, Sparkles, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const SCOPE_INFO = {
  1: { label: "Scope 1 — 직접 배출", desc: "사업장에서 직접 발생하는 온실가스 (연료 연소, 공정 배출 등)", color: "text-emerald-600" },
  2: { label: "Scope 2 — 간접 배출 (에너지)", desc: "구매 전력·열 사용에 의한 간접 배출", color: "text-blue-600" },
  3: { label: "Scope 3 — 기타 간접 배출", desc: "공급망, 제품 사용, 임직원 통근 등 가치사슬 전반", color: "text-orange-600" },
};

export default function ScopePage() {
  const router = useRouter();
  const { state, updateScope, markStepComplete } = useWizardStore();
  const { scope, organization } = state;

  const aiRec = organization.industry ? getAiRecommendation(organization.industry) : null;
  const recommendedCategories = aiRec?.scope3Categories ?? [];

  const toggleCategory = (cat: string) => {
    const current = scope.scope3Categories;
    updateScope({
      scope3Categories: current.includes(cat)
        ? current.filter((c) => c !== cat)
        : [...current, cat],
    });
  };

  const handleNext = () => {
    markStepComplete(3);
    router.push("/getting-started/kpi");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6">
        <h2 className="text-base font-bold text-foreground">③ Scope 설정</h2>
        <p className="text-sm text-muted-foreground">배출량 수집 범위를 설정합니다. Scope 3는 선택형으로 AI가 추천합니다.</p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Scope 1 */}
        <div className={cn("rounded-xl border p-4", scope.scope1 ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30" : "border-border")}>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-foreground">{SCOPE_INFO[1].label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{SCOPE_INFO[1].desc}</p>
            </div>
            <button
              onClick={() => updateScope({ scope1: !scope.scope1 })}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                scope.scope1 ? "bg-emerald-500" : "bg-muted"
              )}
            >
              <span className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                scope.scope1 ? "translate-x-5" : "translate-x-0.5"
              )} />
            </button>
          </div>
        </div>

        {/* Scope 2 */}
        <div className={cn("rounded-xl border p-4", scope.scope2 ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30" : "border-border")}>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-foreground">{SCOPE_INFO[2].label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{SCOPE_INFO[2].desc}</p>
            </div>
            <button
              onClick={() => updateScope({ scope2: !scope.scope2 })}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                scope.scope2 ? "bg-blue-500" : "bg-muted"
              )}
            >
              <span className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                scope.scope2 ? "translate-x-5" : "translate-x-0.5"
              )} />
            </button>
          </div>
        </div>

        {/* Scope 3 카테고리 */}
        <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-800 dark:bg-orange-950/20">
          <div className="mb-3">
            <p className="font-semibold text-foreground">{SCOPE_INFO[3].label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{SCOPE_INFO[3].desc}</p>
          </div>

          {aiRec && (
            <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400">
              <Sparkles className="h-3.5 w-3.5" />
              {organization.industry} 산업 AI 추천 카테고리가 강조 표시됩니다
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {ALL_SCOPE3_CATEGORIES.map((cat) => {
              const selected = scope.scope3Categories.includes(cat);
              const recommended = recommendedCategories.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    "relative rounded-lg border px-3 py-1.5 text-xs transition-all",
                    selected
                      ? "border-orange-400 bg-orange-100 font-semibold text-orange-800 dark:border-orange-700 dark:bg-orange-900 dark:text-orange-300"
                      : recommended
                      ? "border-violet-300 bg-violet-50 text-violet-700 hover:border-violet-400 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-400"
                      : "border-border text-muted-foreground hover:border-orange-300 hover:text-foreground"
                  )}
                >
                  {recommended && !selected && (
                    <Sparkles className="mr-1 inline h-3 w-3 text-violet-500" />
                  )}
                  {cat}
                </button>
              );
            })}
          </div>

          {scope.scope3Categories.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              선택된 카테고리: {scope.scope3Categories.length}개
            </p>
          )}
        </div>

        {/* 안내 */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Scope 3는 이후 언제든지 추가·변경할 수 있습니다.
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => router.push("/getting-started/facility")}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> 이전
        </button>
        <button
          onClick={handleNext}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          다음: KPI 선택 <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
