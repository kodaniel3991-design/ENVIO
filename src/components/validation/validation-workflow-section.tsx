"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ValidationWorkflowStep } from "@/types/validation-data";
import { cn } from "@/lib/utils";

interface ValidationWorkflowSectionProps {
  steps: ValidationWorkflowStep[];
}

/** 검토 워크플로우 현황 - Submitted / Under Review / Verified */
export function ValidationWorkflowSection({
  steps,
}: ValidationWorkflowSectionProps) {
  const maxCount = Math.max(...steps.map((s) => s.count), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <h3 className="text-sm font-semibold">검토 워크플로우 현황</h3>
        <p className="text-xs text-muted-foreground">
          단계별 건수 · 현재 검토 대기/검토 중에 가장 많이 몰려 있습니다
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-4">
              <div
                className={cn(
                  "flex flex-col rounded-lg border px-4 py-3 min-w-[100px]",
                  index === 1
                    ? "border-amber-500/40 bg-amber-500/5"
                    : "border-border bg-muted/30"
                )}
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {step.label}
                </span>
                <span className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                  {step.count}
                </span>
                {step.description && (
                  <span className="mt-0.5 text-xs text-muted-foreground">
                    {step.description}
                  </span>
                )}
              </div>
              {index < steps.length - 1 && (
                <span className="text-muted-foreground/50">→</span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
              title={`${step.label}: ${step.count}`}
            >
              <div
                className="h-full rounded-full bg-primary/70 transition-all"
                style={{ width: `${(step.count / maxCount) * 100}%` }}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
