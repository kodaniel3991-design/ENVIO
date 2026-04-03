"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export interface Scope3FacilityRow {
  id: string;
  facilityName: string;
  activityType: string;
  unit: string;
  dataMethod: string;
}

const ACTIVITY_TYPE_OPTIONS = [
  "구입상품·서비스", "자본재", "연료·에너지(기타)", "상류 수송·유통",
  "사업장 폐기물", "출장", "직원 통근", "상류 임차자산",
  "하류 수송·유통", "판매제품 가공", "판매제품 사용", "판매제품 폐기",
  "하류 임차자산", "프랜차이즈", "투자", "기타",
];

const UNIT_OPTIONS = [
  "ton", "kg", "MWh", "kWh", "GJ",
  "km", "person-km", "night", "m²", "만원", "억원", "기타",
];

const DATA_METHOD_OPTIONS = [
  "직접측정", "구매영수증", "청구서", "고지서", "거래명세서", "미터기", "계산값", "추정값", "기타",
];

function genId() {
  return `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export const INITIAL_SCOPE3_ROWS: Scope3FacilityRow[] = [
  { id: "f-1", facilityName: "원재료 구매", activityType: "구입상품·서비스", unit: "ton", dataMethod: "구매영수증" },
  { id: "f-2", facilityName: "생산 설비 투자", activityType: "자본재", unit: "만원", dataMethod: "청구서" },
  { id: "f-3", facilityName: "임직원 출장", activityType: "출장", unit: "person-km", dataMethod: "계산값" },
];

interface Scope3SourceInfoCardProps {
  rows: Scope3FacilityRow[];
  onRowsChange: (rows: Scope3FacilityRow[]) => void;
  selectedId: string;
  onSelect: (id: string) => void;
  onSave?: (rows: Scope3FacilityRow[]) => void;
  isSaving?: boolean;
  /** true이면 편집/저장/삭제 버튼을 숨기고 읽기 전용으로 표시 */
  readonly?: boolean;
  /** 읽기 전용 모드에서 헤더 설명 텍스트 */
  readonlyDescription?: string;
  savedFromDb?: boolean;
  worksiteName?: string;
}

export function Scope3SourceInfoCard({
  rows,
  onRowsChange,
  selectedId,
  onSelect,
  onSave,
  isSaving = false,
  readonly = false,
  readonlyDescription,
  savedFromDb = false,
  worksiteName,
}: Scope3SourceInfoCardProps) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (savedFromDb) setIsSaved(true);
  }, [savedFromDb]);

  const updateRow = (id: string, field: keyof Scope3FacilityRow, value: string) => {
    onRowsChange(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addRow = () => {
    const newRow: Scope3FacilityRow = {
      id: genId(),
      facilityName: worksiteName ? `${worksiteName}_` : "",
      activityType: "구입상품·서비스",
      unit: "ton",
      dataMethod: "청구서",
    };
    onRowsChange([...rows, newRow]);
    onSelect(newRow.id);
    setIsSaved(false);
  };

  const deleteRow = (id: string) => {
    const next = rows.filter((r) => r.id !== id);
    onRowsChange(next);
    if (selectedId === id) onSelect(next[0]?.id ?? "");
    setIsSaved(false);
  };

  return (
    <section className="flex h-full flex-col space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-foreground">배출원 정보</h2>
          <p className="text-xs text-muted-foreground">
            {readonlyDescription ?? "배출시설을 선택하면 해당 시설의 월별 데이터를 입력할 수 있습니다."}
          </p>
        </div>
        {!readonly && (
          <div className="flex items-center gap-2">
            {isSaved ? (
              <Button size="sm" variant="outline" onClick={() => setIsSaved(false)}>
                수정
              </Button>
            ) : (
              <Button
                size="sm"
                variant="default"
                onClick={() => { setIsSaved(true); onSave?.(rows); }}
                disabled={rows.length === 0 || isSaving}
              >
                {isSaving ? "저장 중..." : "저장"}
              </Button>
            )}
            {!isSaved && (
              <Button size="sm" variant="outline" onClick={addRow}>
                + 행 추가
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <th className="px-3 py-2 text-left font-medium">배출시설명</th>
              <th className="px-3 py-2 text-left font-medium">활동 유형</th>
              <th className="px-3 py-2 text-left font-medium">단위</th>
              <th className="px-3 py-2 text-left font-medium">자료 수집방법</th>
              {!isSaved && <th className="w-8 px-2 py-2" />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-xs text-muted-foreground">
                  배출시설을 추가해 주세요.
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
                    <td className="px-2 py-1.5" onClick={() => onSelect(row.id)}>
                      {(readonly || isSaved) ? (
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
                    {/* 활동 유형 */}
                    <td className="px-2 py-1.5" onClick={() => onSelect(row.id)}>
                      {(readonly || isSaved) ? (
                        <span className="block px-2 py-1.5 text-xs text-muted-foreground">{row.activityType}</span>
                      ) : (
                        <select
                          value={row.activityType}
                          onChange={(e) => updateRow(row.id, "activityType", e.target.value)}
                          className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {ACTIVITY_TYPE_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                        </select>
                      )}
                    </td>
                    {/* 단위 */}
                    <td className="px-2 py-1.5" onClick={() => onSelect(row.id)}>
                      {(readonly || isSaved) ? (
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
                    <td className="px-2 py-1.5" onClick={() => onSelect(row.id)}>
                      {(readonly || isSaved) ? (
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
                    {/* 삭제 */}
                    {!readonly && !isSaved && (
                      <td className="px-2 py-1.5 text-center" onClick={() => onSelect(row.id)}>
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
    </section>
  );
}
