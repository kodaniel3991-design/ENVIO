"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RotateCcw, Download } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** 승인/확정 필터 바 - Validation Filters 구조 재사용 */
export function ApprovalFilters() {
  const [pendingOnly, setPendingOnly] = useState(false);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1}월`,
  }));

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="search"
          placeholder="검색..."
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>
      <Select defaultValue="2024">
        <SelectTrigger className="w-[90px]">
          <SelectValue placeholder="연도" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="2024">2024</SelectItem>
          <SelectItem value="2023">2023</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="all">
        <SelectTrigger className="w-[90px]">
          <SelectValue placeholder="월" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          {months.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select defaultValue="all">
        <SelectTrigger className="w-[110px]">
          <SelectValue placeholder="Scope" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          <SelectItem value="scope1">Scope 1</SelectItem>
          <SelectItem value="scope2">Scope 2</SelectItem>
          <SelectItem value="scope3">Scope 3</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="all">
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="카테고리" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          <SelectItem value="fixed">고정연소</SelectItem>
          <SelectItem value="mobile">이동연소</SelectItem>
          <SelectItem value="fugitive">비가스배출</SelectItem>
          <SelectItem value="electricity">전력</SelectItem>
          <SelectItem value="steam">스팀</SelectItem>
          <SelectItem value="purchased">Purchased goods & services</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="all">
        <SelectTrigger className="w-[110px]">
          <SelectValue placeholder="사업장" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          <SelectItem value="hq">본사</SelectItem>
          <SelectItem value="busan">부산공장</SelectItem>
          <SelectItem value="ulsan">울산공장</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="all">
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="상태" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          <SelectItem value="verified">Verified</SelectItem>
          <SelectItem value="pending_approval">Pending Approval</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="confirmed">Confirmed</SelectItem>
          <SelectItem value="reopened">Reopened</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="all">
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="승인자" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="all">
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="제출자" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setPendingOnly(!pendingOnly)}
          className={cn(
            "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
            pendingOnly
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:bg-muted/50"
          )}
        >
          승인 대기만 보기
        </button>
        <Button variant="outline" size="sm">
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          Reset
        </Button>
        <Button variant="outline" size="sm">
          <Download className="mr-1 h-3.5 w-3.5" />
          Export
        </Button>
      </div>
    </div>
  );
}
