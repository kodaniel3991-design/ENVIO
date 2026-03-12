"use client";

import { cn } from "@/lib/utils";
import type { DataStatus } from "@/types/environment-data";

const STATUS_CONFIG: Record<
  DataStatus,
  { label: string; className: string }
> = {
  verified: {
    label: "Verified",
    className: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  },
  estimated: {
    label: "Estimated",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  pending: {
    label: "Pending",
    className: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",
  },
  missing: {
    label: "Missing",
    className: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  },
  ai_anomaly: {
    label: "AI anomaly",
    className: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30",
  },
};

interface DataStatusBadgeProps {
  status: DataStatus;
  className?: string;
}

/** 데이터 상태 배지 (Verified / Estimated / Pending / Missing / AI anomaly) */
export function DataStatusBadge({ status, className }: DataStatusBadgeProps) {
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
