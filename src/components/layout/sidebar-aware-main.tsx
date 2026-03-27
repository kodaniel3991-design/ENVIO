"use client";

import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";

export function SidebarAwareMain({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col transition-all duration-200",
        collapsed ? "ml-16" : "ml-56"
      )}
    >
      {children}
    </div>
  );
}
