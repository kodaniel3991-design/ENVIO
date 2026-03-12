"use client";

import { cn } from "@/lib/utils";
import type { SupplierTier } from "@/types/supplier-portal";

const CONFIG: Record<SupplierTier, { label: string; className: string }> = {
  strategic: {
    label: "Strategic",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  },
  core: {
    label: "Core",
    className: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",
  },
  general: {
    label: "General",
    className: "bg-muted text-muted-foreground border-border",
  },
};

interface TierBadgeProps {
  tier: SupplierTier;
  className?: string;
}

/** Tier 배지 - Strategic / Core / General */
export function TierBadge({ tier, className }: TierBadgeProps) {
  const c = CONFIG[tier] ?? { label: tier, className: "bg-muted text-muted-foreground border-border" };
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
