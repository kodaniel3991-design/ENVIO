"use client";

import { cn } from "@/lib/utils";
import { useKpiByScope } from "@/hooks/use-kpi-by-scope";
import { KpiMappingSection } from "@/components/common/kpi-mapping-section";
import { AlertCircle, Info, Package } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  u1: "구입상품 및 서비스", u2: "자본재", u3: "연료·에너지 관련(기타)",
  u4: "상류 수송 및 유통", u5: "사업장 폐기물", u6: "출장",
  u7: "직원 통근", u8: "상류 임차자산",
  d1: "하류 수송 및 유통", d2: "판매제품 가공", d3: "판매제품 사용",
  d4: "판매제품 폐기", d5: "하류 임차자산", d6: "프랜차이즈", d7: "투자",
};

/** 카테고리별 등록 가이드 (예시 활동 + 산정방식 + 단위) */
const CATEGORY_GUIDE: Record<string, { description: string; examples: { name: string; method: string; unit: string }[] }> = {
  u1: { description: "원재료, 부품, 소모품, 외주 서비스 등 구입 활동에서 발생하는 간접 배출", examples: [{ name: "원재료 구매", method: "Activity Based", unit: "ton" }, { name: "부품·소모품", method: "Activity Based", unit: "ton" }, { name: "포장재", method: "Spend Based", unit: "만원" }] },
  u2: { description: "생산 설비, 건물, 차량 등 자본재 구입에 따른 간접 배출", examples: [{ name: "생산 설비", method: "Activity Based", unit: "ton" }, { name: "건물·리트로핏", method: "Spend Based", unit: "만원" }] },
  u3: { description: "연료 전처리, 송배전 손실 등 에너지 관련 기타 간접 배출", examples: [{ name: "연료 전처리 공정", method: "Activity Based", unit: "GJ" }, { name: "송배전 손실", method: "Activity Based", unit: "MWh" }] },
  u4: { description: "원자재 수입, 물류센터 입고 등 상류 운송에 따른 간접 배출", examples: [{ name: "원자재 수입 수송", method: "Activity Based", unit: "ton·km" }, { name: "해상 운송", method: "Activity Based", unit: "ton·km" }] },
  u5: { description: "사업장에서 발생한 폐기물의 처리(매립, 소각, 재활용)에 따른 간접 배출", examples: [{ name: "일반 폐기물(매립)", method: "Activity Based", unit: "ton" }, { name: "재활용 폐기물", method: "Activity Based", unit: "ton" }] },
  u6: { description: "항공, 철도, 렌터카 등 출장 이동에 따른 간접 배출", examples: [{ name: "항공 출장", method: "Activity Based", unit: "person-km" }, { name: "철도 출장", method: "Activity Based", unit: "person-km" }] },
  u7: { description: "직원 자가용, 대중교통 등 출퇴근 이동에 따른 간접 배출. 직원명부 연동 가능.", examples: [{ name: "자가용 통근", method: "Activity Based", unit: "km" }, { name: "대중교통", method: "Activity Based", unit: "person-km" }] },
  u8: { description: "임차 사무실, 창고 등에서 발생하는 간접 배출", examples: [{ name: "임차 사무실", method: "Activity Based", unit: "m²" }] },
  d1: { description: "제품 배송, 리테일 물류 등 하류 운송에 따른 간접 배출", examples: [{ name: "제품 배송(육상)", method: "Activity Based", unit: "ton·km" }] },
  d2: { description: "판매한 부품의 하도급 가공, 조립 외주 등에 따른 간접 배출", examples: [{ name: "부품 가공(하도급)", method: "Activity Based", unit: "ton" }] },
  d3: { description: "판매한 제품의 사용 단계에서 발생하는 간접 배출", examples: [{ name: "전자제품 사용 전력", method: "Activity Based", unit: "kWh" }] },
  d4: { description: "판매한 제품의 폐기(소각, 매립, 재활용) 단계 간접 배출", examples: [{ name: "제품 소각 처리", method: "Activity Based", unit: "ton" }] },
  d5: { description: "하류 임차자산에서 발생하는 간접 배출", examples: [{ name: "임대 매장", method: "Activity Based", unit: "m²" }] },
  d6: { description: "가맹점의 에너지·연료 사용에 따른 간접 배출", examples: [{ name: "가맹점 에너지", method: "Activity Based", unit: "MWh" }] },
  d7: { description: "지분/채권 투자 포트폴리오의 간접 배출", examples: [{ name: "지분 투자", method: "Average Based", unit: "억원" }] },
};

const METHOD_STYLE: Record<string, string> = {
  "Activity Based": "bg-green-50 text-carbon-success border-green-200",
  "Spend Based": "bg-sky-50 text-sky-700 border-sky-100",
  "Average Based": "bg-primary/10 text-primary border-primary/30",
};

export interface Scope3SourceFacility {
  id: string;
  name: string;
  activityType: string;
  unit: string;
  status?: "active" | "inactive";
}

interface Scope3SourceReferenceProps {
  activeCategoryId: string;
  facilities?: Scope3SourceFacility[];
}

export function Scope3SourceReference({ activeCategoryId, facilities }: Scope3SourceReferenceProps) {
  const hasFacilities = facilities && facilities.length > 0;
  const label = CATEGORY_LABELS[activeCategoryId] ?? activeCategoryId;
  const guide = CATEGORY_GUIDE[activeCategoryId];

  const { data: allKpis = [] } = useKpiByScope(3);
  const { data: categoryKpis = [] } = useKpiByScope(3, activeCategoryId);
  const contributingKpis = [...allKpis, ...categoryKpis].filter(
    (kpi, i, arr) => arr.findIndex((k) => k.id === kpi.id) === i
  );

  return (
    <section className="flex h-full flex-col space-y-3">
      <div>
        <h2 className="text-sm font-medium text-foreground">배출원 가이드 & 현황</h2>
        <p className="text-xs text-muted-foreground">
          {label} — KPI 산출에 필요한 배출원을 안내합니다.
        </p>
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border border-border bg-card">
        {/* 카테고리 가이드 */}
        {guide && (
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted shrink-0">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-foreground">{label}이란?</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">{guide.description}</p>
                <div className="mt-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Info className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] font-medium text-foreground">등록 예시:</span>
                  </div>
                  <div className="space-y-1">
                    {guide.examples.map((ex) => (
                      <div key={ex.name} className="flex items-center gap-2 text-[11px]">
                        <span className="text-muted-foreground">{ex.name}</span>
                        <span className={cn("rounded-full border px-1.5 py-0.5 text-[9px] font-medium", METHOD_STYLE[ex.method] ?? "")}>
                          {ex.method}
                        </span>
                        <span className="text-muted-foreground/70">{ex.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 배출원 → KPI 매핑 현황 (접기/펼치기) */}
        {hasFacilities ? (
          <KpiMappingSection facilities={facilities!} contributingKpis={contributingKpis} renderDetail={(f) => `${f.activityType} · ${f.unit}`} />
        ) : (
          <div className="px-4 py-6 text-center">
            <AlertCircle className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
            <p className="text-xs font-medium text-foreground">등록된 배출원이 없습니다</p>
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
              위 KPI를 산출하려면 좌측 &quot;배출원 정보&quot;에서<br />
              &quot;+ 행 추가&quot; 버튼으로 활동을 등록하세요.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
