"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface SubNavItem {
  href: string;
  label: string;
}

type SubNavVariant = "pill" | "underline";

interface SubNavProps {
  items: SubNavItem[];
  variant?: SubNavVariant;
  className?: string;
  "aria-label"?: string;
}

export function SubNav({
  items,
  variant = "pill",
  className,
  "aria-label": ariaLabel,
}: SubNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const containerClassName =
    variant === "pill"
      ? "inline-flex gap-0.5 rounded-full border border-border bg-background p-1 w-fit shadow-inner"
      : "flex flex-wrap items-center gap-1 border-b border-border pb-2";

  const baseLinkClassName =
    "rounded-full px-4 py-2 text-sm font-medium transition-colors";

  const getLinkClassName = (active: boolean) => {
    if (variant === "pill") {
      return cn(
        baseLinkClassName,
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      );
    }

    return cn(
      baseLinkClassName,
      active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    );
  };

  return (
    <nav className={cn(containerClassName, className)} aria-label={ariaLabel}>
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={getLinkClassName(active)}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

