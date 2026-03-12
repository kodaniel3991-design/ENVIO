"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getBreadcrumbs } from "@/lib/navigation";
import { ChevronRight } from "lucide-react";

export function Breadcrumb() {
  const pathname = usePathname();
  const crumbs = getBreadcrumbs(pathname ?? undefined);
  if (crumbs.length <= 1) return null;

  return (
    <nav className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />}
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
