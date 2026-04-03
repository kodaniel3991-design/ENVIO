"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Bell, ChevronDown, LogOut, Moon, Search, Sun, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "./sidebar-context";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useRecentPages } from "@/hooks/use-recent-pages";
import { ROUTE_LABELS } from "@/lib/navigation";
import { useQuery } from "@tanstack/react-query";

const ALL_PAGES = Object.entries(ROUTE_LABELS).map(([href, label]) => ({ href, label }));

export function TopHeader() {
  const router = useRouter();
  const { collapsed } = useSidebar();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { pages, currentPath, remove } = useRecentPages();

  const { data: org } = useQuery<{ organizationName: string }>({
    queryKey: ["organization-name"],
    queryFn: async () => { const r = await fetch("/api/organization"); return r.json(); },
    staleTime: 10 * 60 * 1000,
  });

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ALL_PAGES.filter(
      (p) => p.label.toLowerCase().includes(q) || p.href.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [query]);

  useEffect(() => { setSelectedIdx(0); }, [results]);

  // 선택된 항목이 보이도록 스크롤
  useEffect(() => {
    const item = listRef.current?.children[selectedIdx] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  function navigate(href: string) {
    router.push(href);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIdx]) {
      e.preventDefault();
      navigate(results[selectedIdx].href);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-6 transition-all duration-200",
        collapsed ? "left-16" : "left-56"
      )}
    >
      {/* 검색창 */}
      <div className="relative w-56 shrink-0">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder="페이지 검색…"
          className="h-9 w-full rounded-md border border-border bg-muted/40 pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:bg-background transition-colors"
        />
        {open && results.length > 0 && (
          <div
            ref={listRef}
            className="absolute left-0 top-full mt-1 z-50 w-72 max-h-80 overflow-y-auto rounded-lg border border-border bg-card shadow-lg"
          >
            {results.map((page, i) => (
              <button
                key={page.href}
                onMouseDown={() => navigate(page.href)}
                onMouseEnter={() => setSelectedIdx(i)}
                className={cn(
                  "flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors",
                  i === selectedIdx ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
                )}
              >
                <Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate font-medium">{page.label}</span>
              </button>
            ))}
          </div>
        )}
        {open && query.trim() && results.length === 0 && (
          <div className="absolute left-0 top-full mt-1 z-50 w-72 rounded-lg border border-border bg-card p-4 shadow-lg">
            <p className="text-sm text-muted-foreground text-center">검색 결과가 없습니다</p>
          </div>
        )}
      </div>

      {/* 최근 방문 페이지 탭 */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto scrollbar-hide">
        {pages.map((page) => {
          const isActive = currentPath === page.href;
          return (
            <Link
              key={page.href}
              href={page.href}
              className={cn(
                "group relative flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-all hover:bg-muted/60",
                isActive
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="max-w-[120px] truncate">{page.label}</span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  remove(page.href);
                }}
                className="ml-0.5 rounded p-0.5 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                aria-label={`${page.label} 닫기`}
              >
                <X className="h-3 w-3" />
              </button>
            </Link>
          );
        })}
      </div>

      {/* 우측 영역 */}
      <div className="flex shrink-0 items-center gap-3">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
          aria-label="테마 전환"
        >
          <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0 dark:absolute" />
          <Moon className="h-3.5 w-3.5 absolute rotate-90 scale-0 transition-transform dark:relative dark:rotate-0 dark:scale-100" />
          <span className="dark:hidden">Light Mode</span>
          <span className="hidden dark:inline">Dark Mode</span>
        </button>
        <Button variant="ghost" size="icon" className="relative" aria-label="알림">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>
        {org?.organizationName && org.organizationName !== "조직" && (
          <span className="text-xs text-muted-foreground border-r border-border pr-3">
            {org.organizationName}
          </span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 rounded-full border border-border pl-1 pr-3 py-1.5 outline-none hover:bg-muted/50 transition-colors"
              aria-label="사용자 메뉴"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                {user?.name?.charAt(0) ?? "?"}
              </div>
              <span className="text-sm font-medium">{user?.name ?? "사용자"}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
