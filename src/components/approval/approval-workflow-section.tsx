"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ApprovalWorkflowStep } from "@/types/approval-data";
import { cn } from "@/lib/utils";

interface ApprovalWorkflowSectionProps {
  steps: ApprovalWorkflowStep[];
}

/** 승인 프로세스 워크플로우 - 단계별 count, 병목 표시 */
export function ApprovalWorkflowSection({
  steps,
}: ApprovalWorkflowSectionProps) {
  const maxCount = Math.max(...steps.map((s) => s.count), 1);
  const bottleneckIndex = 1; // Pending Approval

  return (
    <Card>
      <CardHeader className="pb-2">
        <h3 className="text-sm font-semibold">승인 프로세스 워크플로우</h3>
        <p className="text-xs text-muted-foreground">
          단계별 건수 · 현재 승인 대기 단계에 병목이 있습니다
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex flex-col rounded-lg border px-4 py-3 min-w-[100px]",
                  index === bottleneckIndex
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
        <div className="mt-4 flex gap-1">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "h-2 flex-1 overflow-hidden rounded-full",
                index === bottleneckIndex ? "bg-amber-500/20" : "bg-muted"
              )}
              title={`${step.label}: ${step.count}`}
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  index === bottleneckIndex ? "bg-amber-500" : "bg-primary/70"
                )}
                style={{ width: `${(step.count / maxCount) * 100}%` }}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
