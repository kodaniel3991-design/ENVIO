"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "../wizard-store";
import {
  ALL_KPI,
  getAiRecommendation,
  getKpiRecommendationsByFrameworks,
  getMatchingFrameworks,
  type KpiItem,
} from "@/lib/ai-recommendations";
import { Sparkles, ArrowLeft, ArrowRight, Leaf, Users, Scale, Check, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── KPI 항목별 데이터 소스 매핑 ── */
interface DataSourceDef {
  label: string;
  path: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
}

const EMISSION_SRC: DataSourceDef = { label: "배출량 관리", path: "/data/emissions/scope1", color: "text-carbon-success", bgColor: "bg-green-50 border-green-200", icon: BarChart3 };
const ENV_ESG_SRC: DataSourceDef = { label: "ESG > 환경(E)", path: "/data/esg/environment", color: "text-carbon-success", bgColor: "bg-green-50/60 border-green-100", icon: Leaf };
const SOCIAL_SRC: DataSourceDef = { label: "ESG > 사회(S)", path: "/data/esg/social", color: "text-primary", bgColor: "bg-primary/5 border-primary/20", icon: Users };
const GOV_SRC: DataSourceDef = { label: "ESG > 거버넌스(G)", path: "/data/esg/governance", color: "text-taupe-500", bgColor: "bg-taupe-50 border-taupe-200", icon: Scale };

/** 배출량 관리에서 자동 집계 가능한 환경 KPI (항목명 기준) */
const EMISSION_MANAGED_KPIS = new Set([
  "온실가스 배출량(Scope 1+2)",
  "공급망 탄소(Scope 3)",
  "Scope3 카테고리별 배출",
  "총 에너지 사용량",
  "공급망 탄소 배출량",
]);

/** 배출량 관리 + ESG 환경 혼합 (배출량은 자동, 목표/비율은 수동) */
const MIXED_KPIS = new Set([
  "탄소 집약도",       // 배출량(자동) ÷ 매출(수동)
  "배출 감축률",       // 배출량(자동), 기준연도(수동)
  "탄소중립 목표 달성률", // 배출량(자동), 목표(수동)
  "에너지 집약도",     // 에너지(자동) ÷ 매출(수동)
]);

const MIXED_SRC: DataSourceDef = { label: "배출량 + 환경(E)", path: "/data/emissions/scope1", color: "text-carbon-warning", bgColor: "bg-taupe-50 border-taupe-200", icon: BarChart3 };

function getDataSource(category: KpiCategory, _group: string, name: string): DataSourceDef {
  if (category === "social") return SOCIAL_SRC;
  if (category === "governance") return GOV_SRC;
  // 환경: 항목명 기준 판단
  if (EMISSION_MANAGED_KPIS.has(name)) return EMISSION_SRC;
  if (MIXED_KPIS.has(name)) return MIXED_SRC;
  return ENV_ESG_SRC;
}

type KpiCategory = "environmental" | "social" | "governance";

const CATEGORIES: {
  key: KpiCategory;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  activeClass: string;
  badgeClass: string;
  rowSelectedClass: string;
  checkClass: string;
  groupCellClass: string;
}[] = [
  {
    key: "environmental",
    label: "환경",
    sublabel: "Environmental",
    icon: Leaf,
    activeClass: "border-carbon-success bg-green-50/60 text-carbon-success",
    badgeClass: "bg-carbon-success",
    rowSelectedClass: "bg-green-50",
    checkClass: "border-carbon-success bg-carbon-success text-white",
    groupCellClass: "bg-green-50/70 text-carbon-success",
  },
  {
    key: "social",
    label: "사회",
    sublabel: "Social",
    icon: Users,
    activeClass: "border-primary bg-primary/10 text-primary",
    badgeClass: "bg-primary",
    rowSelectedClass: "bg-primary/5",
    checkClass: "border-primary bg-primary text-white",
    groupCellClass: "bg-primary/5 text-primary",
  },
  {
    key: "governance",
    label: "거버넌스",
    sublabel: "Governance",
    icon: Scale,
    activeClass: "border-taupe-300 bg-taupe-50/60 text-taupe-400",
    badgeClass: "bg-taupe-400",
    rowSelectedClass: "bg-taupe-50",
    checkClass: "border-taupe-400 bg-taupe-400 text-white",
    groupCellClass: "bg-taupe-50/70 text-taupe-400",
  },
];

/** 동일 group이 연속되는 항목들의 rowSpan 맵을 계산 */
function calcGroupSpans(items: KpiItem[]): Map<number, number> {
  const spans = new Map<number, number>();
  let i = 0;
  while (i < items.length) {
    const group = items[i].group;
    let count = 1;
    while (i + count < items.length && items[i + count].group === group) count++;
    spans.set(i, count);
    i += count;
  }
  return spans;
}

export default function KpiPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<KpiCategory>("environmental");
  const { state, hydrated, updateKpi, markStepComplete } = useWizardStore();
  const { kpi, organization, framework } = state;

  const selectedFrameworks = framework.selected;
  const fwRec = getKpiRecommendationsByFrameworks(selectedFrameworks);
  const hasFwRec = fwRec.environmental.length > 0 || fwRec.social.length > 0 || fwRec.governance.length > 0;

  // 산업 AI 추천 — 카테고리별 폴백으로 항상 계산
  const aiRec = organization.industry ? getAiRecommendation(organization.industry) : null;

  // 카테고리별 하이브리드 추천: 프레임워크 매칭이 있으면 사용, 없으면 산업 AI 폴백
  const mergedRec = {
    environmental: fwRec.environmental.length > 0 ? fwRec.environmental : (aiRec?.kpi.environmental ?? []),
    social: fwRec.social.length > 0 ? fwRec.social : (aiRec?.kpi.social ?? []),
    governance: fwRec.governance.length > 0 ? fwRec.governance : (aiRec?.kpi.governance ?? []),
  };

  // hydrated 후 실행 — KPI가 비어있으면 추천 KPI를 기본 선택
  useEffect(() => {
    if (!hydrated) return;
    if (kpi.environmental.length > 0 || kpi.social.length > 0 || kpi.governance.length > 0) return;

    const rec = getKpiRecommendationsByFrameworks(state.framework.selected);
    const industryRec = state.organization.industry ? getAiRecommendation(state.organization.industry) : null;

    const merged = {
      environmental: rec.environmental.length > 0 ? rec.environmental : (industryRec?.kpi.environmental ?? []),
      social: rec.social.length > 0 ? rec.social : (industryRec?.kpi.social ?? []),
      governance: rec.governance.length > 0 ? rec.governance : (industryRec?.kpi.governance ?? []),
    };

    if (merged.environmental.length > 0 || merged.social.length > 0 || merged.governance.length > 0) {
      updateKpi(merged);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const toggle = (category: KpiCategory, item: KpiItem) => {
    const current = kpi[category];
    updateKpi({
      [category]: current.includes(item.name)
        ? current.filter((k) => k !== item.name)
        : [...current, item.name],
    });
  };

  const handleNext = async () => {
    // 선택된 KPI를 kpi_masters 테이블에 upsert
    const domainMap: Record<KpiCategory, string> = {
      environmental: "environment",
      social: "social",
      governance: "governance",
    };
    const items: { code: string; name: string; esgDomain: string; category: string; unit: string; description: string }[] = [];
    (["environmental", "social", "governance"] as KpiCategory[]).forEach((domain) => {
      kpi[domain].forEach((name) => {
        const item = ALL_KPI[domain].find((k) => k.name === name);
        if (!item) return;
        items.push({
          code: `${domain.slice(0, 3).toUpperCase()}-${name.slice(0, 46)}`,
          name: item.name,
          esgDomain: domainMap[domain],
          category: item.group,
          unit: item.criteria.length < 20 ? item.criteria : "—",
          description: item.description,
        });
      });
    });

    await fetch("/api/kpi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setup-kpis", items }),
    });

    markStepComplete(5);
    router.push("/getting-started");
  };

  const totalSelected = kpi.environmental.length + kpi.social.length + kpi.governance.length;
  const activeCat = CATEGORIES.find((c) => c.key === activeTab)!;

  // 현재 탭의 추천 목록: 카테고리별 하이브리드 (프레임워크 우선, 없으면 산업 AI 폴백)
  const recommended: string[] = mergedRec[activeTab];

  const items = ALL_KPI[activeTab];
  const groupSpans = calcGroupSpans(items);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-2">
        <h2 className="text-base font-bold text-foreground">⑤ KPI 선택</h2>
        <p className="text-sm text-muted-foreground">
          관리할 ESG KPI를 선택해 주세요.
          {(hasFwRec || aiRec) && (
            <span className="ml-2 inline-flex items-center gap-1 text-carbon-success">
              <Sparkles className="h-3 w-3" />
              {hasFwRec
                ? `선택한 공시 기준(${selectedFrameworks.join(", ")})${aiRec ? ` + ${organization.industry} 산업` : ""} 기반으로 자동 추천됩니다.`
                : `${organization.industry} 산업 AI 추천이 적용됐습니다.`}
            </span>
          )}
        </p>
      </div>

      {/* 추천 기준 안내 배너 */}
      {(hasFwRec || aiRec) && (
        <div className="mb-5 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3">
          <p className="mb-1.5 text-xs font-semibold text-carbon-success">
            💡 {hasFwRec
              ? "선택한 공시 기준에서 요구하는 핵심 KPI가 자동으로 체크됩니다."
              : `AI 추천 기준: ${organization.industry} 산업에서 주로 보고되는 핵심 KPI가 체크됩니다.`}
            {" "}필요에 따라 추가/제거해 주세요.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {hasFwRec && selectedFrameworks.map((fw) => (
              <span key={fw} className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-white">
                {fw}
              </span>
            ))}
            {aiRec && hasFwRec && (
              <span className="rounded-full bg-carbon-success px-2.5 py-0.5 text-[10px] font-bold text-white">
                + {organization.industry} 산업 AI
              </span>
            )}
          </div>
        </div>
      )}

      {/* 탭 + 그리드 */}
      <div className="rounded-xl border border-border overflow-hidden">
        {/* 탭 헤더 */}
        <div className="flex border-b border-border">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = kpi[cat.key].length;
            const recCount = mergedRec[cat.key].length;
            const isActive = activeTab === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveTab(cat.key)}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 px-4 py-3 text-xs font-medium transition-colors border-b-2 -mb-px",
                  isActive ? cat.activeClass : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-semibold">{cat.label}</span>
                  <span className="text-[10px] font-normal opacity-70">{cat.sublabel}</span>
                  {count > 0 && (
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white", cat.badgeClass)}>
                      {count}
                    </span>
                  )}
                  {recCount > 0 && (
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      추천 {recCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* 데이터 그리드 */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="w-20 px-3 py-2.5 text-left font-semibold text-muted-foreground">구분</th>
                <th className="w-8 px-2 py-2.5 text-center font-semibold text-muted-foreground">
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded border border-border bg-background" />
                </th>
                <th className="w-[18%] whitespace-nowrap px-3 py-2.5 text-left font-semibold text-muted-foreground">KPI 항목명</th>
                <th className="w-[18%] px-3 py-2.5 text-left font-semibold text-muted-foreground">설명</th>
                <th className="w-[10%] whitespace-nowrap px-3 py-2.5 text-left font-semibold text-muted-foreground">데이터 소스</th>
                <th className="w-[30%] px-3 py-2.5 text-left font-semibold text-muted-foreground">선정 사유</th>
                <th className="w-[14%] whitespace-nowrap px-3 py-2.5 text-left font-semibold text-muted-foreground">요구 기준</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item, idx) => {
                const selected = kpi[activeTab].includes(item.name);
                const isRec = recommended.includes(item.name);
                const matchingFws = hasFwRec ? getMatchingFrameworks(item, selectedFrameworks) : [];
                const isFirstInGroup = groupSpans.has(idx);
                const rowSpan = groupSpans.get(idx);

                return (
                  <tr
                    key={item.name}
                    onClick={() => toggle(activeTab, item)}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-muted/30",
                      selected ? activeCat.rowSelectedClass : ""
                    )}
                  >
                    {/* 구분 (rowspan) */}
                    {isFirstInGroup && (
                      <td
                        rowSpan={rowSpan}
                        className={cn(
                          "border-r border-border px-3 py-2.5 align-middle text-center text-[11px] font-semibold leading-snug",
                          activeCat.groupCellClass
                        )}
                      >
                        {item.group}
                      </td>
                    )}
                    {/* 체크박스 */}
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={cn(
                          "inline-flex h-4 w-4 items-center justify-center rounded border transition-colors",
                          selected ? activeCat.checkClass : "border-border bg-background"
                        )}
                      >
                        {selected && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                      </span>
                    </td>
                    {/* KPI명 + 프레임워크 배지 */}
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {isRec && <Sparkles className="h-3 w-3 shrink-0 text-carbon-success" />}
                        <span className={cn("font-medium", selected ? "text-foreground" : "text-foreground/80")}>
                          {item.name}
                        </span>
                        {matchingFws.length > 0 && (
                          <>
                            {matchingFws.slice(0, 2).map((fw) => (
                              <span
                                key={fw}
                                className="rounded px-1 py-0.5 text-[9px] font-bold bg-primary/10 text-primary"
                              >
                                {fw}
                              </span>
                            ))}
                            {matchingFws.length > 2 && (
                              <span className="text-[9px] text-carbon-success">+{matchingFws.length - 2}</span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    {/* 설명 */}
                    <td className="px-3 py-2.5 text-muted-foreground leading-snug">{item.description}</td>
                    {/* 데이터 소스 */}
                    <td className="whitespace-nowrap px-3 py-2.5">
                      {(() => {
                        const src = getDataSource(activeTab, item.group, item.name);
                        const SrcIcon = src.icon;
                        return (
                          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium", src.bgColor, src.color)}>
                            <SrcIcon className="h-3 w-3" />
                            {src.label}
                          </span>
                        );
                      })()}
                    </td>
                    {/* 선정 사유 */}
                    <td className="px-3 py-2.5 text-muted-foreground leading-snug">{item.reason}</td>
                    {/* 요구 기준 */}
                    <td className="px-3 py-2.5 text-muted-foreground leading-snug">{item.criteria}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 전체 요약 */}
      <div className="mt-4 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>총 <span className="font-semibold text-foreground">{totalSelected}개</span> KPI 선택됨</span>
          {CATEGORIES.map((cat) => (
            <span key={cat.key}>
              {cat.label} <span className="font-semibold text-foreground">{kpi[cat.key].length}</span>
            </span>
          ))}
          {hasFwRec && (
            <span className="text-carbon-success">
              <Sparkles className="mr-0.5 inline h-3 w-3" />
              {selectedFrameworks.join(" · ")} 기반 추천
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => router.push("/getting-started/framework")}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> 이전
        </button>
        <button
          onClick={handleNext}
          disabled={totalSelected === 0}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-40 hover:opacity-90"
        >
          설정 완료! <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
