"use client";

import { cn } from "@/lib/utils";
import type { SubmissionStatus } from "@/types/supplier-portal";

const CONFIG: Record<SubmissionStatus, { label: string; className: string }> = {
  verified: {
    label: "검증완료",
    className: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  },
  submitted: {
    label: "제출중",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  },
  in_progress: {
    label: "진행중",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  not_started: {
    label: "미시작",
    className: "bg-muted text-muted-foreground border-border",
  },
  overdue: {
    label: "기한초과",
    className: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  },
};

interface SubmissionStatusBadgeProps {
  status: SubmissionStatus;
  className?: string;
}

/** 제출 상태 배지 */
export function SubmissionStatusBadge({ status, className }: SubmissionStatusBadgeProps) {
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
