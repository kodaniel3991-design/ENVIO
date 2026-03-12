"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ValidationSummaryCards } from "@/components/validation/validation-summary-cards";
import { ValidationAiInsight } from "@/components/validation/validation-ai-insight";
import { ValidationFilters } from "@/components/validation/validation-filters";
import { ValidationDataTable } from "@/components/validation/validation-data-table";
import { ValidationDetailDrawer } from "@/components/validation/validation-detail-drawer";
import { ValidationWorkflowSection } from "@/components/validation/validation-workflow-section";
import { ValidationQualityCards } from "@/components/validation/validation-quality-cards";
import {
  MOCK_VALIDATION_SUMMARY,
  MOCK_VALIDATION_AI_INSIGHT,
  MOCK_VALIDATION_TABLE_ROWS,
  MOCK_VALIDATION_QUALITY,
  MOCK_VALIDATION_WORKFLOW,
  getValidationDetailById,
} from "@/lib/mock/validation-data";
import type {
  ValidationDataRow,
  ValidationDataDetail,
} from "@/types/validation-data";
import { Button } from "@/components/ui/button";
import { Download, Filter, CheckCircle } from "lucide-react";

/**
 * 데이터 검증 페이지
 * 경로: /dashboard/data-management/validation
 * Breadcrumb: 데이터 관리 > 데이터 검증
 */
export default function ValidationPage() {
  const [selectedRow, setSelectedRow] = useState<ValidationDataRow | null>(
    null
  );
  const detail: ValidationDataDetail | null = useMemo(
    () =>
      selectedRow ? getValidationDetailById(selectedRow.id) : null,
    [selectedRow]
  );

  return (
    <>
      <PageHeader
        title="데이터 검증"
        description="제출된 Scope 1, 2, 3 배출 데이터를 검토하고 이상치, 누락, 증빙 상태를 확인합니다."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="mr-1.5 h-4 w-4" />
            이상 항목만 보기
          </Button>
          <Button size="sm">
            <CheckCircle className="mr-1.5 h-4 w-4" />
            일괄 검토완료
          </Button>
        </div>
      </PageHeader>

      <div className="mt-8 space-y-8">
        {/* 1. Summary KPI */}
        <section>
          <h2 className="sr-only">검증 운영 현황</h2>
          <ValidationSummaryCards items={MOCK_VALIDATION_SUMMARY} />
        </section>

        {/* 2. AI Validation Insight */}
        <section>
          <ValidationAiInsight data={MOCK_VALIDATION_AI_INSIGHT} />
        </section>

        {/* 3. Filter Bar */}
        <section>
          <ValidationFilters />
        </section>

        {/* 4. Validation Data Table */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            검증 대상 목록
          </h2>
          <ValidationDataTable
            rows={MOCK_VALIDATION_TABLE_ROWS}
            onRowClick={setSelectedRow}
          />
        </section>

        {/* 5. Detail Drawer */}
        {selectedRow && (
          <ValidationDetailDrawer
            detail={detail}
            onClose={() => setSelectedRow(null)}
          />
        )}

        {/* 6. Validation Workflow */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            검토 워크플로우
          </h2>
          <ValidationWorkflowSection steps={MOCK_VALIDATION_WORKFLOW} />
        </section>

        {/* 7. Data Quality */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            데이터 품질
          </h2>
          <ValidationQualityCards items={MOCK_VALIDATION_QUALITY} />
        </section>
      </div>
    </>
  );
}
