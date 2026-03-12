"use client";

import { cn } from "@/lib/utils";
import type { SupplierRiskLevel } from "@/types/supplier-portal";
import { AlertTriangle } from "lucide-react";

const CONFIG: Record<SupplierRiskLevel, { label: string; className: string; showIcon?: boolean }> = {
  low: {
    label: "Low",
    className: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  high: {
    label: "High",
    className: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
    showIcon: true,
  },
  critical: {
    label: "Critical",
    className: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
    showIcon: true,
  },
};

interface SupplierRiskBadgeProps {
  level: SupplierRiskLevel;
  className?: string;
}

/** 리스크 배지 - High/Critical 시 아이콘 강조 */
export function SupplierRiskBadge({ level, className }: SupplierRiskBadgeProps) {
  const c = CONFIG[level] ?? { label: level, className: "bg-muted text-muted-foreground border-border", showIcon: false };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
        c.className,
        className
      )}
    >
      {c.showIcon && <AlertTriangle className="h-3 w-3" />}
      {c.label}
    </span>
  );
}
