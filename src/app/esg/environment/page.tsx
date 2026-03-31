"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { EsgSubNav } from "@/components/esg/esg-sub-nav";
import { EnvironmentKpiCards } from "@/components/environment-data/environment-kpi-cards";
import { EnvironmentAiInsight } from "@/components/environment-data/environment-ai-insight";
import { EnvironmentFilters } from "@/components/environment-data/environment-filters";
import { EnvironmentDataTable } from "@/components/environment-data/environment-data-table";
import { EnvironmentDetailDrawer } from "@/components/environment-data/environment-detail-drawer";
import { EnvironmentDataEntryModal } from "@/components/environment-data/environment-data-entry-modal";
import { DataQualityCards } from "@/components/environment-data/data-quality-cards";
import { CollapsibleSection } from "@/components/common/collapsible-section";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const EnvironmentTrendCharts = dynamic(
  () => import("@/components/environment-data/environment-trend-charts").then((m) => ({ default: m.EnvironmentTrendCharts })),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-lg" /> }
);
import { Scope3Breakdown } from "@/components/environment-data/scope3-breakdown";
import { EmissionReportModal } from "@/components/environment-data/emission-report-modal";
import { getDetailById } from "@/lib/mock/environment-data";
import type { EnvironmentDataRow, EnvironmentDataDetail } from "@/types/environment-data";

/**
 * 환경 데이터 페이지
 * KPI 요약, 월별 추이, Scope 3 세부는 실제 DB 데이터를 사용합니다.
 */
export default function EnvironmentPage() {
  const currentYear = new Date().getFullYear();
  const [selectedRow, setSelectedRow] = useState<EnvironmentDataRow | null>(null);
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [reportModal, setReportModal] = useState<{ open: boolean; scope: string; title: string }>({ open: false, scope: "all", title: "" });
  const detail: EnvironmentDataDetail | null = useMemo(
    () => (selectedRow ? getDetailById(selectedRow.id) : null),
    [selectedRow]
  );

  // 실제 DB 데이터: KPI 요약
  const { data: kpiItems = [] } = useQuery({
    queryKey: ["env-kpi", currentYear],
    queryFn: async () => {
      const res = await fetch(`/api/environment?type=kpi&year=${currentYear}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 1000 * 60 * 2,
  });

  // 실제 DB 데이터: 월별 배출량
  const { data: monthlyEmissions = [] } = useQuery({
    queryKey: ["env-monthly", currentYear],
    queryFn: async () => {
      const res = await fetch(`/api/environment?type=monthly&year=${currentYear}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 1000 * 60 * 2,
  });

  // 실제 DB 데이터: 환경 데이터 테이블
  const { data: tableRows = [] } = useQuery({
    queryKey: ["env-table", currentYear],
    queryFn: async () => {
      const res = await fetch(`/api/environment?type=table&year=${currentYear}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 1000 * 60 * 2,
  });

  // 실제 DB 데이터: Scope 3 카테고리별
  const { data: scope3Items = [] } = useQuery({
    queryKey: ["env-scope3-breakdown", currentYear],
    queryFn: async () => {
      const res = await fetch(`/api/environment?type=scope3-breakdown&year=${currentYear}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 1000 * 60 * 2,
  });

  // 실제 DB 데이터: AI 인사이트
  const { data: aiInsight } = useQuery({
    queryKey: ["env-ai-insight", currentYear],
    queryFn: async () => {
      const res = await fetch(`/api/environment?type=ai-insight&year=${currentYear}`);
      if (!res.ok) return { hasAnomaly: false, alerts: [], possibleCauses: [], recommendedActions: [] };
      return res.json();
    },
    staleTime: 1000 * 60 * 2,
  });

  // 실제 DB 데이터: 데이터 품질 점수
  const { data: dataQuality = [] } = useQuery({
    queryKey: ["env-data-quality", currentYear],
    queryFn: async () => {
      const res = await fetch(`/api/environment?type=data-quality&year=${currentYear}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 1000 * 60 * 2,
  });

  return (
    <>
      <PageHeader
        title="환경 데이터"
        description="환경(Environmental) 관련 ESG 지표를 조회하고 관리합니다."
      >
        <EsgSubNav />
      </PageHeader>

      <div className="mt-8 space-y-8">
        {/* 1. KPI Summary — 실제 DB 데이터 */}
        <CollapsibleSection title="KPI 요약" defaultOpen>
          <EnvironmentKpiCards items={kpiItems} />
        </CollapsibleSection>

        {/* 2. AI Insight Panel */}
        <CollapsibleSection title="AI 인사이트" defaultOpen>
          <EnvironmentAiInsight data={aiInsight ?? { hasAnomaly: false, alerts: [], possibleCauses: [], recommendedActions: [] }} />
        </CollapsibleSection>

        {/* 3. Filter Bar */}
        <section>
          <EnvironmentFilters onAddData={() => setEntryModalOpen(true)} />
        </section>

        {/* 4. Environment Data Table */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            환경 데이터 목록
          </h2>
          <EnvironmentDataTable
            rows={tableRows}
            onRowClick={setSelectedRow}
            onSourceClick={(row) => {
              const scopeMap: Record<string, string> = { "scope1": "1", "scope2": "2", "scope3": "3" };
              const scope = scopeMap[row.id?.split("-")[0]] ?? "all";
              setReportModal({ open: true, scope, title: row.indicatorName });
            }}
          />
        </section>

        {/* 5. Detail Drawer */}
        {selectedRow && (
          <EnvironmentDetailDrawer
            detail={detail}
            onClose={() => setSelectedRow(null)}
          />
        )}

        {/* 6. Data Quality */}
        <CollapsibleSection title="데이터 품질">
          <DataQualityCards items={dataQuality} />
        </CollapsibleSection>

        {/* 7. Trend Analytics — 실제 DB 데이터 */}
        <CollapsibleSection title="추이 분석">
          <EnvironmentTrendCharts monthlyEmissions={monthlyEmissions} />
        </CollapsibleSection>

        {/* 8. Scope 3 Breakdown — 실제 DB 데이터 */}
        <CollapsibleSection title="Scope 3 세부">
          <Scope3Breakdown items={scope3Items} />
        </CollapsibleSection>
      </div>

      <EnvironmentDataEntryModal
        open={entryModalOpen}
        onClose={() => setEntryModalOpen(false)}
      />

      <EmissionReportModal
        open={reportModal.open}
        onClose={() => setReportModal((p) => ({ ...p, open: false }))}
        year={currentYear}
        scope={reportModal.scope}
        title={reportModal.title}
      />
    </>
  );
}
