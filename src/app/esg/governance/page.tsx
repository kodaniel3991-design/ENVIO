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
import { GovernanceTrendCharts } from "@/components/governance-data/governance-trend-charts";
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
import type {
  GovernanceDataRow,
  GovernanceDataDetail,
} from "@/types/governance-data";
import type { DataQualityScore } from "@/types/environment-data";

/**
 * 거버넌스 데이터 페이지
 * 데이터 관리 > ESG 데이터 > 거버넌스 데이터
 * 환경 데이터와 동일한 구조: KPI, AI 인사이트, 필터, 테이블, 상세 드로어, 데이터 품질, 추이 차트, 카테고리별 요약
 */
export default function GovernanceDataPage() {
  const [selectedRow, setSelectedRow] = useState<GovernanceDataRow | null>(
    null
  );
  const detail: GovernanceDataDetail | null = useMemo(
    () =>
      selectedRow ? getGovernanceDetailById(selectedRow.id) : null,
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
        <section>
          <h2 className="sr-only">KPI 요약</h2>
          <GovernanceKpiCards items={MOCK_GOV_KPI} />
        </section>

        {/* 2. AI Insight Panel */}
        <section>
          <GovernanceAiInsight data={MOCK_GOV_AI_INSIGHT} />
        </section>

        {/* 3. Filter Bar */}
        <section>
          <GovernanceFilters />
        </section>

        {/* 4. Governance Data Table */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            거버넌스 데이터 목록
          </h2>
          <GovernanceDataTable
            rows={MOCK_GOV_TABLE_ROWS}
            onRowClick={setSelectedRow}
          />
        </section>

        {/* 5. Detail Drawer */}
        {selectedRow && (
          <GovernanceDetailDrawer
            detail={detail}
            onClose={() => setSelectedRow(null)}
          />
        )}

        {/* 6. Data Quality Section */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            데이터 품질
          </h2>
          <DataQualityCards
            items={
              MOCK_GOV_DATA_QUALITY as unknown as DataQualityScore[]
            }
          />
        </section>

        {/* 7. Trend Analytics Section */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            추이 분석
          </h2>
          <GovernanceTrendCharts trend={MOCK_GOV_TREND} />
        </section>

        {/* 8. Governance Category Breakdown */}
        <section>
          <GovernanceCategoryBreakdown items={MOCK_GOV_CATEGORY_BREAKDOWN} />
        </section>
      </div>
    </>
  );
}
