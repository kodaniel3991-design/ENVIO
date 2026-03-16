"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { UsePaginationReturn } from "@/hooks/use-pagination";

interface PaginationBarProps {
  pagination: UsePaginationReturn;
  totalItems: number;
  pageSizeOptions?: number[];
}

export function PaginationBar({
  pagination,
  totalItems,
  pageSizeOptions = [10, 20, 50],
}: PaginationBarProps) {
  const { page, pageSize, totalPages, setPage, setPageSize, rangeStart, rangeEnd } = pagination;

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span>페이지 당</span>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="h-7 rounded border border-input bg-transparent px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="페이지 당 항목 수"
        >
          {pageSizeOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span>개</span>
      </div>

      <span>
        {rangeStart}–{rangeEnd} / 전체 {totalItems}건
      </span>

      <div className="flex items-center gap-1" role="navigation" aria-label="페이지 탐색">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
          aria-label="이전 페이지"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | "...")[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-1">
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? "default" : "ghost"}
                size="icon"
                className="h-7 w-7 text-xs"
                onClick={() => setPage(p as number)}
                aria-current={p === page ? "page" : undefined}
                aria-label={`${p}페이지`}
              >
                {p}
              </Button>
            )
          )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
          aria-label="다음 페이지"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
