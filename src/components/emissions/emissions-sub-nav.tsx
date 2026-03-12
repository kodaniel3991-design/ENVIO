"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/data/emissions/scope1", label: "Scope 1" },
  { href: "/data/emissions/scope2", label: "Scope 2" },
  { href: "/data/emissions/scope3", label: "Scope 3" },
];

export function EmissionsSubNav() {
  const pathname = usePathname();

  return (
    <nav
      className="inline-flex items-center gap-0.5 rounded-full border border-border bg-background p-1 w-fit shadow-inner"
      aria-label="Scope 탭"
    >
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
