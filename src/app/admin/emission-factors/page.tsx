"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAdminEmissionFactors,
  upsertAdminEmissionFactor,
  deleteAdminEmissionFactor,
} from "@/services/api/admin";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationBar } from "@/components/common/pagination-bar";

const inputClass =
  "h-8 w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1 text-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring";

interface FactorItem {
  id: number;
  factorCode: string;
  scope: number;
  categoryCode?: string;
  fuelCode?: string;
  country: string;
  year: number;
  sourceName: string;
  co2Factor?: number;
  ch4Factor?: number;
  n2oFactor?: number;
  co2FactorUnit?: string;
  ncv?: number;
  ncvUnit?: string;
  oxidationFactor?: number;
  active: boolean;
  sourcePublisher?: string;
}

export default function AdminEmissionFactorsPage() {
  const queryClient = useQueryClient();
  const [scopeFilter, setScopeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<FactorItem>>({});

  const { data: factors = [], isLoading } = useQuery<FactorItem[]>({
    queryKey: ["admin-emission-factors", scopeFilter, search],
    queryFn: () =>
      getAdminEmissionFactors({
        scope: scopeFilter ? Number(scopeFilter) : undefined,
        search: search || undefined,
      }),
  });

  const upsertMutation = useMutation({
    mutationFn: upsertAdminEmissionFactor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-emission-factors"] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminEmissionFactor,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-emission-factors"] }),
  });

  const pagination = usePagination({ totalItems: factors.length, pageSize: 20 });
  const visibleFactors = pagination.paginate(factors);

  const handleEditStart = (f: FactorItem) => {
    setEditingId(f.id);
    setEditForm({ ...f });
  };

  const handleEditSave = () => {
    if (!editingId) return;
    upsertMutation.mutate(editForm);
  };

  return (
    <>
      <PageHeader
        title="배출계수 마스터"
        description="플랫폼 전체의 배출계수 데이터를 관리합니다."
      />

      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-col space-y-2 pb-3">
            <CardTitle className="text-sm font-semibold">
              배출계수 목록{" "}
              <span className="font-normal text-muted-foreground">({factors.length})</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="검색 (코드/출처명/연료)"
                className={inputClass + " max-w-xs"}
              />
              <select
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value)}
                className={inputClass + " w-32"}
              >
                <option value="">전체 Scope</option>
                <option value="1">Scope 1</option>
                <option value="2">Scope 2</option>
                <option value="3">Scope 3</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">불러오는 중...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs" aria-label="배출계수 목록">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2 pr-2 font-medium">코드</th>
                      <th className="w-16 pb-2 pr-2 font-medium">Scope</th>
                      <th className="pb-2 pr-2 font-medium">카테고리</th>
                      <th className="pb-2 pr-2 font-medium">연료</th>
                      <th className="w-12 pb-2 pr-2 font-medium">국가</th>
                      <th className="w-12 pb-2 pr-2 font-medium">연도</th>
                      <th className="pb-2 pr-2 font-medium">출처</th>
                      <th className="pb-2 pr-2 font-medium">CO2</th>
                      <th className="pb-2 pr-2 font-medium">CH4</th>
                      <th className="pb-2 pr-2 font-medium">N2O</th>
                      <th className="w-12 pb-2 pr-2 font-medium">활성</th>
                      <th className="w-28 pb-2 font-medium">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {visibleFactors.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="py-10 text-center text-muted-foreground">
                          배출계수 데이터가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      visibleFactors.map((f) => {
                        const isEditing = editingId === f.id;
                        return (
                          <tr key={f.id} className="align-middle hover:bg-muted/50">
                            <td className="py-2 pr-2 font-mono text-[11px]">{f.factorCode}</td>
                            <td className="py-2 pr-2 text-center">{f.scope}</td>
                            <td className="py-2 pr-2">{f.categoryCode ?? "-"}</td>
                            <td className="py-2 pr-2">{f.fuelCode ?? "-"}</td>
                            <td className="py-2 pr-2 text-center">{f.country}</td>
                            <td className="py-2 pr-2 text-center">{f.year}</td>
                            <td className="py-2 pr-2 max-w-[200px] truncate" title={f.sourceName}>
                              {isEditing ? (
                                <input
                                  value={editForm.sourceName ?? ""}
                                  onChange={(e) => setEditForm((p) => ({ ...p, sourceName: e.target.value }))}
                                  className={inputClass}
                                />
                              ) : (
                                f.sourceName
                              )}
                            </td>
                            <td className="py-2 pr-2 text-right font-mono">
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="any"
                                  value={editForm.co2Factor ?? ""}
                                  onChange={(e) => setEditForm((p) => ({ ...p, co2Factor: Number(e.target.value) }))}
                                  className={inputClass + " w-20"}
                                />
                              ) : (
                                f.co2Factor?.toFixed(4) ?? "-"
                              )}
                            </td>
                            <td className="py-2 pr-2 text-right font-mono">
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="any"
                                  value={editForm.ch4Factor ?? ""}
                                  onChange={(e) => setEditForm((p) => ({ ...p, ch4Factor: Number(e.target.value) }))}
                                  className={inputClass + " w-20"}
                                />
                              ) : (
                                f.ch4Factor?.toFixed(6) ?? "-"
                              )}
                            </td>
                            <td className="py-2 pr-2 text-right font-mono">
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="any"
                                  value={editForm.n2oFactor ?? ""}
                                  onChange={(e) => setEditForm((p) => ({ ...p, n2oFactor: Number(e.target.value) }))}
                                  className={inputClass + " w-20"}
                                />
                              ) : (
                                f.n2oFactor?.toFixed(6) ?? "-"
                              )}
                            </td>
                            <td className="py-2 pr-2 text-center">
                              {f.active ? (
                                <span className="text-green-600">Y</span>
                              ) : (
                                <span className="text-red-600">N</span>
                              )}
                            </td>
                            <td className="py-2">
                              {isEditing ? (
                                <div className="flex gap-1">
                                  <button
                                    onClick={handleEditSave}
                                    className="rounded bg-primary px-2 py-1 text-[10px] text-primary-foreground"
                                  >
                                    저장
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="rounded border px-2 py-1 text-[10px]"
                                  >
                                    취소
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleEditStart(f)}
                                    className="rounded border px-2 py-1 text-[10px] hover:bg-muted"
                                  >
                                    수정
                                  </button>
                                  <button
                                    onClick={() => deleteMutation.mutate(f.id)}
                                    className="rounded border border-red-300 px-2 py-1 text-[10px] text-red-700 hover:bg-red-50"
                                  >
                                    삭제
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                <PaginationBar pagination={pagination} totalItems={factors.length} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
