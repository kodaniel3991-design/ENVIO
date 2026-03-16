"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { EsgSubNav } from "@/components/esg/esg-sub-nav";
import { SocialKpiCards } from "@/components/social-data/social-kpi-cards";
import { SocialAiInsight } from "@/components/social-data/social-ai-insight";
import { SocialFilters } from "@/components/social-data/social-filters";
import { SocialDataTable } from "@/components/social-data/social-data-table";
import { SocialDetailDrawer } from "@/components/social-data/social-detail-drawer";
import { DataQualityCards } from "@/components/environment-data/data-quality-cards";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const SocialTrendCharts = dynamic(
  () => import("@/components/social-data/social-trend-charts").then((m) => ({ default: m.SocialTrendCharts })),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-lg" /> }
);
import { SocialCategoryBreakdown } from "@/components/social-data/social-category-breakdown";
import {
  MOCK_SOCIAL_KPI,
  MOCK_SOCIAL_AI_INSIGHT,
  MOCK_SOCIAL_TABLE_ROWS,
  MOCK_SOCIAL_DATA_QUALITY,
  MOCK_SOCIAL_TREND,
  MOCK_SOCIAL_CATEGORY_BREAKDOWN,
  getSocialDetailById,
} from "@/lib/mock/social-data";
import type { SocialDataRow, SocialDataDetail } from "@/types/social-data";
import type { DataQualityScore } from "@/types/environment-data";

/**
 * 사회 데이터 페이지
 * 데이터 관리 > ESG 데이터 > 사회 데이터
 * 환경 데이터와 동일한 구조: KPI, AI 인사이트, 필터, 테이블, 상세 드로어, 데이터 품질, 추이 차트, 카테고리별 요약
 */
export default function SocialDataPage() {
  const [selectedRow, setSelectedRow] = useState<SocialDataRow | null>(null);
  const detail: SocialDataDetail | null = useMemo(
    () => (selectedRow ? getSocialDetailById(selectedRow.id) : null),
    [selectedRow]
  );

  return (
    <>
      <PageHeader
        title="사회 데이터"
        description="사회(Social) 관련 ESG 지표를 조회하고 관리합니다."
      >
        <EsgSubNav />
      </PageHeader>

      <div className="mt-8 space-y-8">
        {/* 1. KPI Summary Section */}
        <section>
          <h2 className="sr-only">KPI 요약</h2>
          <SocialKpiCards items={MOCK_SOCIAL_KPI} />
        </section>

        {/* 2. AI Insight Panel */}
        <section>
          <SocialAiInsight data={MOCK_SOCIAL_AI_INSIGHT} />
        </section>

        {/* 3. Filter Bar */}
        <section>
          <SocialFilters />
        </section>

        {/* 4. Social Data Table */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            사회 데이터 목록
          </h2>
          <SocialDataTable
            rows={MOCK_SOCIAL_TABLE_ROWS}
            onRowClick={setSelectedRow}
          />
        </section>

        {/* 5. Detail Drawer */}
        {selectedRow && (
          <SocialDetailDrawer
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
            items={MOCK_SOCIAL_DATA_QUALITY as unknown as DataQualityScore[]}
          />
        </section>

        {/* 7. Trend Analytics Section */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            추이 분석
          </h2>
          <SocialTrendCharts trend={MOCK_SOCIAL_TREND} />
        </section>

        {/* 8. Social Category Breakdown */}
        <section>
          <SocialCategoryBreakdown items={MOCK_SOCIAL_CATEGORY_BREAKDOWN} />
        </section>
      </div>
    </>
  );
}
