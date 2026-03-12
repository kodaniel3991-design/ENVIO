"use client";

import { PageHeader } from "@/components/layout/page-header";

export default function ReportAuditTrailPage() {
  return (
    <>
      <PageHeader
        title="감사 추적"
        description="보고서 생성·수정·제출 이력을 조회하고 감사 추적을 관리합니다."
      />
      <div className="mt-8 rounded-lg border border-dashed border-border bg-muted/20 p-12 text-center text-sm text-muted-foreground">
        감사 추적 기능이 준비 중입니다.
      </div>
    </>
  );
}
