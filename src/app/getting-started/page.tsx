"use client";

import Link from "next/link";
import { useWizardStore, WIZARD_STEPS } from "./wizard-store";
import { CheckCircle2, Circle, ArrowRight, Sparkles, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

const STEP_DESCRIPTIONS: Record<number, string> = {
  1: "회사명, 산업군, 국가, 직원 수를 입력합니다. 산업군 선택 시 AI가 최적 KPI를 자동 추천합니다.",
  2: "사업장명, 위치, 유형을 등록합니다. Scope 1/2 배출량이 자동 연결됩니다.",
  3: "Scope 1/2/3 사용 여부와 Scope 3 카테고리를 선택합니다.",
  4: "환경·사회·거버넌스 KPI를 선택합니다. 산업별 AI 추천 KPI가 자동으로 표시됩니다.",
  5: "GRI, ISSB, CDP 등 공시 기준을 선택하면 KPI가 자동 매핑됩니다.",
};

export default function GettingStartedPage() {
  const { state, completionPct, reset, loadDummy } = useWizardStore();

  const allDone = state.completedSteps.length === 5;

  return (
    <div className="flex flex-col gap-4">
      {/* 완료 배너 */}
      {allDone && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">초기 설정 완료!</p>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                모든 설정이 완료됐습니다. 대시보드에서 ESG 현황을 확인하세요.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="ml-auto flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              대시보드로 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* 단계별 카드 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {WIZARD_STEPS.map((s) => {
          const done = state.completedSteps.includes(s.step);
          const isNext = !done && state.completedSteps.length === s.step - 1;
          return (
            <Link
              key={s.step}
              href={s.href}
              className={cn(
                "group flex flex-col gap-3 rounded-xl border p-5 transition-all hover:shadow-md",
                done
                  ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30"
                  : isNext
                  ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-card hover:border-primary/30"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold",
                      done
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400"
                        : isNext
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {done ? <CheckCircle2 className="h-4 w-4" /> : s.step}
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{s.title}</p>
                    <p className="text-[11px] text-muted-foreground">{s.subtitle}</p>
                  </div>
                </div>
                {isNext && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    다음 단계
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {STEP_DESCRIPTIONS[s.step]}
              </p>
              {(s.step === 1 || s.step === 4 || s.step === 5) && (
                <div className="flex items-center gap-1 text-[11px] font-medium text-violet-600 dark:text-violet-400">
                  <Sparkles className="h-3 w-3" />
                  AI 자동 추천 포함
                </div>
              )}
              <div className="mt-auto flex items-center justify-end gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                {done ? "다시 편집" : "시작하기"} <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* 하단 버튼 */}
      <div className="flex items-center justify-between">
        <button
          onClick={loadDummy}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
        >
          <FlaskConical className="h-3.5 w-3.5" />
          샘플 데이터 적용
        </button>
        {state.completedSteps.length > 0 && (
          <button
            onClick={reset}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            설정 초기화
          </button>
        )}
      </div>
    </div>
  );
}
