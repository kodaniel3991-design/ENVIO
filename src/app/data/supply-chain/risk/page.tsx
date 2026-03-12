"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PortalSubNav } from "@/components/portal/portal-sub-nav";

export default function SupplyChainRiskPage() {
  return (
    <>
      <PageHeader
        title="공급사 리스크 관리"
        description="공급망 협력사의 ESG·탄소 리스크를 모니터링하고 관리합니다."
      >
        <PortalSubNav />
      </PageHeader>
      <div className="mt-8 rounded-lg border border-dashed border-border bg-muted/20 p-12 text-center text-sm text-muted-foreground">
        공급사 리스크 관리 기능이 준비 중입니다.
      </div>
    </>
  );
}
