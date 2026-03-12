"use client";

import { cn } from "@/lib/utils";
import type { ApprovalStatus } from "@/types/approval-data";

const STATUS_CONFIG: Record<
  ApprovalStatus,
  { label: string; className: string }
> = {
  pending_approval: {
    label: "Pending Approval",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  approved: {
    label: "Approved",
    className: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-600/30",
  },
  reopened: {
    label: "Reopened",
    className: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",
  },
};

interface ApprovalStatusBadgeProps {
  status: ApprovalStatus;
  className?: string;
}

/** 승인 상태 배지 */
export function ApprovalStatusBadge({ status, className }: ApprovalStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
