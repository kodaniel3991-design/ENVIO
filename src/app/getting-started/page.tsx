"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWizardStore, WIZARD_STEPS } from "./wizard-store";
import { CheckCircle2, ArrowRight, Sparkles, GitBranch, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const DataFlowMap = dynamic(
  () => import("@/components/getting-started/data-flow-map").then((m) => ({ default: m.DataFlowMap })),
  { ssr: false }
);

const STEP_DESCRIPTIONS: Record<number, string> = {
  1: "회사명, 산업군, 국가, 직원 수를 입력합니다. 산업군 선택 시 AI가 최적 KPI를 자동 추천합니다.",
  2: "사업장명, 위치, 유형을 등록합니다. Scope 1/2 배출량이 자동 연결됩니다.",
  3: "Scope 1/2/3 사용 여부와 Scope 3 카테고리를 선택합니다.",
  4: "GRI, ISSB, CDP 등 공시 기준을 선택하면 KPI가 자동 매핑됩니다.",
  5: "환경·사회·거버넌스 KPI를 선택합니다. 공시 기준 기반 추천 KPI가 자동으로 표시됩니다.",
};

function FlowMapSection() {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center gap-2.5 px-5 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <GitBranch className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">데이터 흐름 구조</span>
        <span className="text-xs text-muted-foreground">KPI 설정 → 배출원 등록 → 데이터 입력 → 자동 집계</span>
        <ChevronDown className={cn("ml-auto h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-border px-5 py-4">
          <DataFlowMap />
        </div>
      )}
    </div>
  );
}

export default function GettingStartedPage() {
  const { state, hydrated, markStepComplete } = useWizardStore();

  // DB 데이터 기준으로 완료 상태 동기화
  useEffect(() => {
    if (!hydrated) return;
    fetch("/api/organization")
      .then((r) => r.json())
      .then((org) => {
        if (!org || !org.organizationName) return;
        if (org.organizationName && org.organizationName !== "조직") markStepComplete(1);
        if (org.worksites?.length > 0 || state.facilities?.some((f: any) => f.name?.trim())) markStepComplete(2);
        if (org.scope3Categories !== undefined && org.scope3Categories !== null) markStepComplete(3);
        if (org.selectedFrameworks?.length > 0) markStepComplete(4);
      })
      .catch(() => {});
    fetch("/api/kpi?type=master")
      .then((r) => r.json())
      .then((kpis) => {
        if (Array.isArray(kpis) && kpis.length > 0) markStepComplete(5);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const allDone = state.completedSteps.length === 5;

  return (
    <div className="flex flex-col gap-4">
      {/* 완료 배너 */}
      {allDone && (
        <div className="rounded-xl border border-border bg-green-50 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-carbon-success" />
            <div>
              <p className="font-semibold text-foreground">초기 설정 완료!</p>
              <p className="text-sm text-muted-foreground">
                모든 설정이 완료됐습니다. 대시보드에서 ESG 현황을 확인하세요.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="ml-auto flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              대시보드로 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* 데이터 흐름 마인드맵 */}
      <FlowMapSection />

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
                  ? "border-border bg-green-50/50"
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
                        ? "bg-green-50 text-carbon-success"
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
              <p className="text-sm text-muted-foreground leading-relaxed">
                {STEP_DESCRIPTIONS[s.step]}
              </p>
              {(s.step === 1 || s.step === 4 || s.step === 5) && (
                <div className="flex items-center gap-1 text-[11px] font-medium text-carbon-success">
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

    </div>
  );
}
