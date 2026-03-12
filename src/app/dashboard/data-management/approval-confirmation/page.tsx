"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ApprovalSummaryCards } from "@/components/approval/approval-summary-cards";
import { ApprovalInsightPanel } from "@/components/approval/approval-insight-panel";
import { ApprovalFilters } from "@/components/approval/approval-filters";
import { ApprovalDataTable } from "@/components/approval/approval-data-table";
import { ApprovalDetailDrawer } from "@/components/approval/approval-detail-drawer";
import { ApprovalWorkflowSection } from "@/components/approval/approval-workflow-section";
import { ConfirmationPolicyCard } from "@/components/approval/confirmation-policy-card";
import { ReportLinkageCard } from "@/components/approval/report-linkage-card";
import {
  MOCK_APPROVAL_SUMMARY,
  MOCK_APPROVAL_INSIGHT,
  MOCK_APPROVAL_TABLE_ROWS,
  MOCK_APPROVAL_WORKFLOW,
  getApprovalDetailById,
} from "@/lib/mock/approval-data";
import type {
  ApprovalDataRow,
  ApprovalDataDetail,
} from "@/types/approval-data";
import { Button } from "@/components/ui/button";
import { Download, Filter, CheckCircle, XCircle } from "lucide-react";

/**
 * 데이터 승인 / 확정 페이지
 * 경로: /dashboard/data-management/approval-confirmation
 * Breadcrumb: 데이터 관리 > 데이터 승인 / 확정
 */
export default function ApprovalConfirmationPage() {
  const [selectedRow, setSelectedRow] = useState<ApprovalDataRow | null>(
    null
  );
  const detail: ApprovalDataDetail | null = useMemo(
    () =>
      selectedRow ? getApprovalDetailById(selectedRow.id) : null,
    [selectedRow]
  );

  return (
    <>
      <PageHeader
        title="데이터 승인 / 확정"
        description="검증 완료된 Scope 1, 2, 3 배출 데이터를 승인하고 최종 확정하여 공식 ESG 데이터로 관리합니다."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="mr-1.5 h-4 w-4" />
            승인 대기만 보기
          </Button>
          <Button size="sm">
            <CheckCircle className="mr-1.5 h-4 w-4" />
            일괄 승인
          </Button>
          <Button variant="outline" size="sm">
            <XCircle className="mr-1.5 h-4 w-4" />
            일괄 반려
          </Button>
        </div>
      </PageHeader>

      <div className="mt-8 space-y-8">
        {/* 1. Summary KPI */}
        <section>
          <h2 className="sr-only">승인/확정 운영 현황</h2>
          <ApprovalSummaryCards items={MOCK_APPROVAL_SUMMARY} />
        </section>

        {/* 2. Approval Insight */}
        <section>
          <ApprovalInsightPanel data={MOCK_APPROVAL_INSIGHT} />
        </section>

        {/* 3. Filter Bar */}
        <section>
          <ApprovalFilters />
        </section>

        {/* 4. Approval Data Table */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            승인 대상 목록
          </h2>
          <ApprovalDataTable
            rows={MOCK_APPROVAL_TABLE_ROWS}
            onRowClick={setSelectedRow}
          />
        </section>

        {/* 5. Detail Drawer */}
        {selectedRow && (
          <ApprovalDetailDrawer
            detail={detail}
            onClose={() => setSelectedRow(null)}
          />
        )}

        {/* 6. Approval Workflow */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            승인 프로세스
          </h2>
          <ApprovalWorkflowSection steps={MOCK_APPROVAL_WORKFLOW} />
        </section>

        {/* 7. Confirmation Policy */}
        <section>
          <ConfirmationPolicyCard />
        </section>

        {/* 8. Report Linkage */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            보고서 연계
          </h2>
          <ReportLinkageCard />
        </section>
      </div>
    </>
  );
}
