"use client";

import { useKpiByScope } from "@/hooks/use-kpi-by-scope";
import { KpiMappingSection } from "@/components/common/kpi-mapping-section";
import type { Scope2CategoryId } from "@/types/scope2";
import { AlertCircle, Info, Zap, Flame } from "lucide-react";

export interface Scope2SourceFacility {
  id: string;
  name: string;
  energyType: string;
  unit: string;
  emissionFactor?: number;
  status?: "active" | "inactive";
}

interface Scope2SourceExamplesProps {
  activeCategoryId: Scope2CategoryId;
  facilities?: Scope2SourceFacility[];
}

const CATEGORY_LABELS: Record<Scope2CategoryId, string> = {
  electricity: "구입전력",
  heat: "증기·난방",
};

const CATEGORY_GUIDE: Record<Scope2CategoryId, { description: string; examples: string; icon: React.ElementType }> = {
  electricity: {
    description: "외부에서 구입한 전력 사용에 따른 간접 온실가스 배출. KEPCO API 연동으로 자동 수집 가능.",
    examples: "본사 사무실(전력/MWh), 제조 공장(전력/MWh), 데이터센터 등",
    icon: Zap,
  },
  heat: {
    description: "외부에서 구입한 증기·난방·냉방 에너지 사용에 따른 간접 배출.",
    examples: "지역난방(증기/GJ), 증기 공급(증기/GJ), 온수 보일러 등",
    icon: Flame,
  },
};

export function Scope2SourceExamples({ activeCategoryId, facilities = [] }: Scope2SourceExamplesProps) {
  const { data: allKpis = [] } = useKpiByScope(2);
  const { data: categoryKpis = [] } = useKpiByScope(2, activeCategoryId);

  const contributingKpis = [...allKpis, ...categoryKpis].filter(
    (kpi, i, arr) => arr.findIndex((k) => k.id === kpi.id) === i
  );

  const guide = CATEGORY_GUIDE[activeCategoryId];
  const GuideIcon = guide.icon;
  const hasFacilities = facilities.length > 0;

  return (
    <section className="flex h-full flex-col space-y-3">
      <div>
        <h2 className="text-sm font-medium text-foreground">배출원 가이드 & 현황</h2>
        <p className="text-xs text-muted-foreground">
          {CATEGORY_LABELS[activeCategoryId]} 카테고리 — KPI 산출에 필요한 배출원을 안내합니다.
        </p>
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border border-border bg-card">
        {/* 카테고리 가이드 */}
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted shrink-0">
              <GuideIcon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">{CATEGORY_LABELS[activeCategoryId]}이란?</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">{guide.description}</p>
              <div className="mt-1.5 flex items-start gap-1">
                <Info className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">등록 예시:</span> {guide.examples}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 배출원 → KPI 매핑 현황 (접기/펼치기) */}
        {hasFacilities ? (
          <KpiMappingSection
            facilities={facilities}
            contributingKpis={contributingKpis}
            renderDetail={(f) => {
              const et = f.energyType as string;
              const label = et === "Electricity" ? "전력" : et === "Steam" ? "증기" : et;
              return `${label} · ${f.unit}`;
            }}
          />
        ) : (
          <div className="px-4 py-6 text-center">
            <AlertCircle className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
            <p className="text-xs font-medium text-foreground">등록된 배출원이 없습니다</p>
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
              위 KPI를 산출하려면 좌측 &quot;배출원 정보&quot;에서<br />
              &quot;+ 행 추가&quot; 버튼으로 시설을 등록하세요.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
