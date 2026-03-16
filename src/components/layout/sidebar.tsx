"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActivePath, type NavItem } from "@/lib/navigation";
import {
  LayoutDashboard,
  Database,
  Network,
  BarChart3,
  TrendingDown,
  FileText,
  Settings,
  Leaf,
} from "lucide-react";

/** 1depth 메뉴별 아이콘 매핑 */
const SECTION_ICONS: Record<string, React.ElementType> = {
  대시보드: LayoutDashboard,
  "데이터 관리": Database,
  "공급망 포털": Network,
  "ESG 관리": Leaf,
  분석: BarChart3,
  "감축 전략": TrendingDown,
  보고서: FileText,
  설정: Settings,
};

function isItemActive(pathname: string, item: NavItem): boolean {
  if (item.type === "link") return isActivePath(pathname, item.href);
  return item.children.some((section) =>
    section.children.some((child) => {
      if ("href" in child) return isActivePath(pathname, child.href);
      return child.children.some((link) => isActivePath(pathname, link.href));
    })
  );
}

/** 사이드바 — AppLayout에서 필요 시 추가 가능 (현재 TopHeader 드롭다운으로 대체) */
export function Sidebar() {
  const pathname = usePathname() ?? "";

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <span className="text-lg font-semibold tracking-tight text-foreground">
          CarbonOS
        </span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const label = item.type === "link" ? item.label : item.label;
          const href = item.type === "link" ? item.href : undefined;
          const Icon = SECTION_ICONS[label] ?? LayoutDashboard;
          const active = isItemActive(pathname, item);

          if (item.type === "link") {
            return (
              <Link
                key={href}
                href={href!}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          }

          // section: 첫 번째 자식 링크로 이동
          const firstHref =
            item.children[0]?.children[0] &&
            "href" in item.children[0].children[0]
              ? item.children[0].children[0].href
              : "#";

          return (
            <Link
              key={label}
              href={firstHref}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <p className="px-3 py-2 text-xs text-muted-foreground">
          ESG Carbon Management
        </p>
      </div>
    </aside>
  );
}
