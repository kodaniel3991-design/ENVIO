"use client";

import { cn } from "@/lib/utils";
import { useKpiByScope } from "@/hooks/use-kpi-by-scope";
import type { Scope2CategoryId } from "@/types/scope2";
import { Target, CheckCircle2, AlertCircle, Info, Zap, Flame } from "lucide-react";

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
    examples: "본사 사무실(Electricity/MWh), 제조 공장(Electricity/MWh), 데이터센터 등",
    icon: Zap,
  },
  heat: {
    description: "외부에서 구입한 증기·난방·냉방 에너지 사용에 따른 간접 배출.",
    examples: "지역난방(Steam/GJ), 증기 공급(Steam/GJ), 온수 보일러 등",
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
        {/* 관련 KPI */}
        <div className="border-b border-border bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground">이 카테고리가 기여하는 KPI</span>
          </div>
          {contributingKpis.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {contributingKpis.map((kpi) => (
                <span key={kpi.id} className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-background px-2 py-0.5 text-[11px] font-medium text-primary" title={kpi.name}>
                  <Target className="h-2.5 w-2.5" />
                  {kpi.code} {kpi.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">KPI 매핑에서 Scope 2 자동 집계를 설정하면 표시됩니다.</p>
          )}
        </div>

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

        {/* 등록 현황 */}
        {hasFacilities ? (
          <>
            <div className="px-4 py-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-carbon-success" />
              <span className="text-xs font-medium text-foreground">등록된 배출원 ({facilities.length}개)</span>
            </div>
            <div className="overflow-x-auto border-t border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 text-xs text-muted-foreground">
                    <th className="px-3 py-2 text-left font-medium">사용처</th>
                    <th className="px-3 py-2 text-left font-medium">에너지</th>
                    <th className="px-2 py-2 text-left font-medium">단위</th>
                    <th className="px-2 py-2 text-right font-medium">배출계수</th>
                    <th className="px-3 py-2 text-left font-medium">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {facilities.map((f) => {
                    const status = f.status ?? "active";
                    return (
                      <tr key={f.id} className="border-t border-border/60">
                        <td className="px-3 py-2 text-xs font-medium">{f.name}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{f.energyType}</td>
                        <td className="px-2 py-2 text-xs text-muted-foreground">{f.unit}</td>
                        <td className="px-2 py-2 text-right text-xs text-muted-foreground tabular-nums">
                          {f.emissionFactor != null ? f.emissionFactor.toFixed(4) : "—"}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                            status === "active"
                              ? "border border-border bg-green-50 text-carbon-success"
                              : "border border-border/50 bg-muted text-muted-foreground"
                          )}>
                            {status === "active" ? "활성" : "비활성"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
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
