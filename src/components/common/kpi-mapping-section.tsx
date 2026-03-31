"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, Target } from "lucide-react";

interface FacilityItem {
  id: string;
  name: string;
}

interface KpiItem {
  id: string;
  code: string;
  name: string;
}

interface KpiMappingSectionProps<T extends FacilityItem = FacilityItem> {
  facilities: T[];
  contributingKpis: KpiItem[];
  /** 각 시설의 부가 정보 텍스트 (예: "도시가스(LNG) · Nm3") */
  renderDetail: (facility: T) => string;
}

export function KpiMappingSection<T extends FacilityItem>({ facilities, contributingKpis, renderDetail }: KpiMappingSectionProps<T>) {
  const [expanded, setExpanded] = useState(false);
  const first = facilities[0];
  const hasKpis = contributingKpis.length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-2 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-carbon-success" />
          <span className="text-xs font-medium text-foreground">배출원 → KPI 매핑 ({facilities.length}개)</span>
        </div>
        {expanded
          ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        }
      </button>

      {/* 접힌 상태: 대표 1개 */}
      {!expanded && first && (
        <div className="px-4 pb-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">{first.name}</span>
            <span className="text-[11px] text-muted-foreground">{renderDetail(first)}</span>
          </div>
          {hasKpis ? (
            <div className="flex flex-wrap gap-1">
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary">
                <Target className="h-2.5 w-2.5" />
                {contributingKpis[0].name}
                <span className="text-primary/50">{contributingKpis[0].code}</span>
              </span>
              {contributingKpis.length > 1 && (
                <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  +{contributingKpis.length - 1}개
                </span>
              )}
              {facilities.length > 1 && (
                <span className="text-[10px] text-muted-foreground ml-1">
                  외 {facilities.length - 1}개 배출원
                </span>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground">매핑된 KPI 없음 — KPI 매핑 페이지에서 설정하세요</p>
          )}
        </div>
      )}

      {/* 펼친 상태: 전체 */}
      {expanded && (
        <div className="divide-y divide-border/60">
          {facilities.map((f) => (
            <div key={f.id} className="px-4 py-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">{f.name}</span>
                <span className="text-[11px] text-muted-foreground">{renderDetail(f)}</span>
              </div>
              {hasKpis ? (
                <div className="flex flex-wrap gap-1">
                  {contributingKpis.map((kpi) => (
                    <span
                      key={kpi.id}
                      className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary"
                    >
                      <Target className="h-2.5 w-2.5" />
                      {kpi.name}
                      <span className="text-primary/50">{kpi.code}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground">매핑된 KPI 없음 — KPI 매핑 페이지에서 설정하세요</p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
