"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DataStatusBadge } from "@/components/environment-data/data-status-badge";
import { formatNumber } from "@/lib/format";
import type { GovernanceDataRow } from "@/types/governance-data";
import type { DataStatus } from "@/types/environment-data";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface GovernanceDataTableProps {
  rows: GovernanceDataRow[];
  onRowClick?: (row: GovernanceDataRow) => void;
}

const COLUMNS = [
  "구분",
  "지표명",
  "값",
  "단위",
  "기간",
  "출처",
  "증빙",
  "상태",
  "액션",
] as const;

/** 거버넌스 데이터 테이블: 환경 데이터 테이블과 동일 스타일 */
export function GovernanceDataTable({
  rows,
  onRowClick,
}: GovernanceDataTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="sticky top-0 z-10 border-b border-border bg-muted/50">
              {COLUMNS.map((col) => (
                <th
                  key={col}
                  className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "cursor-pointer border-b border-border/50 align-middle transition-colors hover:bg-muted/30"
                )}
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {row.category}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {row.indicatorName}
                </td>
                <td className="px-4 py-3 font-medium tabular-nums">
                  {formatNumber(row.value, row.unit === "%" ? 1 : 0)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{row.unit}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.period}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.source}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.evidenceCount} file
                  {row.evidenceCount !== 1 ? "s" : ""}
                </td>
                <td className="px-4 py-3">
                  <DataStatusBadge status={row.status as DataStatus} />
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>상세보기</DropdownMenuItem>
                      <DropdownMenuItem>수정</DropdownMenuItem>
                      <DropdownMenuItem>이력 보기</DropdownMenuItem>
                      <DropdownMenuItem>증빙 업로드</DropdownMenuItem>
                      <DropdownMenuItem>검토 요청</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
        <span>총 {rows.length}건</span>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded border px-2 py-1 hover:bg-muted"
          >
            이전
          </button>
          <button
            type="button"
            className="rounded border bg-muted px-2 py-1"
          >
            1
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1 hover:bg-muted"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
