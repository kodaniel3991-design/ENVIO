"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ValidationStatusBadge } from "./validation-status-badge";
import { ValidationAiBadge } from "./validation-ai-badge";
import type { ValidationDataRow } from "@/types/validation-data";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidationDataTableProps {
  rows: ValidationDataRow[];
  onRowClick?: (row: ValidationDataRow) => void;
}

const COLUMNS = [
  "상태",
  "Scope",
  "카테고리",
  "배출원",
  "사업장",
  "기간",
  "활동량",
  "배출량",
  "증빙",
  "AI 검증",
  "제출자",
  "제출일",
  "액션",
] as const;

/** 검증 데이터 테이블 - Environment Data Table 스타일 */
export function ValidationDataTable({
  rows,
  onRowClick,
}: ValidationDataTableProps) {
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
                <td className="px-4 py-3">
                  <ValidationStatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {row.scope}
                </td>
                <td className="px-4 py-3 text-foreground">{row.category}</td>
                <td className="px-4 py-3 text-foreground">
                  {row.emissionSource}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{row.site}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.period}
                </td>
                <td className="px-4 py-3 tabular-nums text-foreground">
                  {row.activityAmount}
                </td>
                <td className="px-4 py-3 tabular-nums text-foreground">
                  {row.emissions}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.evidenceCount} file
                  {row.evidenceCount !== 1 ? "s" : ""}
                </td>
                <td className="px-4 py-3">
                  <ValidationAiBadge result={row.aiVerification} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.submittedBy}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.submittedAt}
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
                      <DropdownMenuItem>검토 시작</DropdownMenuItem>
                      <DropdownMenuItem>수정 요청</DropdownMenuItem>
                      <DropdownMenuItem>증빙 요청</DropdownMenuItem>
                      <DropdownMenuItem>검증 완료</DropdownMenuItem>
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
