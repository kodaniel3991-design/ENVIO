"use client";

import { useEffect, useCallback, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { ROUTE_LABELS } from "@/lib/navigation";

export interface RecentPage {
  href: string;
  label: string;
  visitedAt: number;
}

const STORAGE_KEY = "esg_recent_pages";
const MAX_PAGES = 8;

// 제외할 경로 (로그인, API 등)
const EXCLUDE_PREFIXES = ["/login", "/api"];

let listeners = new Set<() => void>();
let cache: RecentPage[] | null = null;

function getSnapshot(): RecentPage[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? JSON.parse(raw) : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function getServerSnapshot(): RecentPage[] {
  return [];
}

function notify() {
  cache = null;
  listeners.forEach((fn) => fn());
}

function addPage(href: string, label: string) {
  const pages = getSnapshot().filter((p) => p.href !== href);
  pages.unshift({ href, label, visitedAt: Date.now() });
  const trimmed = pages.slice(0, MAX_PAGES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  notify();
}

function removePage(href: string) {
  const pages = getSnapshot().filter((p) => p.href !== href);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
  notify();
}

export function useRecentPages() {
  const pathname = usePathname();

  const pages = useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    getSnapshot,
    getServerSnapshot,
  );

  // 현재 페이지를 자동 기록
  useEffect(() => {
    if (!pathname) return;
    if (EXCLUDE_PREFIXES.some((p) => pathname.startsWith(p))) return;

    const label = ROUTE_LABELS[pathname];
    if (!label) return;

    addPage(pathname, label);
  }, [pathname]);

  const remove = useCallback((href: string) => {
    removePage(href);
  }, []);

  return { pages, currentPath: pathname, remove };
}
