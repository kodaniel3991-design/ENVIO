"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { WorksiteItem } from "@/types";

export interface U7FacilityRow {
  id: string;
  worksiteName: string;    // 사업장명
  commuteTransport: string; // 출퇴근 교통수단 (car / public / ev / walk_bike)
  fuel: string;            // 연료 (휘발유 / 경유 / LPG / "")
}

const TRANSPORT_OPTIONS = [
  { value: "car",       label: "자가용" },
  { value: "public",    label: "대중교통" },
  { value: "ev",        label: "전기·수소차" },
  { value: "walk_bike", label: "도보·자전거" },
];

const FUEL_OPTIONS = ["휘발유", "경유", "LPG"];

export function getTransportLabel(transport: string): string {
  return TRANSPORT_OPTIONS.find((o) => o.value === transport)?.label ?? transport;
}

function genId() {
  return `u7-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

interface U7SourceInfoCardProps {
  rows: U7FacilityRow[];
  onRowsChange: (rows: U7FacilityRow[]) => void;
  selectedId: string;
  onSelect: (id: string) => void;
  onSave?: (rows: U7FacilityRow[]) => void;
  isSaving?: boolean;
  worksites?: WorksiteItem[];
}

export function U7SourceInfoCard({
  rows,
  onRowsChange,
  selectedId,
  onSelect,
  onSave,
  isSaving = false,
  worksites = [],
}: U7SourceInfoCardProps) {
  const [isSaved, setIsSaved] = useState(false);

  const updateRow = (id: string, field: keyof U7FacilityRow, value: string) => {
    onRowsChange(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addRow = () => {
    const newRow: U7FacilityRow = {
      id: genId(),
      worksiteName: "",
      commuteTransport: "car",
      fuel: "휘발유",
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
            직원명부의 사업장·교통수단·연료 조합이 자동으로 반영됩니다.
          </p>
        </div>
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
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <th className="px-3 py-2 text-left font-medium">사업장명</th>
              <th className="px-3 py-2 text-left font-medium">출퇴근 교통수단</th>
              <th className="px-3 py-2 text-left font-medium">연료</th>
              {!isSaved && <th className="w-8 px-2 py-2" />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-xs text-muted-foreground">
                  직원명부에서 교통수단·연료 정보를 등록하면 자동으로 반영됩니다.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isSelected = row.id === selectedId;
                const fuelEnabled = !["public", "ev", "walk_bike"].includes(row.commuteTransport);
                return (
                  <tr
                    key={row.id}
                    onClick={() => onSelect(row.id)}
                    className={cn(
                      "cursor-pointer border-b border-border/50 last:border-0 transition-colors",
                      isSelected
                        ? "bg-primary/5 ring-1 ring-inset ring-primary/20"
                        : "hover:bg-muted/40",
                    )}
                  >
                    {/* 사업장명 */}
                    <td className="px-2 py-1.5">
                      {isSaved ? (
                        <span className="block px-2 py-1.5 text-xs">{row.worksiteName || "—"}</span>
                      ) : worksites.length > 0 ? (
                        <select
                          value={row.worksiteName}
                          onChange={(e) => updateRow(row.id, "worksiteName", e.target.value)}
                          className={cn(
                            "h-8 w-full rounded-md border bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring",
                            isSelected ? "border-primary/40" : "border-input",
                          )}
                        >
                          <option value="">사업장 선택</option>
                          {worksites.map((w) => (
                            <option key={w.id} value={w.name}>{w.name}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={row.worksiteName}
                          onChange={(e) => updateRow(row.id, "worksiteName", e.target.value)}
                          placeholder="사업장명 입력"
                          className={cn(
                            "h-8 w-full rounded-md border bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring",
                            isSelected ? "border-primary/40" : "border-input",
                          )}
                        />
                      )}
                    </td>
                    {/* 출퇴근 교통수단 */}
                    <td className="px-2 py-1.5">
                      {isSaved ? (
                        <span className="block px-2 py-1.5 text-xs text-muted-foreground">
                          {getTransportLabel(row.commuteTransport)}
                        </span>
                      ) : (
                        <select
                          value={row.commuteTransport}
                          onChange={(e) => {
                            const t = e.target.value;
                            updateRow(row.id, "commuteTransport", t);
                            if (t !== "car") updateRow(row.id, "fuel", "");
                          }}
                          className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {TRANSPORT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    {/* 연료 */}
                    <td className="px-2 py-1.5">
                      {isSaved ? (
                        <span className="block px-2 py-1.5 text-xs text-muted-foreground">
                          {row.fuel || "—"}
                        </span>
                      ) : (
                        <select
                          value={row.fuel}
                          onChange={(e) => updateRow(row.id, "fuel", e.target.value)}
                          disabled={!fuelEnabled}
                          className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-40"
                        >
                          <option value="">—</option>
                          {FUEL_OPTIONS.map((f) => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      )}
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
    </section>
  );
}
