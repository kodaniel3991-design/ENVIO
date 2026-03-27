"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  NAV_ITEMS,
  isActivePath,
  type NavItem,
  type NavSectionItem,
  type NavLinkItem,
  type NavGroupWithChildren,
} from "@/lib/navigation";
import { Logo } from "@/components/ui/logo";
import { useSidebar } from "./sidebar-context";
import {
  LayoutDashboard,
  Database,
  Network,
  BarChart3,
  TrendingDown,
  FileText,
  Settings,
  Leaf,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Rocket,
} from "lucide-react";

const SECTION_ICONS: Record<string, React.ElementType> = {
  대시보드: LayoutDashboard,
  시작하기: Rocket,
  "데이터 관리": Database,
  "공급망 포털": Network,
  "ESG 관리": Leaf,
  분석: BarChart3,
  "감축 전략": TrendingDown,
  보고서: FileText,
  설정: Settings,
};

/** 해당 섹션 하위에 활성 경로가 있는지 확인 */
function isSectionActive(pathname: string, item: NavItem): boolean {
  if (item.type === "link") return isActivePath(pathname, item.href);
  return item.children.some((section) =>
    section.children.some((child) => {
      if ("href" in child) return isActivePath(pathname, child.href);
      return (child as NavGroupWithChildren).children.some((link) =>
        isActivePath(pathname, link.href)
      );
    })
  );
}

/** 섹션의 첫 번째 링크 href */
function getFirstHref(item: NavItem): string {
  if (item.type === "link") return item.href;
  const firstSection = item.children[0];
  if (!firstSection) return "#";
  const firstChild = firstSection.children[0];
  if (!firstChild) return "#";
  if ("href" in firstChild) return firstChild.href;
  return (firstChild as NavGroupWithChildren).children[0]?.href ?? "#";
}

/** 3depth 링크 렌더 */
function NavLink({ item, collapsed }: { item: NavLinkItem; collapsed: boolean }) {
  const pathname = usePathname() ?? "";
  const active = isActivePath(pathname, item.href);
  if (collapsed) return null;
  return (
    <Link
      href={item.href}
      className={cn(
        "block rounded-md px-3 py-1.5 text-xs transition-colors",
        active
          ? "bg-primary/10 font-medium text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {item.label}
    </Link>
  );
}

/** 2depth 그룹 (label + 3depth 링크들) */
function NavGroup({
  section,
  collapsed,
}: {
  section: NavSectionItem;
  collapsed: boolean;
}) {
  if (collapsed) return null;
  return (
    <div className="flex flex-col gap-0.5">
      {section.label && (
        <span className="px-3 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          {section.label}
        </span>
      )}
      {section.children.map((child) => {
        if ("href" in child) {
          return <NavLink key={child.href} item={child as NavLinkItem} collapsed={collapsed} />;
        }
        const group = child as NavGroupWithChildren;
        return (
          <div key={group.label} className="flex flex-col gap-0.5">
            <span className="px-3 pt-1.5 pb-0.5 text-[10px] font-semibold text-muted-foreground/70">
              {group.label}
            </span>
            {group.children.map((link) => (
              <NavLink key={link.href} item={link} collapsed={collapsed} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

/** 1depth 메뉴 아이템 (아코디언) */
function NavItem({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const pathname = usePathname() ?? "";
  const active = isSectionActive(pathname, item);
  const [open, setOpen] = useState(active);
  const Icon = SECTION_ICONS[item.label] ?? LayoutDashboard;

  // 경로 변경 시 활성 섹션 자동 펼침
  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  if (item.type === "link") {
    return (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        title={collapsed ? item.label : undefined}
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          collapsed && "justify-center px-2",
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  }

  return (
    <div className="flex flex-col">
      {/* 1depth 헤더 버튼 */}
      <button
        onClick={() => !collapsed && setOpen((p) => !p)}
        title={collapsed ? item.label : undefined}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          collapsed && "justify-center px-2",
          active
            ? "text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-left">{item.label}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 transition-transform duration-150",
                open && "rotate-180"
              )}
            />
          </>
        )}
      </button>

      {/* 2~3depth 하위 메뉴 */}
      {!collapsed && open && (
        <div className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-3">
          {item.children.map((section, i) => (
            <NavGroup key={section.label || i} section={section} collapsed={collapsed} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-card transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* 로고 */}
      <div className="flex h-16 shrink-0 items-center border-b border-border px-4">
        {collapsed ? (
          <div className="flex w-full items-center justify-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              E
            </div>
          </div>
        ) : (
          <Logo />
        )}
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden p-2">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.label} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* 접기/펼치기 버튼 */}
      <div className="shrink-0 border-t border-border p-2">
        <button
          onClick={toggle}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
            collapsed && "justify-center px-2"
          )}
          aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span>접기</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
