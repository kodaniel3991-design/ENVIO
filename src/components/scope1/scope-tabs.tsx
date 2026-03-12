"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/data/emissions/scope1", label: "Scope 1" },
  { href: "/data/emissions/scope2", label: "Scope 2" },
  { href: "/data/emissions/scope3", label: "Scope 3" },
];

export function ScopeTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="inline-flex items-center gap-0.5 rounded-full border border-border bg-background p-1 shadow-inner"
      aria-label="Scope 탭"
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

