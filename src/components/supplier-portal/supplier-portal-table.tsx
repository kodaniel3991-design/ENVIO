"use client";

import { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SupplierStatusBadge } from "./supplier-status-badge";
import { TierBadge } from "./tier-badge";
import { SubmissionStatusBadge } from "./submission-status-badge";
import { SupplierRiskBadge } from "./supplier-risk-badge";
import { EsgScoreIndicator } from "./esg-score-indicator";
import type { SupplierRow } from "@/types/supplier-portal";
import { MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

interface SupplierPortalTableProps {
  rows: SupplierRow[];
  onRowClick?: (row: SupplierRow) => void;
}

const COLUMNS = [
  "협력사",
  "이메일",
  "상태",
  "Tier",
  "제출",
  "리스크",
  "ESG",
  "액션",
] as const;

/** 협력사 테이블 - row click 시 drawer, 액션 메뉴, 페이지네이션 */
export function SupplierPortalTable({
  rows,
  onRowClick,
}: SupplierPortalTableProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paginatedRows = useMemo(
    () => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [rows, page]
  );

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
            {paginatedRows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "cursor-pointer border-b border-border/50 align-middle transition-colors hover:bg-muted/30"
                )}
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {row.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{row.email}</td>
                <td className="px-4 py-3">
                  <SupplierStatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3">
                  <TierBadge tier={row.tier} />
                </td>
                <td className="px-4 py-3">
                  <SubmissionStatusBadge status={row.submissionStatus} />
                </td>
                <td className="px-4 py-3">
                  <SupplierRiskBadge level={row.riskLevel} />
                </td>
                <td className="px-4 py-3">
                  <EsgScoreIndicator score={row.esgScore} />
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
                      <DropdownMenuItem>초대 발송</DropdownMenuItem>
                      <DropdownMenuItem>리마인드 발송</DropdownMenuItem>
                      <DropdownMenuItem>데이터 확인</DropdownMenuItem>
                      <DropdownMenuItem>담당자 변경</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
        <span>
          {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)} / 총 {rows.length}건
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[6rem] text-center">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
