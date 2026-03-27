"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useWizardStore, WIZARD_STEPS } from "./wizard-store";
import { CheckCircle2, Circle } from "lucide-react";

export default function GettingStartedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const { state, completionPct } = useWizardStore();

  return (
    <div className="flex flex-col gap-6">
      {/* 진행률 바 */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">ESG 초기 설정</h1>
            <p className="text-sm text-muted-foreground">시작하기 전 기본 설정을 완료해 주세요.</p>
          </div>
          <span className="text-2xl font-bold text-primary">{completionPct}%</span>
        </div>

        {/* 프로그레스 바 */}
        <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-2.5 rounded-full bg-primary transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>

        {/* 단계 표시 */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {WIZARD_STEPS.map((s, i) => {
            const done = state.completedSteps.includes(s.step);
            const active = pathname === s.href;
            return (
              <div key={s.step} className="flex items-center gap-1 shrink-0">
                <Link
                  href={s.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : done
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="hidden sm:inline">① </span>
                  {s.title}
                </Link>
                {i < WIZARD_STEPS.length - 1 && (
                  <span className="text-muted-foreground">›</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {children}
    </div>
  );
}
