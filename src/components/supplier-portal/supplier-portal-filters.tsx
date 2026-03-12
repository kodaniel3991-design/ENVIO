"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RotateCcw, Download, UserPlus, Send } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** 협력사 포털 필터 바 - 검색, 상태, 리스크, Tier, 카테고리, 응답 상태 */
export function SupplierPortalFilters() {
  const [pendingOnly, setPendingOnly] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="search"
          placeholder="검색 (이름, 이메일)"
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>
      <Select defaultValue="all">
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="상태" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          <SelectItem value="connected">Connected</SelectItem>
          <SelectItem value="invited">Invited</SelectItem>
          <SelectItem value="pending_response">Pending Response</SelectItem>
          <SelectItem value="not_invited">Not Invited</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="all">
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="리스크" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="all">
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Tier" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          <SelectItem value="strategic">Strategic</SelectItem>
          <SelectItem value="core">Core</SelectItem>
          <SelectItem value="general">General</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="all">
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="카테고리" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          <SelectItem value="purchased">Purchased Goods</SelectItem>
          <SelectItem value="transport">Transportation</SelectItem>
          <SelectItem value="waste">Waste</SelectItem>
          <SelectItem value="supplier">Supplier-specific</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="all">
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="응답 상태" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          <SelectItem value="verified">제출완료</SelectItem>
          <SelectItem value="in_progress">진행중</SelectItem>
          <SelectItem value="not_started">미시작</SelectItem>
          <SelectItem value="overdue">기한초과</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setPendingOnly(!pendingOnly)}
          className={cn(
            "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
            pendingOnly
              ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
              : "border-border hover:bg-muted/50"
          )}
        >
          미응답만 보기
        </button>
        <Button variant="outline" size="sm">
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          Reset
        </Button>
        <Button variant="outline" size="sm">
          <Download className="mr-1 h-3.5 w-3.5" />
          Export
        </Button>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="mr-1 h-3.5 w-3.5" />
          협력사 초대
        </Button>
        <Button variant="outline" size="sm" className="border-blue-500/30">
          <Send className="mr-1 h-3.5 w-3.5" />
          리마인드 발송
        </Button>
      </div>
    </div>
  );
}
