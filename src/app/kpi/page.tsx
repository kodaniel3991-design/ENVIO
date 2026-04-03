"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useKpiList } from "@/hooks/use-kpi-list";
import { useKpiSummary } from "@/hooks/use-kpi-summary";
import { ErrorState } from "@/components/common/error-state";
import { PageShell, PageSection } from "@/components/layout/page-shell";
import { KpiSubNav } from "@/components/kpi/kpi-sub-nav";
import { KpiSummaryCards } from "@/components/kpi/kpi-summary-cards";
import { KpiListTable } from "@/components/kpi/kpi-list-table";
import { KpiDetailDrawer } from "@/components/kpi/kpi-detail-drawer";
import { KpiTargetModal } from "@/components/kpi/kpi-target-modal";
import { Button } from "@/components/ui/button";
import { FileUp, Plus, PenLine } from "lucide-react";
import type { KpiManagementItem, KpiCategory } from "@/types";

function genId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default function KPIDashboardPage() {
  const queryClient = useQueryClient();
  const [esgFilter, setEsgFilter] = useState<KpiCategory | "all">("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<KpiManagementItem | null>(null);
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [targetItem, setTargetItem] = useState<KpiManagementItem | null>(null);

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useKpiSummary();
  const {
    data: list,
    isLoading: listLoading,
    isError: listError,
    refetch: refetchList,
  } = useKpiList();

  // 목표 저장 mutation
  const saveTargetMutation = useMutation({
    mutationFn: async ({ kpiId, targetValue }: { kpiId: string; targetValue: number | string }) => {
      const year = new Date().getFullYear();
      const res = await fetch("/api/kpi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-targets",
          items: [{
            id: genId(),
            kpiId,
            period: String(year),
            targetValue: Number(targetValue),
          }],
        }),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpi-list"] });
      queryClient.invalidateQueries({ queryKey: ["kpi-summary"] });
      toast.success("목표가 저장되었습니다.");
    },
    onError: () => toast.error("목표 저장에 실패했습니다."),
  });

  // 실적 저장 mutation
  const savePerformanceMutation = useMutation({
    mutationFn: async ({ kpiId, actualValue }: { kpiId: string; actualValue: number }) => {
      const year = new Date().getFullYear();
      const res = await fetch("/api/kpi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-performance",
          items: [{
            id: genId(),
            kpiId,
            period: String(year),
            actualValue,
          }],
        }),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpi-list"] });
      queryClient.invalidateQueries({ queryKey: ["kpi-summary"] });
      toast.success("실적이 저장되었습니다.");
    },
    onError: () => toast.error("실적 저장에 실패했습니다."),
  });

  const handleRowClick = (row: KpiManagementItem) => {
    setSelectedItem(row);
    setDrawerOpen(true);
  };
  const handleSetTarget = (item: KpiManagementItem) => {
    setTargetItem(item);
    setTargetModalOpen(true);
    setDrawerOpen(false);
  };

  const handleTargetConfirm = (kpiId: string, targetValue: number | string) => {
    saveTargetMutation.mutate({ kpiId, targetValue });
  };

  // 관리 수준별 통계
  const criticalCount = (list ?? []).filter((k) => k.managementLevel === "critical").length;
  const materialCount = (list ?? []).filter((k) => k.managementLevel === "material").length;
  const generalCount = (list ?? []).filter((k) => !k.managementLevel || k.managementLevel === "general").length;

  return (
    <PageShell
      title="KPI 대시보드"
      description="ESG·탄소 핵심 성과 지표를 한눈에 확인합니다."
      data-page="kpi-dashboard"
      headerChildren={<KpiSubNav />}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm">
          <PenLine className="mr-1.5 h-4 w-4" />
          데이터 입력
        </Button>
        <Button variant="outline" size="sm">
          <FileUp className="mr-1.5 h-4 w-4" />
          Excel 업로드
        </Button>
        <Button variant="outline" size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          지표 추가
        </Button>
      </div>

      {/* 관리 수준별 요약 */}
      <div className="mt-4 flex gap-3 text-xs">
        <span className="rounded-md border border-border px-3 py-1.5">전체 <strong className="ml-1">{(list ?? []).length}</strong></span>
        <span className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-destructive">의무(Critical) <strong className="ml-1">{criticalCount}</strong></span>
        <span className="rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-primary">중대(Material) <strong className="ml-1">{materialCount}</strong></span>
        <span className="rounded-md border border-border px-3 py-1.5 text-muted-foreground">일반 <strong className="ml-1">{generalCount}</strong></span>
      </div>

      <div className="mt-6 space-y-8">
        <PageSection title="요약">
          {summaryError && (
            <ErrorState onRetry={() => refetchSummary()} />
          )}
          <KpiSummaryCards items={summary ?? []} isLoading={summaryLoading} />
        </PageSection>

        <PageSection>
          {listError && <ErrorState onRetry={() => refetchList()} />}
          <KpiListTable
            data={list ?? []}
            isLoading={listLoading}
            title="KPI 목록"
            onRowClick={handleRowClick}
            esgFilter={esgFilter}
            onEsgFilterChange={setEsgFilter}
          />
        </PageSection>
      </div>

      <KpiDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        item={selectedItem}
        onSetTarget={handleSetTarget}
      />
      <KpiTargetModal
        open={targetModalOpen}
        onOpenChange={setTargetModalOpen}
        item={targetItem}
        onConfirm={handleTargetConfirm}
        isLoading={saveTargetMutation.isPending}
      />
    </PageShell>
  );
}
