"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Scope2Header } from "@/components/scope2/scope2-header";
import { Scope2CategorySidebar } from "@/components/scope2/category-sidebar";
import {
  Scope2SourceInfoCard,
  INITIAL_SCOPE2_ROWS,
  type Scope2FacilityRow,
} from "@/components/scope2/source-info-card";
import { Scope2SourceExamples } from "@/components/scope2/source-examples";
import { Scope2MonthlyActivityTable } from "@/components/scope2/monthly-activity-table";
import { ValidationInsightsCard } from "@/components/scope1/validation-insights-card";
import { EmissionTrendCard } from "@/components/scope1/emission-trend-card";
import { AuditLogTable } from "@/components/scope1/audit-log-table";
import { ActionFooter, type DataStatus } from "@/components/scope1/action-footer";
import { SCOPE2_CATEGORIES } from "@/lib/scope2-mock-data";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import type { Scope2CategoryId, Scope2EnergyType } from "@/types/scope2";
import { getEmissionFactorForEnergy } from "@/lib/scope2-utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PenLine, BarChart3, ShieldCheck, Plug } from "lucide-react";
import { ApiIntegrationPanel } from "@/components/integrations/api-integration-panel";
import { useFacilities, useSaveFacilities, type DbFacilityRow } from "@/hooks/use-facilities";
import { useActivity, useSaveActivity } from "@/hooks/use-activity";
import { useScopeEmissionFactors } from "@/hooks/use-emission-factors";
import type { HistoricalMonthly } from "@/components/scope1/validation-insights-card";

type InputMode = "manual" | "excel" | "api";

function dbRowsToScope2(rows: DbFacilityRow[]): Scope2FacilityRow[] {
  return rows.map((r) => ({
    id: r.id,
    facilityName: r.facility_name,
    energyType: r.energy_type ?? "Electricity",
    unit: r.unit,
    dataMethod: r.data_method,
  }));
}

function scope2ToDbRows(rows: Scope2FacilityRow[]): DbFacilityRow[] {
  return rows.map((r, i) => ({
    id: r.id,
    scope: 2,
    facility_name: r.facilityName,
    fuel_type: null,
    energy_type: r.energyType,
    activity_type: null,
    unit: r.unit,
    data_method: r.dataMethod,
    sort_order: i,
  }));
}

const CATEGORY_LABELS: Record<string, string> = {
  electricity: "전력",
  steam: "스팀·열",
};

export default function Scope2Page() {
  const queryClient = useQueryClient();
  const { getFactorByFuel: getDbFactor } = useScopeEmissionFactors(2);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => String(currentYear - i));
  const [year, setYear] = useState(String(currentYear));
  const [inputMode, setInputMode] = useState<InputMode>("manual");
  const [selectedCategoryId, setSelectedCategoryId] = useState<Scope2CategoryId>("electricity");
  const [dataStatus, setDataStatus] = useState<DataStatus>("draft");
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(
    INITIAL_SCOPE2_ROWS[0]?.id ?? "",
  );

  const { data: dbFacilities } = useFacilities(2);
  const saveFacilitiesMutation = useSaveFacilities(2, "");

  const facilities: Scope2FacilityRow[] = useMemo(
    () => (dbFacilities && dbFacilities.length > 0 ? dbRowsToScope2(dbFacilities) : INITIAL_SCOPE2_ROWS),
    [dbFacilities],
  );
  const [localFacilities, setLocalFacilities] = useState<Scope2FacilityRow[]>([]);
  const [localActivity, setLocalActivity] = useState<Record<string, number[]>>({});

  // 카테고리 전환 시 로컬 편집 초기화
  useEffect(() => {
    setLocalActivity({});
  }, [selectedCategoryId]);

  // 연도 전환 시 로컬 활동량 캐시 초기화
  useEffect(() => {
    setLocalActivity({});
  }, [year]);

  // effectiveFacilities 메모이제이션
  const effectiveFacilities = useMemo(
    () => (localFacilities.length > 0 ? localFacilities : facilities),
    [localFacilities, facilities],
  );

  // DB 시설 목록 변경 시 자동 선택
  useEffect(() => {
    setSelectedFacilityId((prev) => {
      const valid = effectiveFacilities.some((f) => f.id === prev);
      return valid ? prev : (effectiveFacilities[0]?.id ?? "");
    });
  }, [effectiveFacilities]);

  // DB에서 월별 활동량 로드
  const { data: dbActivity } = useActivity(selectedFacilityId, year);
  const { data: auditLogs = [] } = useAuditLogs(selectedFacilityId, year);

  // 시설 전환 시 활동량 쿼리 강제 갱신
  useEffect(() => {
    if (selectedFacilityId) {
      queryClient.invalidateQueries({ queryKey: ["activity", selectedFacilityId, year] });
    }
  }, [selectedFacilityId, year, queryClient]);

  // 전년도 데이터 로드 (동월 비교용)
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
    saveActivityMutation.mutate({ facilityId: selectedFacilityId, year, values: currentActivity });
  };

  const handleSaveFacilities = (rows: Scope2FacilityRow[]) => {
    saveFacilitiesMutation.mutate(scope2ToDbRows(rows));
    setLocalFacilities(rows);
  };

  // 배출량 계산 — DB 배출계수 우선, 없으면 하드코딩 fallback
  const energyType = (selectedFacility?.energyType === "Electricity" ? "Electricity" : "Steam") as Scope2EnergyType;
  const dbFactor = getDbFactor(energyType);
  const factor = dbFactor?.combined ?? getEmissionFactorForEnergy(energyType);
  const monthlyTotals = useMemo(
    () => currentActivity.map((v) => (Number.isNaN(v) ? 0 : v) * factor),
    [currentActivity, factor],
  );

  const totalEmission = useMemo(() => monthlyTotals.reduce((s, v) => s + v, 0), [monthlyTotals]);
  const hasErrors = currentActivity.some((v) => v < 0);

  const historicalMonthly = useMemo<HistoricalMonthly[]>(() => {
    const entries: HistoricalMonthly[] = [
      { year: prevYear1, values: prevYear1Activity ?? Array(12).fill(0) },
      { year: prevYear2, values: prevYear2Activity ?? Array(12).fill(0) },
    ];
    return entries.filter((h) => h.values.some((v) => v > 0));
  }, [prevYear1, prevYear2, prevYear1Activity, prevYear2Activity]);

  // 검증 요청
  const handleRequestValidation = async () => {
    await fetch("/api/validations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save-validation",
        item: {
          id: crypto.randomUUID(),
          scope: "Scope 2",
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

  // 저장
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
      <Scope2Header year={year} />

      <div className="grid gap-6 lg:grid-cols-[160px,1fr]">
        <Scope2CategorySidebar
          categories={SCOPE2_CATEGORIES}
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
            <div className="grid gap-3 md:grid-cols-2 items-stretch">
              <Scope2SourceInfoCard
                rows={effectiveFacilities}
                onRowsChange={setLocalFacilities}
                selectedId={selectedFacilityId}
                onSelect={setSelectedFacilityId}
                onSave={handleSaveFacilities}
                isSaving={saveFacilitiesMutation.isPending}
                savedFromDb={!!dbFacilities && dbFacilities.length > 0}
              />
              <Scope2SourceExamples activeCategoryId={selectedCategoryId} />
            </div>

            <Scope2MonthlyActivityTable
              key={`${selectedFacilityId}-${year}`}
              energyType={energyType}
              unitLabel={selectedFacility?.unit ?? "MWh"}
              facilityName={selectedFacility?.facilityName || "배출시설 미선택"}
              facilityId={selectedFacilityId}
              factorSourceOverride={dbFactor?.source}
              gasFactorsOverride={dbFactor ? { co2: dbFactor.co2, ch4: dbFactor.ch4, n2o: dbFactor.n2o } : undefined}
              year={year}
              activityByMonth={currentActivity}
              onChangeActivity={handleActivityChange}
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
                          inputMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                        }`}
                        onClick={() => setInputMode(mode)}
                      >
                        {mode === "manual" ? "직접 입력" : mode === "excel" ? "Excel 업로드" : "API 연동"}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="cursor-pointer border-border/70 bg-background text-[11px] text-muted-foreground hover:bg-muted">
                      Excel 템플릿 다운로드
                    </Badge>
                    <Badge variant="secondary" className="cursor-pointer text-[11px]">
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
              scope={2}
              facilities={effectiveFacilities.map((f) => ({ id: f.id, name: f.facilityName, fuel: f.energyType, unit: f.unit }))}
              selectedFacilityId={selectedFacilityId}
              onSelectFacility={setSelectedFacilityId}
              year={year}
            />
          </TabsContent>

          {/* ═══ Tab 3: 분석 & 비교 ═══ */}
          <TabsContent value="analysis">
            <EmissionTrendCard monthlyTotals={monthlyTotals} label="Scope 2" />
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
