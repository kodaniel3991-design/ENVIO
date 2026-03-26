"use client";

import { useQuery } from "@tanstack/react-query";
import { getVendorEsgScores } from "@/services/api";
import { PageHeader } from "@/components/layout/page-header";
import { PortalSubNav } from "@/components/portal/portal-sub-nav";
import { EsgScoreCard } from "@/components/portal/esg-score-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PortalAssessmentPage() {
  const { data: scores, isLoading } = useQuery({ queryKey: ["portal-esg-scores"], queryFn: getVendorEsgScores });

  return (
    <>
      <PageHeader title="협력사 ESG 평가" description="협력사별 ESG 종합 및 세부 점수를 확인합니다.">
        <PortalSubNav />
      </PageHeader>
      <div className="mt-8">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-40 rounded-lg" />)}</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{scores?.map((item: any) => <EsgScoreCard key={item.vendorId} item={item} />)}</div>
        )}
      </div>
    </>
  );
}
