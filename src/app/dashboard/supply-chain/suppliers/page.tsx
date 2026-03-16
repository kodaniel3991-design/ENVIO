"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SupplierPortalSubNav } from "@/components/supplier-portal/supplier-portal-sub-nav";
import { SupplierPortalSummaryCards } from "@/components/supplier-portal/supplier-portal-summary-cards";
import { SupplierPortalInsightPanel } from "@/components/supplier-portal/supplier-portal-insight-panel";
import { SupplierPortalFilters } from "@/components/supplier-portal/supplier-portal-filters";
import { SupplierPortalTable } from "@/components/supplier-portal/supplier-portal-table";
import { SupplierPortalDetailDrawer } from "@/components/supplier-portal/supplier-portal-detail-drawer";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const SupplierPortalAnalytics = dynamic(
  () => import("@/components/supplier-portal/supplier-portal-analytics").then((m) => ({ default: m.SupplierPortalAnalytics })),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-lg" /> }
);
import { Scope3CoverageCard } from "@/components/supplier-portal/scope3-coverage-card";
import {
  MOCK_SUPPLIER_SUMMARY,
  MOCK_SUPPLIER_INSIGHT,
  MOCK_SUPPLIER_ROWS,
  MOCK_STATUS_DISTRIBUTION,
  MOCK_TIER_DISTRIBUTION,
  MOCK_RISK_DISTRIBUTION,
  MOCK_RESPONSE_TREND,
  MOCK_SCOPE3_COVERAGE,
  getSupplierDetailById,
} from "@/lib/mock/supplier-portal";
import type { SupplierRow, SupplierDetail } from "@/types/supplier-portal";
import { Button } from "@/components/ui/button";
import { Download, Send, UserPlus, Network } from "lucide-react";

/**
 * 협력사 포털 페이지
 * 경로: /dashboard/supply-chain/suppliers
 * 메뉴 "협력사 포털" → /data/supply-chain/vendors 에서도 동일 화면 노출
 * Breadcrumb: 데이터 관리 > 공급망 포털 > 협력사 포털
 */
export default function SupplierPortalPage() {
  const [selectedRow, setSelectedRow] = useState<SupplierRow | null>(null);
  const detail: SupplierDetail | null = useMemo(
    () => (selectedRow ? getSupplierDetailById(selectedRow.id) : null),
    [selectedRow]
  );

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Network className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden />
            협력사 관리
          </span>
        }
        description="협력사를 조회하고 초대/재발송, 데이터 제출 상태, 리스크 및 ESG 수준을 관리합니다."
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="mr-1.5 h-4 w-4" />
              협력사 초대
            </Button>
            <Button variant="outline" size="sm" className="border-blue-500/30">
              <Send className="mr-1.5 h-4 w-4" />
              리마인드 발송
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-1.5 h-4 w-4" />
              Export
            </Button>
          </div>
          <SupplierPortalSubNav />
        </div>
      </PageHeader>

      <div className="mt-8 space-y-8">
        {/* 1. Summary KPI */}
        <section>
          <h2 className="sr-only">협력사 네트워크 현황</h2>
          <SupplierPortalSummaryCards items={MOCK_SUPPLIER_SUMMARY} />
        </section>

        {/* 2. Insight Panel */}
        <section>
          <SupplierPortalInsightPanel data={MOCK_SUPPLIER_INSIGHT} />
        </section>

        {/* 3. Filters */}
        <section>
          <SupplierPortalFilters />
        </section>

        {/* 4. Table */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            협력사 목록
          </h2>
          <SupplierPortalTable
            rows={MOCK_SUPPLIER_ROWS}
            onRowClick={setSelectedRow}
          />
        </section>

        {/* 5. Detail Drawer */}
        {selectedRow && (
          <SupplierPortalDetailDrawer
            detail={detail}
            onClose={() => setSelectedRow(null)}
          />
        )}

        {/* 6. Analytics */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            네트워크 현황 분석
          </h2>
          <SupplierPortalAnalytics
            statusDistribution={MOCK_STATUS_DISTRIBUTION}
            tierDistribution={MOCK_TIER_DISTRIBUTION}
            riskDistribution={MOCK_RISK_DISTRIBUTION}
            responseTrend={MOCK_RESPONSE_TREND}
          />
        </section>

        {/* 7. Scope 3 Coverage */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Scope 3 커버리지
          </h2>
          <Scope3CoverageCard items={MOCK_SCOPE3_COVERAGE} />
        </section>
      </div>
    </>
  );
}
