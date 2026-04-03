"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, Save } from "lucide-react";

export interface FacilityRow {
  id: string;
  facilityName: string;
  fuelName: string;
  unit: string;
  dataMethod: string;
  status?: "active" | "inactive";
}

/** 연료 그룹 (NIER-2023 기준) */
export const FUEL_GROUPS: { label: string; options: { value: string; unit: string }[] }[] = [
  {
    label: "자주 사용",
    options: [
      { value: "도시가스(LNG)", unit: "Nm3" },
      { value: "LPG", unit: "kg" },
      { value: "경유", unit: "L" },
      { value: "휘발유", unit: "L" },
      { value: "등유", unit: "L" },
    ],
  },
  {
    label: "기체연료",
    options: [
      { value: "천연가스(LNG)", unit: "Nm3" },
      { value: "프로판(LPG1호)", unit: "kg" },
      { value: "부탄(LPG3호)", unit: "kg" },
    ],
  },
  {
    label: "액체연료",
    options: [
      { value: "B-A유", unit: "L" },
      { value: "B-B유", unit: "L" },
      { value: "B-C유", unit: "L" },
      { value: "나프타", unit: "L" },
      { value: "용제", unit: "L" },
      { value: "항공유", unit: "L" },
      { value: "아스팔트", unit: "kg" },
      { value: "윤활유", unit: "L" },
    ],
  },
  {
    label: "고체연료",
    options: [
      { value: "국내무연탄", unit: "kg" },
      { value: "연료용 수입무연탄", unit: "kg" },
      { value: "원료용 수입무연탄", unit: "kg" },
      { value: "연료용 유연탄(역청탄)", unit: "kg" },
      { value: "원료용 유연탄(역청탄)", unit: "kg" },
      { value: "아역청탄", unit: "kg" },
      { value: "코크스", unit: "kg" },
      { value: "석유코크스", unit: "kg" },
    ],
  },
  {
    label: "바이오연료",
    options: [
      { value: "부생연료유1호", unit: "L" },
      { value: "부생연료유2호", unit: "L" },
    ],
  },
  {
    label: "기타",
    options: [
      { value: "기타", unit: "kg" },
    ],
  },
];

/** 모든 연료 flat 목록 (하위 호환용) */
export const FUEL_OPTIONS = FUEL_GROUPS.flatMap((g) => g.options.map((o) => o.value));

/** 연료명으로 기본 단위 조회 */
export function getDefaultUnitForFuel(fuel: string): string {
  for (const g of FUEL_GROUPS) {
    const match = g.options.find((o) => o.value === fuel);
    if (match) return match.unit;
  }
  return "kg";
}

/** 연료 표시명 → DB fuel_code 매핑 (배출계수 조회용) */
export const FUEL_TO_DB_CODE: Record<string, string> = {
  "도시가스(LNG)": "LNG",
  "천연가스(LNG)": "LNG",
  "LPG": "LPG",
  "프로판(LPG1호)": "LPG",
  "부탄(LPG3호)": "LPG",
  "경유": "Diesel",
  "휘발유": "Gasoline",
  "등유": "Kerosene",
  "B-A유": "HeavyOil_A",
  "B-B유": "HeavyOil_B",
  "B-C유": "HeavyOil_C",
  "나프타": "Naphtha",
  "용제": "Solvent",
  "항공유": "JetFuel",
  "아스팔트": "Asphalt",
  "윤활유": "Lubricant",
  "국내무연탄": "Anthracite_D",
  "연료용 수입무연탄": "Anthracite_I",
  "원료용 수입무연탄": "Anthracite_IR",
  "연료용 유연탄(역청탄)": "Bituminous",
  "원료용 유연탄(역청탄)": "Bituminous_R",
  "아역청탄": "SubBituminous",
  "코크스": "Coke",
  "석유코크스": "PetCoke",
  "부생연료유1호": "ByProduct1",
  "부생연료유2호": "ByProduct2",
  // 하위 호환 (기존 코드)
  "LNG": "LNG",
  "Diesel": "Diesel",
  "Gasoline": "Gasoline",
};

export function getFuelDbCode(fuelName: string): string {
  return FUEL_TO_DB_CODE[fuelName] ?? fuelName;
}

export const UNIT_OPTIONS = ["Nm3", "L", "kg", "ton", "MJ", "kWh", "GJ", "기타"];
export const DATA_METHOD_OPTIONS = [
  "직접측정", "구매영수증", "청구서", "고지서", "거래명세서", "미터기", "계산값", "추정값", "기타",
];

function genId() {
  return `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export const INITIAL_FACILITY_ROWS_BY_CATEGORY: Record<string, FacilityRow[]> = {
  fixed: [],
  mobile: [],
  fugitive: [],
};

export const INITIAL_FACILITY_ROWS: FacilityRow[] = [];

interface SourceInfoCardProps {
  rows: FacilityRow[];
  onRowsChange: (rows: FacilityRow[]) => void;
  selectedId: string;
  onSelect: (id: string) => void;
  onSave?: (rows: FacilityRow[]) => void;
  isSaving?: boolean;
  savedFromDb?: boolean;
  categoryId?: string;
  worksiteName?: string;
}

export function SourceInfoCard({
  rows,
  onRowsChange,
  selectedId,
  onSelect,
  onSave,
  isSaving = false,
  savedFromDb = false,
  categoryId,
  worksiteName,
}: SourceInfoCardProps) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (savedFromDb) setIsSaved(true);
  }, [savedFromDb]);

  const updateRow = (id: string, field: keyof FacilityRow, value: string) => {
    if (field === "fuelName") {
      // 연료 변경 시 단위도 자동 업데이트
      const unit = getDefaultUnitForFuel(value);
      onRowsChange(rows.map((r) => (r.id === id ? { ...r, fuelName: value, unit } : r)));
    } else {
      onRowsChange(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    }
  };

  const addRow = () => {
    const isMobile = categoryId === "mobile";
    const newRow: FacilityRow = {
      id: genId(),
      facilityName: worksiteName ? `${worksiteName}_` : "",
      fuelName: isMobile ? "경유" : "도시가스(LNG)",
      unit: isMobile ? "L" : "Nm3",
      dataMethod: isMobile ? "청구서" : "청구서",
    };
    onRowsChange([...rows, newRow]);
    onSelect(newRow.id);
    setIsSaved(false);
  };

  const deleteRow = (id: string) => {
    const next = rows.filter((r) => r.id !== id);
    onRowsChange(next);
    if (selectedId === id) onSelect(next[0]?.id ?? "");
    // 삭제 즉시 DB 반영
    onSave?.(next);
  };

  return (
    <section className="flex h-full flex-col space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-foreground">배출원 정보</h2>
          <p className="text-xs text-muted-foreground">
            배출시설을 선택하면 해당 시설의 월별 데이터를 입력할 수 있습니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSaved && (
            <Button size="sm" variant="outline" onClick={() => setIsSaved(false)}>
              <Pencil className="mr-1 h-3 w-3" /> 수정
            </Button>
          )}
          <Button
            size="sm"
            variant="default"
            onClick={() => { setIsSaved(true); onSave?.(rows); }}
            disabled={rows.length === 0 || isSaving}
          >
            <Save className="mr-1 h-3 w-3" /> {isSaving ? "저장 중..." : "저장"}
          </Button>
          {!isSaved && (
            <Button size="sm" variant="outline" onClick={addRow}>
              + 행 추가
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <th className="px-3 py-2 text-left font-medium">배출시설명</th>
                <th className="px-3 py-2 text-left font-medium">연료명</th>
                <th className="px-3 py-2 text-left font-medium">단위</th>
                <th className="px-3 py-2 text-left font-medium">자료 수집방법</th>
                <th className="px-3 py-2 text-center font-medium">상태</th>
                {!isSaved && <th className="w-8 px-2 py-2" />}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-xs text-muted-foreground">
                    배출시설을 추가해 주세요. &quot;+ 행 추가&quot; 버튼으로 시설을 등록할 수 있습니다.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const isSelected = row.id === selectedId;
                  return (
                    <tr
                      key={row.id}
                      onClick={() => onSelect(row.id)}
                      className={cn(
                        "cursor-pointer border-b border-border/50 last:border-0 transition-colors",
                        isSelected ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : "hover:bg-muted/40",
                      )}
                    >
                      {/* 배출시설명 */}
                      <td className="px-2 py-1.5">
                        {isSaved ? (
                          <span className="block px-2 py-1.5 text-xs">{row.facilityName || "—"}</span>
                        ) : (
                          <input
                            type="text"
                            value={row.facilityName}
                            onChange={(e) => updateRow(row.id, "facilityName", e.target.value)}
                            placeholder="시설명 입력"
                            className={cn(
                              "h-8 w-full rounded-md border bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring",
                              isSelected ? "border-primary/40" : "border-input",
                            )}
                          />
                        )}
                      </td>
                      {/* 연료명 */}
                      <td className="px-2 py-1.5">
                        {isSaved ? (
                          <span className="block px-2 py-1.5 text-xs text-muted-foreground">{row.fuelName}</span>
                        ) : (
                          <select
                            value={row.fuelName}
                            onChange={(e) => updateRow(row.id, "fuelName", e.target.value)}
                            className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            {FUEL_GROUPS.map((g) => (
                              <optgroup key={g.label} label={g.label}>
                                {g.options.map((o) => <option key={o.value} value={o.value}>{o.value}</option>)}
                              </optgroup>
                            ))}
                          </select>
                        )}
                      </td>
                      {/* 단위 */}
                      <td className="px-2 py-1.5">
                        {isSaved ? (
                          <span className="block px-2 py-1.5 text-xs text-muted-foreground">{row.unit}</span>
                        ) : (
                          <select
                            value={row.unit}
                            onChange={(e) => updateRow(row.id, "unit", e.target.value)}
                            className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                          </select>
                        )}
                      </td>
                      {/* 자료 수집방법 */}
                      <td className="px-2 py-1.5">
                        {isSaved ? (
                          <span className="block px-2 py-1.5 text-xs text-muted-foreground">{row.dataMethod}</span>
                        ) : (
                          <select
                            value={row.dataMethod}
                            onChange={(e) => updateRow(row.id, "dataMethod", e.target.value)}
                            className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            {DATA_METHOD_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                          </select>
                        )}
                      </td>
                      {/* 상태 */}
                      <td className="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const next = (row.status ?? "active") === "active" ? "inactive" : "active";
                            onRowsChange(rows.map((r) => r.id === row.id ? { ...r, status: next } : r));
                          }}
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
                            (row.status ?? "active") === "active"
                              ? "border-green-300 bg-green-500 text-white hover:bg-green-600"
                              : "border-red-200 bg-red-100 text-red-600 hover:bg-red-200"
                          )}
                        >
                          {(row.status ?? "active") === "active" ? "활성" : "비활성"}
                        </button>
                      </td>
                      {/* 삭제 */}
                      {!isSaved && (
                        <td className="px-2 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); deleteRow(row.id); }}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
