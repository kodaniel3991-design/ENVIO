"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const DataFlowMap = dynamic(
  () => import("@/components/getting-started/data-flow-map").then((m) => ({ default: m.DataFlowMap })),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-xl" /> }
);

export default function DataFlowPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">데이터 흐름 구조</h2>
        <p className="text-sm text-muted-foreground">
          KPI 설정 → 배출원 등록 → 데이터 입력 → 자동 집계까지의 전체 데이터 흐름을 확인합니다.
        </p>
      </div>
      <DataFlowMap />
    </div>
  );
}
