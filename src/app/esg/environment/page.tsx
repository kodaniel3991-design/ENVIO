"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { EsgSubNav } from "@/components/esg/esg-sub-nav";
import { EnvironmentKpiCards } from "@/components/environment-data/environment-kpi-cards";
import { EnvironmentAiInsight } from "@/components/environment-data/environment-ai-insight";
import { EnvironmentFilters } from "@/components/environment-data/environment-filters";
import { EnvironmentDataTable } from "@/components/environment-data/environment-data-table";
import { EnvironmentDetailDrawer } from "@/components/environment-data/environment-detail-drawer";
import { DataQualityCards } from "@/components/environment-data/data-quality-cards";
import { EnvironmentTrendCharts } from "@/components/environment-data/environment-trend-charts";
import { Scope3Breakdown } from "@/components/environment-data/scope3-breakdown";
import {
  MOCK_ENV_KPI,
  MOCK_AI_INSIGHT,
  MOCK_ENV_TABLE_ROWS,
  MOCK_DATA_QUALITY,
  MOCK_SCOPE3_BREAKDOWN,
  MOCK_MONTHLY_EMISSIONS,
  MOCK_ENERGY_TREND,
  getDetailById,
} from "@/lib/mock/environment-data";
import type { EnvironmentDataRow, EnvironmentDataDetail } from "@/types/environment-data";

/**
 * 환경 데이터 페이지
 * 데이터 관리 > ESG 데이터 > 환경 데이터
 * - KPI 요약, AI 인사이트, 필터, 테이블, 상세 드로어, 데이터 품질, 추이 차트, Scope 3 세부
 */
export default function EnvironmentPage() {
  const [selectedRow, setSelectedRow] = useState<EnvironmentDataRow | null>(null);
  const detail: EnvironmentDataDetail | null = useMemo(
    () => (selectedRow ? getDetailById(selectedRow.id) : null),
    [selectedRow]
  );

  return (
    <>
      <PageHeader
        title="환경 데이터"
        description="환경(Environmental) 관련 ESG 지표를 조회하고 관리합니다."
      >
        <EsgSubNav />
      </PageHeader>

      <div className="mt-8 space-y-8">
        {/* 1. KPI Summary Section */}
        <section>
          <h2 className="sr-only">KPI 요약</h2>
          <EnvironmentKpiCards items={MOCK_ENV_KPI} />
        </section>

        {/* 2. AI Insight Panel */}
        <section>
          <EnvironmentAiInsight data={MOCK_AI_INSIGHT} />
        </section>

        {/* 3. Filter Bar */}
        <section>
          <EnvironmentFilters />
        </section>

        {/* 4. Environment Data Table */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            환경 데이터 목록
          </h2>
          <EnvironmentDataTable
            rows={MOCK_ENV_TABLE_ROWS}
            onRowClick={setSelectedRow}
          />
        </section>

        {/* 5. Detail Drawer (우측 슬라이드) */}
        {selectedRow && (
          <EnvironmentDetailDrawer
            detail={detail}
            onClose={() => setSelectedRow(null)}
          />
        )}

        {/* 6. Data Quality Section */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            데이터 품질
          </h2>
          <DataQualityCards items={MOCK_DATA_QUALITY} />
        </section>

        {/* 7. Trend Analytics Section */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            추이 분석
          </h2>
          <EnvironmentTrendCharts
            monthlyEmissions={MOCK_MONTHLY_EMISSIONS}
            energyTrend={MOCK_ENERGY_TREND}
          />
        </section>

        {/* 8. Scope 3 Breakdown Section */}
        <section>
          <Scope3Breakdown items={MOCK_SCOPE3_BREAKDOWN} />
        </section>
      </div>
    </>
  );
}
