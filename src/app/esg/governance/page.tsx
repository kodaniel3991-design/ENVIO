"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { EsgSubNav } from "@/components/esg/esg-sub-nav";
import { GovernanceKpiCards } from "@/components/governance-data/governance-kpi-cards";
import { GovernanceAiInsight } from "@/components/governance-data/governance-ai-insight";
import { GovernanceFilters } from "@/components/governance-data/governance-filters";
import { GovernanceDataTable } from "@/components/governance-data/governance-data-table";
import { GovernanceDetailDrawer } from "@/components/governance-data/governance-detail-drawer";
import { DataQualityCards } from "@/components/environment-data/data-quality-cards";
import { CollapsibleSection } from "@/components/common/collapsible-section";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const GovernanceTrendCharts = dynamic(
  () => import("@/components/governance-data/governance-trend-charts").then((m) => ({ default: m.GovernanceTrendCharts })),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-lg" /> }
);
import { GovernanceCategoryBreakdown } from "@/components/governance-data/governance-category-breakdown";
import {
  MOCK_GOV_KPI,
  MOCK_GOV_AI_INSIGHT,
  MOCK_GOV_TABLE_ROWS,
  MOCK_GOV_DATA_QUALITY,
  MOCK_GOV_TREND,
  MOCK_GOV_CATEGORY_BREAKDOWN,
  getGovernanceDetailById,
} from "@/lib/mock/governance-data";
import type { GovernanceDataRow, GovernanceDataDetail } from "@/types/governance-data";

/**
 * 거버넌스 데이터 페이지
 * 데이터 관리 > ESG 데이터 > 거버넌스 데이터
 * - KPI 요약, AI 인사이트, 필터, 테이블, 상세 드로어, 데이터 품질, 추이 차트, 카테고리 요약
 */
export default function GovernanceDataPage() {
  const [selectedRow, setSelectedRow] = useState<GovernanceDataRow | null>(null);
  const detail: GovernanceDataDetail | null = useMemo(
    () => (selectedRow ? getGovernanceDetailById(selectedRow.id) : null),
    [selectedRow]
  );

  return (
    <>
      <PageHeader
        title="거버넌스 데이터"
        description="거버넌스(Governance) 관련 ESG 지표를 조회하고 관리합니다."
      >
        <EsgSubNav />
      </PageHeader>

      <div className="mt-8 space-y-8">
        {/* 1. KPI Summary Section */}
        <CollapsibleSection title="KPI 요약" defaultOpen>
          <GovernanceKpiCards items={MOCK_GOV_KPI} />
        </CollapsibleSection>

        <CollapsibleSection title="AI 인사이트" defaultOpen>
          <GovernanceAiInsight data={MOCK_GOV_AI_INSIGHT} />
        </CollapsibleSection>

        <section>
          <GovernanceFilters />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            거버넌스 데이터 목록
          </h2>
          <GovernanceDataTable
            rows={MOCK_GOV_TABLE_ROWS}
            onRowClick={setSelectedRow}
          />
        </section>

        {selectedRow && (
          <GovernanceDetailDrawer
            detail={detail}
            onClose={() => setSelectedRow(null)}
          />
        )}

        <CollapsibleSection title="데이터 품질">
          <DataQualityCards items={MOCK_GOV_DATA_QUALITY} />
        </CollapsibleSection>

        <CollapsibleSection title="추이 분석">
          <GovernanceTrendCharts trend={MOCK_GOV_TREND} />
        </CollapsibleSection>

        <CollapsibleSection title="카테고리 요약">
          <GovernanceCategoryBreakdown items={MOCK_GOV_CATEGORY_BREAKDOWN} />
        </CollapsibleSection>
      </div>
    </>
  );
}
