"use client";

import { useKpiByScope } from "@/hooks/use-kpi-by-scope";
import { KpiMappingSection } from "@/components/common/kpi-mapping-section";
import type { ScopeCategoryId } from "@/types/scope1";
import {
  AlertCircle,
  Info,
  Flame,
  Zap,
  Building2,
} from "lucide-react";

/* ── 시설 데이터 (부모에서 전달) ── */
export interface SourceReferenceFacility {
  id: string;
  name: string;
  fuel: string;
  unit: string;
  emissionFactor?: number;
  status?: "active" | "inactive";
}

interface SourceReferenceProps {
  activeCategoryId: ScopeCategoryId;
  facilities?: SourceReferenceFacility[];
}

const CATEGORY_LABELS: Record<ScopeCategoryId, string> = {
  fixed: "고정연소",
  mobile: "이동연소",
  fugitive: "비가스배출",
};

const CATEGORY_GUIDE: Record<ScopeCategoryId, { description: string; examples: string; icon: React.ElementType }> = {
  fixed: {
    description: "사업장 내 고정 설비(보일러, 발전기, 용해로 등)에서 연료 연소 시 발생하는 직접 배출",
    examples: "보일러(LNG/Nm3), 발전기(Diesel/L), 용해로(LNG/Nm3), 건조기, 가열로 등",
    icon: Building2,
  },
  mobile: {
    description: "사업장 소유 차량·장비의 연료 연소에서 발생하는 직접 배출",
    examples: "업무용 승용차(Gasoline/L), 배송 밴(Diesel/L), 화물 트럭, 지게차 등",
    icon: Zap,
  },
  fugitive: {
    description: "냉매 누출, 공정 배출 등 의도하지 않은 온실가스 직접 배출",
    examples: "공정 배출 설비(LNG/Nm3), 냉동·냉장 설비(냉매/kg) 등",
    icon: Flame,
  },
};

export function SourceReference({ activeCategoryId, facilities = [] }: SourceReferenceProps) {
  const { data: allKpis = [] } = useKpiByScope(1);
  const { data: categoryKpis = [] } = useKpiByScope(1, activeCategoryId);

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
        {/* ── 카테고리 가이드 ── */}
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

        {/* ── 배출원 → KPI 매핑 현황 (접기/펼치기) ── */}
        {hasFacilities ? (
          <KpiMappingSection facilities={facilities} contributingKpis={contributingKpis} renderDetail={(f) => `${f.fuel} · ${f.unit}`} />
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
