"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DataStatusBadge } from "./data-status-badge";
import { formatNumber } from "@/lib/format";
import type { EnvironmentDataRow } from "@/types/environment-data";
import { MoreHorizontal, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnvironmentDataTableProps {
  rows: EnvironmentDataRow[];
  onRowClick?: (row: EnvironmentDataRow) => void;
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

/** 환경 데이터 테이블: 정렬·hover·행 클릭 시 상세 패널 */
export function EnvironmentDataTable({
  rows,
  onRowClick,
}: EnvironmentDataTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 sticky top-0 z-10">
              {COLUMNS.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap"
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
                  "border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors",
                  "align-middle"
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
                <td className="px-4 py-3 text-muted-foreground">
                  {row.unit}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.period}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.source}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.evidenceCount} file{row.evidenceCount !== 1 ? "s" : ""}
                </td>
                <td className="px-4 py-3">
                  <DataStatusBadge status={row.status} />
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
      {/* Pagination placeholder */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
        <span>총 {rows.length}건</span>
        <div className="flex gap-2">
          <button type="button" className="rounded border px-2 py-1 hover:bg-muted">
            이전
          </button>
          <button type="button" className="rounded border px-2 py-1 bg-muted">
            1
          </button>
          <button type="button" className="rounded border px-2 py-1 hover:bg-muted">
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
