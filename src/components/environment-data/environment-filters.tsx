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

interface EnvironmentFiltersProps {
  onAddData?: () => void;
}

/** 필터 바: 연도, 조직, 사업장, Scope, 상태, 출처 + 검색·리셋·Export·Add */
export function EnvironmentFilters({ onAddData }: EnvironmentFiltersProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => String(currentYear - i));

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="search"
          placeholder="검색..."
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>
      <Select defaultValue={years[0]}>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="연도" />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={y}>{y}</SelectItem>
          ))}
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
      <Select defaultValue="busan">
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="사업장" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="busan">부산공장</SelectItem>
          <SelectItem value="seoul">본사</SelectItem>
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
          <SelectItem value="api">API</SelectItem>
          <SelectItem value="erp">ERP</SelectItem>
          <SelectItem value="iot">IoT</SelectItem>
          <SelectItem value="excel">Excel</SelectItem>
          <SelectItem value="supplier">Supplier Portal</SelectItem>
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
        <Button size="sm" onClick={onAddData}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          데이터 입력
        </Button>
      </div>
    </div>
  );
}
