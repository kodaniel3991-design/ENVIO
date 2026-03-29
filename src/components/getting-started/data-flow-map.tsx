"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const DataFlowMindMap = dynamic(
  () => import("./data-flow-mind-map").then((m) => ({ default: m.DataFlowMindMap })),
  { ssr: false, loading: () => <Skeleton className="h-[400px] w-full rounded-xl" /> }
);
import {
  ChevronDown,
  Target,
  Database,
  Zap,
  Plug,
  BarChart3,
  ArrowRight,
  Leaf,
  Building2,
  Users,
  PenLine,
  FileSpreadsheet,
  ShieldCheck,
  TrendingDown,
  Link2,
  Info,
} from "lucide-react";

/* ── 가이드 콘텐츠 ── */
interface GuideItem {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

interface GuideSection {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  activeBg: string;
  summary: string;
  path: string;
  items: GuideItem[];
}

const GUIDES: GuideSection[] = [
  {
    id: "kpi",
    label: "KPI 매핑",
    sublabel: "자동 집계 / 수동 연결 설정",
    icon: Target,
    color: "text-primary",
    bgColor: "bg-primary/10 border-primary/30",
    activeBg: "bg-primary/5 border-primary/40 ring-2 ring-primary/20",
    summary: "KPI 항목별로 데이터 산출 방식을 설정합니다. 배출량 KPI는 자동 집계, 비배출 KPI는 수동 입력으로 구분됩니다.",
    path: "/data/esg/kpi-mapping",
    items: [
      { icon: Leaf, title: "탄소·환경 KPI → 자동 집계", description: "Scope 1·2·3 활동 데이터에서 배출량을 자동 산정하여 KPI 실적에 반영합니다. calcRule에 scope, category를 지정하면 해당 범위의 시설 데이터가 자동 합산됩니다.", color: "text-carbon-success" },
      { icon: Users, title: "사회·거버넌스 KPI → 수동 입력", description: "재해율, 교육 이수율, 이사회 독립성 등 배출량으로 산정할 수 없는 지표는 수동으로 실적 값을 입력합니다.", color: "text-navy-400" },
      { icon: Link2, title: "프리셋 선택", description: "Scope 1 전체, Scope 2 구입전력, Scope 1+2+3 합산 등 8가지 프리셋 중 선택하면 calcRule이 자동 설정됩니다.", color: "text-primary" },
      { icon: BarChart3, title: "미리보기", description: "설정된 calcRule 기반으로 현재 활동 데이터에서 값을 즉시 산출하여 미리 확인할 수 있습니다.", color: "text-primary" },
    ],
  },
  {
    id: "scope",
    label: "배출량 관리",
    sublabel: "Scope 1 · 2 · 3 데이터 입력",
    icon: Database,
    color: "text-foreground",
    bgColor: "bg-muted border-border",
    activeBg: "bg-muted/80 border-foreground/30 ring-2 ring-foreground/10",
    summary: "배출원(시설)을 등록하고, 월별 활동 데이터를 입력합니다. 각 시설은 KPI에 자동 연결됩니다.",
    path: "/data/emissions/scope1",
    items: [
      { icon: Building2, title: "Scope 1 — 직접 배출", description: "고정연소(보일러), 이동연소(차량), 비가스배출(탈루) 카테고리별로 시설을 등록합니다. NIER-2023 배출계수가 자동 적용됩니다.", color: "text-taupe-600" },
      { icon: Zap, title: "Scope 2 — 간접 배출", description: "구입전력(KEPCO), 증기·난방(지역난방) 카테고리로 구분합니다. KEPCO API 연동 시 전력 사용량이 자동 수집됩니다.", color: "text-carbon-success" },
      { icon: Users, title: "Scope 3 — 가치사슬 배출", description: "구입상품, 출장, 직원 통근 등 15개 카테고리를 지원합니다. 직원 통근은 직원명부와 연동하여 자동 산정됩니다.", color: "text-sky-600" },
      { icon: ShieldCheck, title: "배출원 → KPI 역참조", description: "등록된 시설의 배출원 목록에서 '기여 KPI' 컬럼으로 해당 시설이 어떤 KPI에 영향을 주는지 확인할 수 있습니다.", color: "text-primary" },
    ],
  },
  {
    id: "input",
    label: "데이터 입력",
    sublabel: "3가지 입력 방식",
    icon: PenLine,
    color: "text-foreground",
    bgColor: "bg-muted border-border",
    activeBg: "bg-muted/80 border-foreground/30 ring-2 ring-foreground/10",
    summary: "시설별 월별 활동량을 3가지 방식으로 입력할 수 있습니다. 입력된 데이터는 실시간으로 배출량 산정에 반영됩니다.",
    path: "/data/emissions/scope1",
    items: [
      { icon: PenLine, title: "직접 입력", description: "월별 활동량 테이블에 수기로 값을 입력합니다. 입력 즉시 배출량(tCO₂e)과 가스별(CO₂, CH₄, N₂O) 분해값이 자동 계산됩니다.", color: "text-foreground" },
      { icon: FileSpreadsheet, title: "Excel 일괄 업로드", description: "표준 템플릿을 다운로드 → 활동량 작성 → 업로드하면 전체 시설의 12개월 데이터가 일괄 저장됩니다. 시설명 매칭으로 자동 연결됩니다.", color: "text-foreground" },
      { icon: Plug, title: "API 연동", description: "설정 > API 키 관리에서 등록한 소스(KEPCO 등)와 시설을 매핑하여, 미리보기 → 동기화 실행으로 데이터를 자동 수집합니다.", color: "text-foreground" },
      { icon: Info, title: "데이터 출처 태깅", description: "각 활동 데이터에 입력 방식(Manual, Excel, API)이 자동 태깅되어 데이터 품질 추적이 가능합니다.", color: "text-muted-foreground" },
    ],
  },
  {
    id: "output",
    label: "자동 집계",
    sublabel: "활동량 × 배출계수 = 배출량",
    icon: BarChart3,
    color: "text-carbon-success",
    bgColor: "bg-green-50 border-green-200",
    activeBg: "bg-green-50 border-green-300 ring-2 ring-green-200",
    summary: "입력된 활동 데이터에 배출계수를 적용하여 배출량을 자동 산정하고, KPI 실적에 반영합니다.",
    path: "/data/emissions/scope1",
    items: [
      { icon: Zap, title: "배출량 산정", description: "활동량 × NIER-2023 배출계수 = tCO₂e. 가스별(CO₂, CH₄×GWP28, N₂O×GWP265) 분해 계산을 자동 수행합니다.", color: "text-carbon-success" },
      { icon: Target, title: "KPI 실적 자동 갱신", description: "calcRule에 설정된 Scope·카테고리의 전체 시설 배출량을 합산하여 KPI의 actualValue를 자동 업데이트합니다.", color: "text-primary" },
      { icon: TrendingDown, title: "전년도 대비 분석", description: "최대 3개년 데이터를 비교하여 월별 증감, 전년 대비 변화율을 자동 산출합니다.", color: "text-carbon-success" },
      { icon: BarChart3, title: "시설별·카테고리별 비교", description: "Stacked Bar, 도넛 차트, 랭킹 테이블로 시설 간/카테고리 간 배출량을 비교 분석합니다.", color: "text-carbon-success" },
    ],
  },
];

/* ── 플로우 화살표 ── */
const FLOW_STEPS = ["KPI 설정", "배출원 등록", "데이터 입력", "집계 결과", "KPI 실적 반영"];

export function DataFlowMap() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeGuide = GUIDES.find((g) => g.id === activeId);

  return (
    <div className="space-y-4">
      {/* 상단: 4개 메인 노드 */}
      <div className="grid grid-cols-4 gap-3">
        {GUIDES.map((node) => {
          const Icon = node.icon;
          const isActive = activeId === node.id;
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => setActiveId(isActive ? null : node.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border p-3 text-left transition-all",
                isActive ? node.activeBg : node.bgColor,
                "hover:shadow-sm"
              )}
            >
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 shrink-0", node.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{node.label}</p>
                <p className="text-[10px] text-muted-foreground truncate">{node.sublabel}</p>
              </div>
              <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0", isActive && "rotate-180")} />
            </button>
          );
        })}
      </div>

      {/* 플로우 화살표 */}
      <div className="flex items-center justify-center gap-1">
        {FLOW_STEPS.map((step, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              i === FLOW_STEPS.length - 1
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}>
              {step}
            </span>
            {i < FLOW_STEPS.length - 1 && (
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      {/* 하단: 선택된 노드의 가이드 박스 */}
      {activeGuide && (
        <div className={cn("rounded-xl border p-5 space-y-4 transition-all", activeGuide.activeBg)}>
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <activeGuide.icon className={cn("h-4 w-4", activeGuide.color)} />
                {activeGuide.label}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {activeGuide.summary}
              </p>
            </div>
            <a
              href={activeGuide.path}
              className="shrink-0 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              이동 <ArrowRight className="h-3 w-3" />
            </a>
          </div>

          {/* 가이드 항목 */}
          <div className="grid grid-cols-2 gap-3">
            {activeGuide.items.map((item, i) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={i}
                  className="flex gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className={cn("flex h-7 w-7 items-center justify-center rounded-md bg-muted shrink-0", item.color)}>
                    <ItemIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{item.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 하단: ReactFlow 마인드맵 */}
      <DataFlowMindMap />
    </div>
  );
}
