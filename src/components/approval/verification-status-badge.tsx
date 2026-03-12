"use client";

import { cn } from "@/lib/utils";
import type { VerificationStatusBadge } from "@/types/approval-data";

const CONFIG: Record<VerificationStatusBadge, { label: string; className: string }> = {
  verified: {
    label: "Verified",
    className: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  },
  needs_review: {
    label: "Needs Review",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
};

interface VerificationStatusBadgeProps {
  status: VerificationStatusBadge;
  className?: string;
}

/** 검증 상태 배지 (승인 테이블용) */
export function VerificationStatusBadge({ status, className }: VerificationStatusBadgeProps) {
  const c = CONFIG[status] ?? { label: status, className: "bg-muted text-muted-foreground border-border" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        c.className,
        className
      )}
    >
      {c.label}
    </span>
  );
}
