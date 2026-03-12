"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RotateCcw, Download, Plus } from "lucide-react";

/** 사회 데이터 필터 바: 연도, 조직, 사업장, 카테고리, 상태, 출처 */
export function SocialFilters() {
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
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="연도" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="2024">2024</SelectItem>
          <SelectItem value="2023">2023</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="all">
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="조직" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="all">
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="사업장" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          <SelectItem value="busan">부산공장</SelectItem>
          <SelectItem value="seoul">본사</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="all">
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="카테고리" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          <SelectItem value="human">인권</SelectItem>
          <SelectItem value="labor">노동</SelectItem>
          <SelectItem value="safety">안전보건</SelectItem>
          <SelectItem value="community">지역사회</SelectItem>
          <SelectItem value="customer">고객</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="all">
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="상태" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          <SelectItem value="verified">Verified</SelectItem>
          <SelectItem value="estimated">Estimated</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="missing">Missing</SelectItem>
          <SelectItem value="ai_anomaly">AI anomaly</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="all">
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="출처" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          <SelectItem value="hr">HR시스템</SelectItem>
          <SelectItem value="api">API</SelectItem>
          <SelectItem value="excel">Excel</SelectItem>
          <SelectItem value="survey">설문</SelectItem>
          <SelectItem value="manual">Manual</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex shrink-0 gap-2">
        <Button variant="outline" size="sm">
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          Reset
        </Button>
        <Button variant="outline" size="sm">
          <Download className="mr-1 h-3.5 w-3.5" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add Data
        </Button>
      </div>
    </div>
  );
}
