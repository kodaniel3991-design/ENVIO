"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
  className,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={className}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="mb-3 flex w-full items-center gap-2 text-left group"
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            !open && "-rotate-90"
          )}
        />
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className="ml-2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          {open ? "접기" : "펼치기"}
        </span>
      </button>
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </section>
  );
}
