"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items: { href: string; label: string }[] = [
  { href: "/data/supply-chain/vendors", label: "협력사 관리" },
  { href: "/data/supply-chain/invitations", label: "협력사 초대" },
  { href: "/data/supply-chain/submissions", label: "데이터 제출" },
  { href: "/data/supply-chain/verification", label: "데이터 검증" },
];

/** 공급망 포털 상단 탭 - active 시 blue accent */
export function SupplierPortalSubNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/30 p-1">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
