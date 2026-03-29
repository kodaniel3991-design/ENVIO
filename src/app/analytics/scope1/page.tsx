"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { ScopeHeader } from "@/components/scope1/scope-header";
import { CategorySidebar } from "@/components/scope1/category-sidebar";
import {
  SourceInfoCard,
  INITIAL_FACILITY_ROWS_BY_CATEGORY,
  type FacilityRow,
} from "@/components/scope1/source-info-card";
import { SourceReference } from "@/components/scope1/source-reference";
import { MonthlyActivityTable } from "@/components/scope1/monthly-activity-table";
import { ValidationInsightsCard } from "@/components/scope1/validation-insights-card";
import { AuditLogTable } from "@/components/scope1/audit-log-table";
import { ActionFooter, type DataStatus } from "@/components/scope1/action-footer";
import { ApiIntegrationPanel } from "@/components/integrations/api-integration-panel";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const FacilityComparisonDashboard = dynamic(
  () => import("@/components/scope1/facility-comparison-dashboard").then((m) => ({ default: m.FacilityComparisonDashboard })),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full rounded-xl" /> }
);
import {
  SCOPE1_CATEGORIES,
} from "@/lib/scope1-mock-data";
import type { Scope1FuelType, ScopeCategoryId } from "@/types/scope1";
import { calculateMonthlyEmissions } from "@/lib/scope1-utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PenLine, BarChart3, ShieldCheck, Plug } from "lucide-react";
import { useFacilities, useSaveFacilities, type DbFacilityRow } from "@/hooks/use-facilities";
import { useActivity, useSaveActivity } from "@/hooks/use-activity";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import { useScopeEmissionFactors } from "@/hooks/use-emission-factors";
import { useScope1Comparison } from "@/hooks/use-scope1-comparison";
import type { HistoricalMonthly } from "@/components/scope1/validation-insights-card";

type InputMode = "manual" | "excel" | "api";

const VALID_FUELS: Scope1FuelType[] = ["LNG", "Diesel", "Gasoline"];
function toFuelType(name: string): Scope1FuelType {
  return (VALID_FUELS.includes(name as Scope1FuelType) ? name : "LNG") as Scope1FuelType;
}

function dbRowsToFacility(rows: DbFacilityRow[]): FacilityRow[] {
  return rows.map((r) => ({
    id: r.id,
    facilityName: r.facility_name,
    fuelName: r.fuel_type ?? "LNG",
    unit: r.unit,
    dataMethod: r.data_method,
  }));
}

function facilityToDbRows(rows: FacilityRow[], scope = 1, categoryId = "fixed"): DbFacilityRow[] {
  return rows.map((r, i) => ({
    id: r.id,
    scope,
    category_id: categoryId,
    facility_name: r.facilityName,
    fuel_type: r.fuelName,
    energy_type: null,
    activity_type: null,
    unit: r.unit,
    data_method: r.dataMethod,
    sort_order: i,
  }));
}

const MONTH_LABELS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const CATEGORY_LABELS: Record<string, string> = {
  fixed: "고정연소", mobile: "이동연소", fugitive: "비가스배출",
};

export default function Scope1Page() {
  const queryClient = useQueryClient();
  const { getFactorByFuel: getDbFactor } = useScopeEmissionFactors(1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => String(currentYear - i));
  const [year, setYear] = useState(String(currentYear));
  const [inputMode, setInputMode] = useState<InputMode>("manual");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<ScopeCategoryId>("fixed");
  const [dataStatus, setDataStatus] = useState<DataStatus>("draft");
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(
    INITIAL_FACILITY_ROWS_BY_CATEGORY["fixed"]?.[0]?.id ?? "",
  );

  // DB에서 시설 목록 로드 (실패 시 초기값 사용)
  const { data: dbFacilities } = useFacilities(1, selectedCategoryId);
  const saveFacilitiesMutation = useSaveFacilities(1, selectedCategoryId);

  const facilities: FacilityRow[] = useMemo(
    () =>
      dbFacilities && dbFacilities.length > 0
        ? dbRowsToFacility(dbFacilities)
        : (INITIAL_FACILITY_ROWS_BY_CATEGORY[selectedCategoryId] ?? []),
    [dbFacilities, selectedCategoryId],
  );
  const [localFacilities, setLocalFacilities] = useState<FacilityRow[]>([]);
  const [localActivity, setLocalActivity] = useState<Record<string, number[]>>({});

  // 카테고리 전환 시 선택 시설·로컬 편집 초기화
  useEffect(() => {
    setSelectedFacilityId("");
    setLocalFacilities([]);
    setLocalActivity({});
  }, [selectedCategoryId]);

  // 연도 전환 시 로컬 활동량 캐시 초기화 (DB 데이터로 대체)
  useEffect(() => {
    setLocalActivity({});
  }, [year]);

  // effectiveFacilities를 메모이제이션 — 매 렌더마다 새 참조 생성 방지
  const effectiveFacilities = useMemo(
    () => (localFacilities.length > 0 ? localFacilities : facilities),
    [localFacilities, facilities],
  );

  // DB 시설 목록이 바뀌었을 때, 현재 선택된 ID가 목록에 없으면 첫 번째로 자동 선택
  useEffect(() => {
    setSelectedFacilityId((prev) => {
      const valid = effectiveFacilities.some((f) => f.id === prev);
      return valid ? prev : (effectiveFacilities[0]?.id ?? "");
    });
  }, [effectiveFacilities]);

  // DB에서 월별 활동량 로드
  const { data: dbActivity } = useActivity(selectedFacilityId, year);
  const { data: auditLogs = [] } = useAuditLogs(selectedFacilityId, year);

  // 시설 전환 시 해당 시설의 활동량 쿼리 강제 갱신 (캐시 무효화)
  useEffect(() => {
    if (selectedFacilityId) {
      queryClient.invalidateQueries({ queryKey: ["activity", selectedFacilityId, year] });
    }
  }, [selectedFacilityId, year, queryClient]);
  const prevYear1 = String(parseInt(year) - 1);
  const prevYear2 = String(parseInt(year) - 2);
  const { data: prevYear1Activity } = useActivity(selectedFacilityId, prevYear1);
  const { data: prevYear2Activity } = useActivity(selectedFacilityId, prevYear2);
  const saveActivityMutation = useSaveActivity();

  const currentActivity = useMemo(() => {
    if (localActivity[selectedFacilityId]) return localActivity[selectedFacilityId];
    if (dbActivity) return dbActivity;
    return Array(12).fill(0);
  }, [localActivity, selectedFacilityId, dbActivity]);

  const selectedFacility = useMemo(
    () => effectiveFacilities.find((f) => f.id === selectedFacilityId),
    [effectiveFacilities, selectedFacilityId],
  );

  const handleActivityChange = (values: number[]) => {
    setLocalActivity((prev) => ({ ...prev, [selectedFacilityId]: values }));
  };

  const handleSaveActivity = () => {
    if (!selectedFacilityId) return;
    saveActivityMutation.mutate({
      facilityId: selectedFacilityId,
      year,
      values: currentActivity,
    });
  };

  const handleSaveFacilities = (rows: FacilityRow[]) => {
    saveFacilitiesMutation.mutate(facilityToDbRows(rows, 1, selectedCategoryId));
    setLocalFacilities(rows);
  };

  // ── Excel 템플릿 다운로드 (전체 시설 DB 값 포함) ──────────────
  const handleDownloadTemplate = async () => {
    const categoryLabel = CATEGORY_LABELS[selectedCategoryId] ?? selectedCategoryId;
    const header = ["연도", "카테고리", "시설명", "연료", "단위", ...MONTH_LABELS];

    // 전체 시설의 활동량을 DB에서 가져옴
    const allActivity = await Promise.all(
      effectiveFacilities.map(async (f) => {
        if (localActivity[f.id]) return localActivity[f.id];
        try {
          const res = await fetch(`/api/activity?facilityId=${f.id}&year=${year}`);
          if (res.ok) return ((await res.json()) as { values: number[] }).values;
        } catch {}
        return Array(12).fill(0);
      })
    );

    const noteRow = ["※ 활동량(숫자)만 수정하세요. 연도·시설명·연료·단위는 변경하지 마세요."];
    const dataRows = effectiveFacilities.map((f, i) => [
      year, categoryLabel, f.facilityName, f.fuelName, f.unit, ...allActivity[i],
    ]);

    const ws = XLSX.utils.aoa_to_sheet([noteRow, header, ...dataRows]);
    ws["!cols"] = [
      { wch: 6 }, { wch: 10 }, { wch: 16 }, { wch: 10 }, { wch: 6 },
      ...Array(12).fill({ wch: 8 }),
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "월별활동량");
    XLSX.writeFile(wb, `Scope1_${categoryLabel}_월별활동량_${year}.xlsx`);
  };

  // ── Excel 업로드 파싱 → 전체 시설 즉시 DB 저장 ──────────────
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as (string | number)[][];

        const headerRowIdx = rows.findIndex(
          (r) => String(r[0]).trim() === "연도" || String(r[1]).trim() === "카테고리",
        );
        if (headerRowIdx === -1) {
          alert("올바른 템플릿 형식이 아닙니다.\n헤더 행(연도, 카테고리, 시설명 …)을 찾을 수 없습니다.");
          return;
        }

        const header = rows[headerRowIdx].map((h) => String(h).trim());
        const nameIdx = header.indexOf("시설명");
        const fuelIdx = header.indexOf("연료");
        const monthStartIdx = header.indexOf("1월");

        if (nameIdx === -1 || monthStartIdx === -1) {
          alert("시설명 또는 월별 컬럼을 찾을 수 없습니다.");
          return;
        }

        const matched: { facilityId: string; values: number[] }[] = [];

        for (const row of rows.slice(headerRowIdx + 1)) {
          if (!row[nameIdx]) continue;
          const facilityName = String(row[nameIdx]).trim();
          const fuelName = fuelIdx !== -1 ? String(row[fuelIdx] ?? "").trim() : "";

          // 시설명 + 연료 조합으로 우선 매칭, 없으면 시설명만으로 매칭
          const facility =
            fuelName
              ? (effectiveFacilities.find(
                  (f) => f.facilityName === facilityName && f.fuelName === fuelName,
                ) ?? effectiveFacilities.find((f) => f.facilityName === facilityName))
              : effectiveFacilities.find((f) => f.facilityName === facilityName);
          if (!facility) continue;

          const values = Array.from({ length: 12 }, (_, i) => {
            const v = row[monthStartIdx + i];
            const n = typeof v === "number" ? v : parseFloat(String(v ?? "0"));
            return Number.isNaN(n) ? 0 : Math.round(n * 1000) / 1000;
          });
          matched.push({ facilityId: facility.id, values });
        }

        if (matched.length === 0) {
          alert("일치하는 시설명을 찾지 못했습니다.\n템플릿의 시설명이 현재 등록된 시설과 일치해야 합니다.");
          return;
        }

        // 1. 로컬 상태 즉시 반영 (UI 즉시 표시)
        const newActivity: Record<string, number[]> = { ...localActivity };
        matched.forEach(({ facilityId, values }) => { newActivity[facilityId] = values; });
        setLocalActivity(newActivity);
        if (!selectedFacilityId && effectiveFacilities[0]) {
          setSelectedFacilityId(effectiveFacilities[0].id);
        }

        // 2. 전체 시설 DB 일괄 저장
        const results = await Promise.allSettled(
          matched.map(({ facilityId, values }) =>
            fetch("/api/activity", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ facilityId, year: parseInt(year), values }),
            })
          )
        );

        // 3. 저장된 시설 캐시 무효화
        matched.forEach(({ facilityId }) => {
          queryClient.invalidateQueries({ queryKey: ["activity", facilityId, year] });
        });

        const savedCount = results.filter((r) => r.status === "fulfilled").length;
        const failCount = results.length - savedCount;
        if (failCount > 0) {
          alert(`${savedCount}개 저장 완료, ${failCount}개 저장 실패.\n네트워크 오류를 확인하세요.`);
        } else {
          alert(`${savedCount}개 시설의 활동량이 저장됐습니다.`);
        }
      } catch {
        alert("파일을 읽는 중 오류가 발생했습니다.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  // DB 배출계수 우선, 없으면 하드코딩 fallback
  const fuelType = toFuelType(selectedFacility?.fuelName ?? "LNG");
  const dbFactor = getDbFactor(fuelType);

  const monthlyTotals = useMemo(() => {
    if (dbFactor) {
      return currentActivity.map((v) => (Number.isNaN(v) ? 0 : v) * dbFactor.combined);
    }
    return calculateMonthlyEmissions(currentActivity, fuelType).map((r) => r.emission);
  }, [currentActivity, fuelType, dbFactor]);

  const totalEmission = useMemo(() => monthlyTotals.reduce((s, v) => s + v, 0), [monthlyTotals]);
  const hasErrors = currentActivity.some((v) => v < 0);

  // 통합 비교 분석용 데이터
  const getFactorCombined = (fuel: string): number => {
    const f = getDbFactor(fuel as Scope1FuelType);
    if (f) return f.combined;
    // fallback: scope1-utils 하드코딩 계수
    const FALLBACK: Record<string, number> = { LNG: 2.23, Diesel: 2.71, Gasoline: 2.31 };
    return FALLBACK[fuel] ?? 2.23;
  };
  const { facilityEmissions, categoryEmissions, yearComparisons } = useScope1Comparison(
    year, selectedCategoryId, getFactorCombined,
  );

  const historicalMonthly = useMemo<HistoricalMonthly[]>(() => {
    const entries: HistoricalMonthly[] = [
      { year: prevYear1, values: prevYear1Activity ?? Array(12).fill(0) },
      { year: prevYear2, values: prevYear2Activity ?? Array(12).fill(0) },
    ];
    // 해당 연도에 실제 데이터가 하나라도 있는 경우만 포함
    return entries.filter((h) => h.values.some((v) => v > 0));
  }, [prevYear1, prevYear2, prevYear1Activity, prevYear2Activity]);

  // 검증 요청: DataValidation 레코드 생성 후 상태 전환
  const handleRequestValidation = async () => {
    await fetch("/api/validations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save-validation",
        item: {
          id: crypto.randomUUID(),
          scope: "Scope 1",
          category: CATEGORY_LABELS[selectedCategoryId] ?? selectedCategoryId,
          emissionSource: selectedFacility?.facilityName ?? "미선택",
          site: selectedFacility?.facilityName ?? "미선택",
          period: year,
          activityAmount: String(currentActivity.reduce((s, v) => s + v, 0).toFixed(3)),
          emissions: String(totalEmission.toFixed(4)),
          status: "submitted",
        },
      }),
    });
    setDataStatus("reviewing");
  };

  // 저장: 활동량 DB 저장
  const handleSaveFromFooter = async () => {
    if (!selectedFacilityId) return;
    await new Promise<void>((resolve, reject) => {
      saveActivityMutation.mutate(
        { facilityId: selectedFacilityId, year, values: currentActivity },
        { onSuccess: () => resolve(), onError: () => reject() },
      );
    });
  };

  return (
    <div className="space-y-4">
      <ScopeHeader year={year} />

      <div className="grid gap-6 lg:grid-cols-[160px,1fr]">
        <CategorySidebar
          categories={SCOPE1_CATEGORIES}
          selectedId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
        />

        <Tabs defaultValue="input" className="space-y-5">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="input" className="gap-1.5 text-xs">
              <PenLine className="h-3.5 w-3.5" />
              데이터 입력
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-1.5 text-xs">
              <Plug className="h-3.5 w-3.5" />
              API 연동
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-1.5 text-xs">
              <BarChart3 className="h-3.5 w-3.5" />
              분석 &amp; 비교
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-1.5 text-xs">
              <ShieldCheck className="h-3.5 w-3.5" />
              검증 &amp; 이력
            </TabsTrigger>
          </TabsList>

          {/* ═══ Tab 1: 데이터 입력 ═══ */}
          <TabsContent value="input" className="space-y-6">
            <div className="grid gap-3 lg:grid-cols-[1fr,440px] items-start">
              <SourceInfoCard
                rows={effectiveFacilities}
                onRowsChange={setLocalFacilities}
                savedFromDb={!!dbFacilities && dbFacilities.length > 0}
                selectedId={selectedFacilityId}
                onSelect={setSelectedFacilityId}
                onSave={handleSaveFacilities}
                isSaving={saveFacilitiesMutation.isPending}
                getEmissionFactor={(fuel) => getDbFactor(fuel as any)?.combined}
              />
              <SourceReference activeCategoryId={selectedCategoryId} />
            </div>

            <MonthlyActivityTable
              key={`${selectedFacilityId}-${year}`}
              activityByMonth={currentActivity}
              onChangeActivity={handleActivityChange}
              fuel={fuelType}
              unitLabel={selectedFacility?.unit ?? "Nm3"}
              facilityName={selectedFacility?.facilityName || "배출시설 미선택"}
              facilityId={selectedFacilityId}
              year={year}
              factorSourceOverride={dbFactor?.source}
              gasFactorsOverride={dbFactor ? { co2: dbFactor.co2, ch4: dbFactor.ch4, n2o: dbFactor.n2o, gwpCh4: dbFactor.gwpCh4, gwpN2o: dbFactor.gwpN2o } : undefined}
              metaRight={
                <div className="flex items-center gap-3 text-xs whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">연도</span>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="h-8 w-[110px] rounded-md border border-input bg-transparent px-3 py-1 text-xs"
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              }
              headerRight={
                <div className="flex items-center gap-3 text-xs whitespace-nowrap">
                  <div className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-1.5 py-0.5">
                    {(["manual", "excel", "api"] as InputMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          inputMode === mode
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                        onClick={() => setInputMode(mode)}
                      >
                        {mode === "manual" ? "직접 입력" : mode === "excel" ? "Excel 업로드" : "API 연동"}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={handleExcelUpload}
                    />
                    <Badge
                      variant="outline"
                      className="cursor-pointer border-border/70 bg-background text-[11px] text-muted-foreground hover:bg-muted"
                      onClick={handleDownloadTemplate}
                    >
                      Excel 템플릿 다운로드
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer text-[11px]"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Excel 업로드
                    </Badge>
                    <button
                      type="button"
                      onClick={handleSaveActivity}
                      disabled={saveActivityMutation.isPending}
                      className="inline-flex items-center rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {saveActivityMutation.isPending ? "저장 중..." : "활동량 저장"}
                    </button>
                  </div>
                </div>
              }
            />

            <ActionFooter
              year={year}
              status={dataStatus}
              hasErrors={hasErrors}
              onRequestValidation={handleRequestValidation}
              onSave={handleSaveFromFooter}
            />
          </TabsContent>

          {/* ═══ Tab 2: API 연동 ═══ */}
          <TabsContent value="api">
            <ApiIntegrationPanel
              scope={1}
              facilities={effectiveFacilities.map((f) => ({ id: f.id, name: f.facilityName, fuel: f.fuelName, unit: f.unit }))}
              selectedFacilityId={selectedFacilityId}
              onSelectFacility={setSelectedFacilityId}
              year={year}
            />
          </TabsContent>

          {/* ═══ Tab 3: 분석 & 비교 ═══ */}
          <TabsContent value="analysis">
            <FacilityComparisonDashboard
              facilities={facilityEmissions}
              categories={categoryEmissions}
              yearComparisons={yearComparisons}
              currentYear={year}
              currentCategoryId={selectedCategoryId}
            />
          </TabsContent>

          {/* ═══ Tab 3: 검증 & 이력 ═══ */}
          <TabsContent value="audit" className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2 items-stretch">
              <ValidationInsightsCard activityByMonth={currentActivity} year={year} historicalMonthly={historicalMonthly} />
              <div className="h-full">
                <AuditLogTable items={auditLogs} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
