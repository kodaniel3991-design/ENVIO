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
import { CollapsibleSection } from "@/components/common/collapsible-section";
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

/**
 * 사회 데이터 페이지
 * 데이터 관리 > ESG 데이터 > 사회 데이터
 * - KPI 요약, AI 인사이트, 필터, 테이블, 상세 드로어, 데이터 품질, 추이 차트, 카테고리 요약
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
        <CollapsibleSection title="KPI 요약" defaultOpen>
          <SocialKpiCards items={MOCK_SOCIAL_KPI} />
        </CollapsibleSection>

        <CollapsibleSection title="AI 인사이트" defaultOpen>
          <SocialAiInsight data={MOCK_SOCIAL_AI_INSIGHT} />
        </CollapsibleSection>

        <section>
          <SocialFilters />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            사회 데이터 목록
          </h2>
          <SocialDataTable
            rows={MOCK_SOCIAL_TABLE_ROWS}
            onRowClick={setSelectedRow}
          />
        </section>

        {selectedRow && (
          <SocialDetailDrawer
            detail={detail}
            onClose={() => setSelectedRow(null)}
          />
        )}

        <CollapsibleSection title="데이터 품질">
          <DataQualityCards items={MOCK_SOCIAL_DATA_QUALITY} />
        </CollapsibleSection>

        <CollapsibleSection title="추이 분석">
          <SocialTrendCharts trend={MOCK_SOCIAL_TREND} />
        </CollapsibleSection>

        <CollapsibleSection title="카테고리 요약">
          <SocialCategoryBreakdown items={MOCK_SOCIAL_CATEGORY_BREAKDOWN} />
        </CollapsibleSection>
      </div>
    </>
  );
}
