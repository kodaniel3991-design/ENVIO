"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/materiality/flow", label: "평가 흐름도" },
  { href: "/materiality", label: "1. 이슈 확인", step: true },
  { href: "/materiality/impact", label: "2. 영향 중대성", step: true },
  { href: "/materiality/financial", label: "3. 재무 중대성", step: true },
  { href: "/materiality/result", label: "4. 결과 확인", step: true },
  { href: "/materiality/settings", label: "설정" },
];

export function MaterialitySubNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap items-center gap-1">
      {links.map((link, i) => {
        const isActive = pathname === link.href;
        const prevStep = links[i - 1];
        const showSep = link.step && prevStep?.step;
        return (
          <div key={link.href} className="flex items-center gap-1 shrink-0">
            {showSep && <span className="text-muted-foreground text-xs">›</span>}
            <Link
              href={link.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}
