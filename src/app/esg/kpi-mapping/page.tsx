"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { EsgSubNav } from "@/components/esg/esg-sub-nav";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CollapsibleSection } from "@/components/common/collapsible-section";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Link2,
  ChevronDown,
  ChevronRight,
  Filter,
  Search,
  Leaf,
  Users,
  Scale,
  Flame,
  List,
  GitBranch,
  BarChart3,
  ClipboardList,
} from "lucide-react";

const KpiMindMap = dynamic(
  () => import("@/components/kpi-mapping/kpi-mind-map").then((m) => ({ default: m.KpiMindMap })),
  { ssr: false, loading: () => <Skeleton className="h-[600px] w-full rounded-xl" /> }
);
import {
  MOCK_DATA_SOURCES,
  MOCK_KPI_NODES,
  MOCK_MIND_MAP_LINKS,
} from "@/components/kpi-mapping/kpi-mind-map";
import { mockKpiMaster, mockKpiList } from "@/lib/mock/kpi";
import { MOCK_ENV_TABLE_ROWS } from "@/lib/mock/environment-data";
import { MOCK_SOCIAL_TABLE_ROWS } from "@/lib/mock/social-data";
import { MOCK_GOV_TABLE_ROWS } from "@/lib/mock/governance-data";
import type { DataStatus } from "@/types";

/* ── 매핑 상태 타입 ── */
type MappingStatus = "linked" | "partial" | "unlinked";

interface MappedDataEntry {
  id: string;
  indicatorName: string;
  value: number;
  unit: string;
  source: string;
  status: DataStatus;
  period: string;
}

interface KpiMappingItem {
  kpiId: string;
  kpiCode: string;
  kpiName: string;
  category: "environment" | "social" | "governance" | "carbon";
  unit: string;
  target?: number | string;
  actual?: number | string;
  mappingStatus: MappingStatus;
  dataEntries: MappedDataEntry[];
}

/* ── 데이터 소스에서 매핑 생성 ── */
function buildMappings(): KpiMappingItem[] {
  const allDataRows = [
    ...MOCK_ENV_TABLE_ROWS.map((r) => ({ ...r, domain: "environment" as const })),
    ...MOCK_SOCIAL_TABLE_ROWS.map((r) => ({ ...r, domain: "social" as const })),
    ...MOCK_GOV_TABLE_ROWS.map((r) => ({ ...r, domain: "governance" as const })),
  ];

  return mockKpiMaster.map((kpi) => {
    const listItem = mockKpiList.find((l) => l.id === kpi.id);

    // 이름 유사도 기반 매칭 (실제에서는 DB 관계 사용)
    const matched = allDataRows.filter(
      (row) =>
        row.indicatorName.includes(kpi.name) ||
        kpi.name.includes(row.indicatorName) ||
        (kpi.category === row.domain &&
          row.unit === kpi.unit &&
          row.indicatorName.toLowerCase().includes(kpi.name.split(" ")[0]))
    );

    const mappingStatus: MappingStatus =
      matched.length === 0
        ? "unlinked"
        : matched.some((m) => m.status === "pending" || m.status === "missing")
          ? "partial"
          : "linked";

    return {
      kpiId: kpi.id,
      kpiCode: kpi.code,
      kpiName: kpi.name,
      category: kpi.category,
      unit: kpi.unit,
      target: listItem?.target,
      actual: listItem?.actual,
      mappingStatus,
      dataEntries: matched.map((m) => ({
        id: m.id,
        indicatorName: m.indicatorName,
        value: m.value,
        unit: m.unit,
        source: m.source,
        status: m.status,
        period: m.period,
      })),
    };
  });
}

/* ── 상태 배지 ── */
function StatusBadge({ status }: { status: MappingStatus }) {
  const config = {
    linked: {
      icon: CheckCircle2,
      label: "연결 완료",
      cls: "bg-green-50 text-carbon-success",
    },
    partial: {
      icon: AlertTriangle,
      label: "부분 연결",
      cls: "bg-taupe-50 text-carbon-warning",
    },
    unlinked: {
      icon: XCircle,
      label: "미연결",
      cls: "bg-destructive/10 text-carbon-danger",
    },
  }[status];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        config.cls
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function DataStatusDot({ status }: { status: DataStatus }) {
  const cls = {
    verified: "bg-carbon-success",
    estimated: "bg-carbon-warning",
    pending: "bg-muted-foreground",
    missing: "bg-carbon-danger",
    ai_anomaly: "bg-destructive",
  }[status];
  const label = {
    verified: "검증됨",
    estimated: "추정치",
    pending: "대기",
    missing: "누락",
    ai_anomaly: "이상치",
  }[status];
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <span className={cn("h-2 w-2 rounded-full", cls)} />
      {label}
    </span>
  );
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  environment: Leaf,
  carbon: Flame,
  social: Users,
  governance: Scale,
};

const CATEGORY_LABELS: Record<string, string> = {
  environment: "환경",
  carbon: "탄소",
  social: "사회",
  governance: "거버넌스",
};

/* ── 자동 집계 Scope 프리셋 ── */
const AUTO_CALC_PRESETS: { label: string; rule: { scope: number | number[]; categories?: string[]; formula: string } }[] = [
  { label: "Scope 1 전체", rule: { scope: 1, formula: "emission" } },
  { label: "Scope 1 — 고정연소", rule: { scope: 1, categories: ["fixed"], formula: "emission" } },
  { label: "Scope 1 — 이동연소", rule: { scope: 1, categories: ["mobile"], formula: "emission" } },
  { label: "Scope 2 전체", rule: { scope: 2, formula: "emission" } },
  { label: "Scope 2 — 구입전력", rule: { scope: 2, categories: ["electricity"], formula: "emission" } },
  { label: "Scope 3 전체", rule: { scope: 3, formula: "emission" } },
  { label: "Scope 1+2 합산", rule: { scope: [1, 2], formula: "emission" } },
  { label: "Scope 1+2+3 합산", rule: { scope: [1, 2, 3], formula: "emission" } },
];

/* ── 매핑 행 ── */
function MappingRow({ item }: { item: KpiMappingItem }) {
  const [open, setOpen] = useState(false);
  const CatIcon = CATEGORY_ICONS[item.category] ?? Leaf;

  // 산출 방식 — DB 저장 연동
  const isCarbon = item.category === "carbon" || (item.category === "environment" && item.unit === "tCO2e");
  const [calcType, setCalcType] = useState<"auto" | "manual">(isCarbon ? "auto" : "manual");
  const [selectedPreset, setSelectedPreset] = useState(
    isCarbon
      ? item.kpiName.includes("Scope 1") ? 0
        : item.kpiName.includes("Scope 2") ? 3
          : item.kpiName.includes("Scope 3") ? 5
            : 7 // 전체
      : -1
  );
  const [autoValue, setAutoValue] = useState<number | null>(null);
  const [isCalcing, setIsCalcing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  // DB에 calcType + calcRule 저장
  const saveCalcRule = async (type: "auto" | "manual", presetIdx?: number) => {
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      const calcRule = type === "auto" && presetIdx != null && presetIdx >= 0
        ? AUTO_CALC_PRESETS[presetIdx].rule
        : null;
      await fetch(`/api/kpi/${item.kpiId}/value`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calcType: type, calcRule }),
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCalcTypeChange = (type: "auto" | "manual") => {
    setCalcType(type);
    setAutoValue(null);
    saveCalcRule(type, type === "auto" ? selectedPreset : undefined);
  };

  const handlePresetChange = (idx: number) => {
    setSelectedPreset(idx);
    setAutoValue(null);
    saveCalcRule("auto", idx);
  };

  const handlePreviewAutoValue = async () => {
    if (selectedPreset < 0) return;
    setIsCalcing(true);
    try {
      const res = await fetch(`/api/kpi/${item.kpiId}/value?period=${new Date().getFullYear()}`);
      if (res.ok) {
        const data = await res.json();
        setAutoValue(data.actualValue ?? 0);
      } else {
        const mockVal = item.actual ? Number(item.actual) : 0;
        setAutoValue(mockVal);
      }
    } catch {
      const mockVal = item.actual ? Number(item.actual) : 0;
      setAutoValue(mockVal);
    } finally {
      setIsCalcing(false);
    }
  };

  return (
    <div className="border-b border-border last:border-b-0">
      {/* KPI 행 */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
      >
        <span className="text-muted-foreground">
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </span>

        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
            item.category === "environment" || item.category === "carbon"
              ? "bg-green-50 text-carbon-success"
              : item.category === "social"
                ? "bg-navy-50 text-navy-400"
                : "bg-taupe-50 text-taupe-400"
          )}
        >
          <CatIcon className="h-3.5 w-3.5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              {item.kpiCode}
            </span>
            <span className="text-sm font-medium text-foreground truncate">
              {item.kpiName}
            </span>
            {/* 산출 방식 배지 */}
            <span className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-medium",
              calcType === "auto"
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}>
              {calcType === "auto" ? "자동 집계" : "수동"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{CATEGORY_LABELS[item.category]}</span>
            <span>·</span>
            <span>{item.unit}</span>
            {item.target != null && (
              <>
                <span>·</span>
                <span>목표: {item.target}</span>
              </>
            )}
            {item.actual != null && (
              <>
                <span>·</span>
                <span>실적: {item.actual}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {item.dataEntries.length}건 연결
          </span>
          <StatusBadge status={item.mappingStatus} />
        </div>
      </button>

      {/* 확장 패널 */}
      {open && (
        <div className="bg-muted/30 px-4 pb-3 space-y-3">
          {/* 산출 방식 선택 */}
          <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-3">
            <span className="text-xs font-medium text-muted-foreground shrink-0">연결 방식</span>
            <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-muted/50 p-0.5">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleCalcTypeChange("auto"); }}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  calcType === "auto" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                자동 집계
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleCalcTypeChange("manual"); }}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  calcType === "manual" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                수동 입력
              </button>
            </div>

            {/* 자동 집계: 프리셋 선택 */}
            {calcType === "auto" && (
              <div className="flex items-center gap-2 flex-1">
                <select
                  value={selectedPreset}
                  onChange={(e) => handlePresetChange(Number(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  className="h-7 rounded-md border border-input bg-transparent px-2 text-xs flex-1 max-w-[200px]"
                >
                  {AUTO_CALC_PRESETS.map((p, i) => (
                    <option key={i} value={i}>{p.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handlePreviewAutoValue(); }}
                  disabled={isCalcing}
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isCalcing ? "계산 중..." : "미리보기"}
                </button>
                {autoValue !== null && (
                  <span className="text-xs font-semibold tabular-nums text-foreground">
                    = {autoValue.toLocaleString("ko-KR")} {item.unit}
                  </span>
                )}
                {isSaving && <span className="text-[11px] text-muted-foreground">저장 중...</span>}
                {saveStatus === "saved" && <span className="text-[11px] text-carbon-success">저장됨 ✓</span>}
                {saveStatus === "error" && <span className="text-[11px] text-carbon-danger">저장 실패</span>}
              </div>
            )}
          </div>

          {/* 연결된 데이터 엔트리 */}
          {item.dataEntries.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              <XCircle className="h-4 w-4 text-carbon-danger" />
              {calcType === "auto"
                ? "배출량 관리에서 활동 데이터를 입력하면 자동으로 값이 산출됩니다."
                : "연결된 데이터 항목이 없습니다. 데이터 입력 후 매핑을 설정하세요."
              }
            </div>
          ) : (
            <div className="space-y-1.5">
              {item.dataEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5"
                >
                  <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-sm text-foreground truncate">
                    {entry.indicatorName}
                  </span>
                  <span className="text-sm font-medium tabular-nums text-foreground">
                    {entry.value.toLocaleString("ko-KR")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {entry.unit}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {entry.source}
                  </span>
                  <DataStatusDot status={entry.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── 필터 탭 ── */
type FilterTab = "all" | "linked" | "partial" | "unlinked";

/* ── 메인 페이지 ── */
type ViewMode = "mindmap" | "list";

export default function KpiMappingPage() {
  const mappings = useMemo(() => buildMappings(), []);
  const [viewMode, setViewMode] = useState<ViewMode>("mindmap");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = mappings;
    if (filter !== "all") result = result.filter((m) => m.mappingStatus === filter);
    if (categoryFilter !== "all")
      result = result.filter((m) => m.category === categoryFilter);
    if (search.trim())
      result = result.filter(
        (m) =>
          m.kpiName.toLowerCase().includes(search.toLowerCase()) ||
          m.kpiCode.toLowerCase().includes(search.toLowerCase())
      );
    return result;
  }, [mappings, filter, categoryFilter, search]);

  const counts = useMemo(
    () => ({
      all: mappings.length,
      linked: mappings.filter((m) => m.mappingStatus === "linked").length,
      partial: mappings.filter((m) => m.mappingStatus === "partial").length,
      unlinked: mappings.filter((m) => m.mappingStatus === "unlinked").length,
    }),
    [mappings]
  );

  const coveragePercent =
    mappings.length > 0
      ? Math.round((counts.linked / mappings.length) * 100)
      : 0;

  const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: "all", label: `전체 (${counts.all})` },
    { key: "linked", label: `연결 완료 (${counts.linked})` },
    { key: "partial", label: `부분 연결 (${counts.partial})` },
    { key: "unlinked", label: `미연결 (${counts.unlinked})` },
  ];

  return (
    <>
      <PageHeader
        title="KPI ↔ 데이터 매핑"
        description="KPI 항목과 데이터 입력 항목 간의 매핑 현황을 확인합니다. 누락 없이 데이터가 연결되었는지 검증합니다."
      >
        <EsgSubNav />
      </PageHeader>

      <div className="mt-8 space-y-6">
        {/* 요약 카드 — Stat Cards Clean Minimal */}
        <CollapsibleSection title="KPI 요약">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="overflow-hidden border-border/80 transition-all hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-navy-50 text-navy-500">
                  <ClipboardList className="h-4.5 w-4.5" />
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-muted-foreground">전체 KPI</p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-[28px] font-bold tracking-[-0.04em] text-foreground">{counts.all}</span>
              </div>
              <div className="mt-3 h-1 w-full rounded-full bg-muted">
                <div className="h-full rounded-full bg-navy-500" style={{ width: "100%" }} />
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-border/80 transition-all hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-green-50 text-carbon-success">
                  <BarChart3 className="h-4.5 w-4.5" />
                </div>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-50 text-carbon-success">
                  {coveragePercent}%
                </span>
              </div>
              <p className="mt-3 text-xs font-medium text-muted-foreground">매핑 커버리지</p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-[28px] font-bold tracking-[-0.04em] text-foreground">{coveragePercent}%</span>
              </div>
              <div className="mt-3 h-1 w-full rounded-full bg-muted">
                <div className="h-full rounded-full bg-carbon-success animate-bar" style={{ width: `${coveragePercent}%` }} />
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-border/80 transition-all hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-green-50 text-carbon-success">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                </div>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-50 text-carbon-success">
                  {counts.all > 0 ? Math.round((counts.linked / counts.all) * 100) : 0}%
                </span>
              </div>
              <p className="mt-3 text-xs font-medium text-muted-foreground">연결 완료</p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-[28px] font-bold tracking-[-0.04em] text-carbon-success">{counts.linked}</span>
              </div>
              <div className="mt-3 h-1 w-full rounded-full bg-muted">
                <div className="h-full rounded-full bg-carbon-success" style={{ width: `${counts.all > 0 ? (counts.linked / counts.all) * 100 : 0}%` }} />
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-border/80 transition-all hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-destructive/10 text-carbon-danger">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-destructive/10 text-carbon-danger">
                  {counts.all > 0 ? Math.round(((counts.unlinked + counts.partial) / counts.all) * 100) : 0}%
                </span>
              </div>
              <p className="mt-3 text-xs font-medium text-muted-foreground">미연결 / 부분</p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-[28px] font-bold tracking-[-0.04em] text-carbon-danger">{counts.unlinked + counts.partial}</span>
              </div>
              <div className="mt-3 h-1 w-full rounded-full bg-muted">
                <div className="h-full rounded-full bg-carbon-danger" style={{ width: `${counts.all > 0 ? ((counts.unlinked + counts.partial) / counts.all) * 100 : 0}%` }} />
              </div>
            </CardContent>
          </Card>
        </div>
        </CollapsibleSection>

        {/* 뷰 전환 토글 */}
        <div className="flex items-center justify-between">
          <div className="flex rounded-lg border border-border p-0.5">
            <button
              onClick={() => setViewMode("mindmap")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === "mindmap"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <GitBranch className="h-3.5 w-3.5" />
              마인드맵
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-3.5 w-3.5" />
              리스트
            </button>
          </div>

          {viewMode === "mindmap" && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-6 rounded-full bg-carbon-success" /> 연결 완료
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-6 rounded-full border border-dashed border-carbon-danger" /> 미연결
              </span>
            </div>
          )}
        </div>

        {/* 마인드맵 뷰 */}
        {viewMode === "mindmap" && (
          <KpiMindMap
            dataSources={MOCK_DATA_SOURCES}
            kpis={MOCK_KPI_NODES}
            links={MOCK_MIND_MAP_LINKS}
          />
        )}

        {/* 리스트 뷰 */}
        {viewMode === "list" && (
          <>
            {/* 필터 & 검색 */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex rounded-lg border border-border p-0.5">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      filter === tab.key
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-border px-2">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="h-8 border-0 bg-transparent text-xs outline-none"
                  >
                    <option value="all">전체 영역</option>
                    <option value="carbon">탄소</option>
                    <option value="environment">환경</option>
                    <option value="social">사회</option>
                    <option value="governance">거버넌스</option>
                  </select>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="KPI 검색..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 w-48 rounded-lg border border-border bg-transparent pl-8 pr-3 text-xs outline-none placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* 매핑 목록 */}
            <Card className="overflow-hidden border-border/80">
              <CardHeader className="border-b border-border px-4 py-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>KPI 항목</span>
                  <span>매핑 상태</span>
                </div>
              </CardHeader>
              <div className="divide-y-0">
                {filtered.length === 0 ? (
                  <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                    조건에 맞는 KPI가 없습니다.
                  </div>
                ) : (
                  filtered.map((item) => (
                    <MappingRow key={item.kpiId} item={item} />
                  ))
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
