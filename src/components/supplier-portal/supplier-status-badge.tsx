"use client";

import { cn } from "@/lib/utils";
import type { SupplierStatus } from "@/types/supplier-portal";

const CONFIG: Record<SupplierStatus, { label: string; className: string }> = {
  connected: {
    label: "Connected",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  },
  invited: {
    label: "Invited",
    className: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",
  },
  pending_response: {
    label: "Pending Response",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  not_invited: {
    label: "Not Invited",
    className: "bg-muted text-muted-foreground border-border",
  },
};

interface SupplierStatusBadgeProps {
  status: SupplierStatus;
  className?: string;
}

/** 협력사 상태 배지 - 공급망 포털 */
export function SupplierStatusBadge({ status, className }: SupplierStatusBadgeProps) {
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
