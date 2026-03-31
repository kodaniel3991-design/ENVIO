"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCommonCodes,
  upsertCommonCode,
  deleteCommonCode,
  type CommonCodeItem,
} from "@/services/api/admin";
import { CardActionBar } from "@/components/ui/card-action-bar";

const inputClass =
  "h-8 w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1 text-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring";

const CODE_GROUPS = [
  { value: "", label: "전체" },
  { value: "unit", label: "단위" },
  { value: "fuel_type", label: "연료 종류" },
  { value: "energy_type", label: "에너지 유형" },
  { value: "activity_type", label: "활동 유형" },
  { value: "industry", label: "산업 분류" },
];

const emptyForm = { codeGroup: "unit", code: "", name: "", description: "", sortOrder: 0 };

export default function AdminCommonCodesPage() {
  const queryClient = useQueryClient();
  const [groupFilter, setGroupFilter] = useState("");
  const [showAddRow, setShowAddRow] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<CommonCodeItem>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: codes = [], isLoading } = useQuery<CommonCodeItem[]>({
    queryKey: ["admin-common-codes", groupFilter],
    queryFn: () => getCommonCodes(groupFilter || undefined),
  });

  const upsertMutation = useMutation({
    mutationFn: upsertCommonCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-common-codes"] });
      setShowAddRow(false);
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCommonCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-common-codes"] });
      setSelectedId(null);
    },
  });

  const handleAdd = () => {
    if (!addForm.code || !addForm.name) return;
    upsertMutation.mutate(addForm as any);
    setAddForm(emptyForm);
  };

  const handleEditStart = () => {
    const c = codes.find((x) => x.id === selectedId);
    if (!c) return;
    setEditForm({ ...c });
    setEditingId(c.id);
  };

  const handleEditSave = () => {
    if (!editingId) return;
    upsertMutation.mutate(editForm as any);
  };

  return (
    <>
      <PageHeader
        title="공통 코드 관리"
        description="단위, 연료 종류, 에너지 유형 등의 공통 코드를 관리합니다."
      />

      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-col space-y-2 pb-3">
            <CardTitle className="text-sm font-semibold">
              공통 코드 목록{" "}
              <span className="font-normal text-muted-foreground">({codes.length})</span>
            </CardTitle>
            <div className="flex items-center justify-between gap-2">
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className={inputClass + " w-40"}
              >
                {CODE_GROUPS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
              <CardActionBar
                isEditing={!!editingId}
                hasSelection={!!selectedId}
                onEdit={handleEditStart}
                onCancel={() => { setEditingId(null); setEditForm({}); }}
                onDelete={() => selectedId && deleteMutation.mutate(selectedId)}
                onSave={handleEditSave}
                adds={[{
                  label: "추가",
                  onClick: () => { setShowAddRow(true); setAddForm(emptyForm); },
                }]}
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">불러오는 중...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs" aria-label="공통 코드 목록">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="w-28 pb-2 pr-2 font-medium">그룹</th>
                      <th className="w-28 pb-2 pr-2 font-medium">코드</th>
                      <th className="pb-2 pr-2 font-medium">이름</th>
                      <th className="pb-2 pr-2 font-medium">설명</th>
                      <th className="w-16 pb-2 pr-2 font-medium">순서</th>
                      <th className="w-16 pb-2 pr-2 font-medium">활성</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {showAddRow && (
                      <tr className="bg-muted/30">
                        <td className="py-1.5 pr-2">
                          <select
                            value={addForm.codeGroup}
                            onChange={(e) => setAddForm((p) => ({ ...p, codeGroup: e.target.value }))}
                            className={inputClass}
                          >
                            {CODE_GROUPS.filter((g) => g.value).map((g) => (
                              <option key={g.value} value={g.value}>{g.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-1.5 pr-2">
                          <input
                            autoFocus
                            value={addForm.code}
                            onChange={(e) => setAddForm((p) => ({ ...p, code: e.target.value }))}
                            placeholder="코드"
                            className={inputClass}
                          />
                        </td>
                        <td className="py-1.5 pr-2">
                          <input
                            value={addForm.name}
                            onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="이름"
                            className={inputClass}
                          />
                        </td>
                        <td className="py-1.5 pr-2">
                          <input
                            value={addForm.description}
                            onChange={(e) => setAddForm((p) => ({ ...p, description: e.target.value }))}
                            placeholder="설명"
                            className={inputClass}
                          />
                        </td>
                        <td className="py-1.5 pr-2">
                          <input
                            type="number"
                            value={addForm.sortOrder}
                            onChange={(e) => setAddForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
                            className={inputClass}
                          />
                        </td>
                        <td className="py-1.5 pr-2">
                          <div className="flex gap-1">
                            <button
                              onClick={handleAdd}
                              disabled={!addForm.code || !addForm.name}
                              className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-50"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => setShowAddRow(false)}
                              className="rounded border px-2 py-1 text-xs"
                            >
                              취소
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {codes.length === 0 && !showAddRow ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-muted-foreground">
                          등록된 공통 코드가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      codes.map((c) => {
                        const isEditing = editingId === c.id;
                        const isSelected = selectedId === c.id;
                        return (
                          <tr
                            key={c.id}
                            className={`cursor-pointer align-middle transition-colors ${isSelected ? "bg-accent" : "hover:bg-muted/50"}`}
                            onClick={() => { if (!isEditing) setSelectedId(c.id); }}
                          >
                            <td className="py-2 pr-2 text-muted-foreground">
                              {CODE_GROUPS.find((g) => g.value === c.codeGroup)?.label ?? c.codeGroup}
                            </td>
                            <td className="py-2 pr-2 font-mono">
                              {isEditing ? (
                                <input
                                  value={editForm.code ?? ""}
                                  onChange={(e) => setEditForm((p) => ({ ...p, code: e.target.value }))}
                                  className={inputClass}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                c.code
                              )}
                            </td>
                            <td className="py-2 pr-2">
                              {isEditing ? (
                                <input
                                  value={editForm.name ?? ""}
                                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                                  className={inputClass}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                c.name
                              )}
                            </td>
                            <td className="py-2 pr-2 text-muted-foreground">
                              {isEditing ? (
                                <input
                                  value={editForm.description ?? ""}
                                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                                  className={inputClass}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                c.description ?? "-"
                              )}
                            </td>
                            <td className="py-2 pr-2 text-center">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editForm.sortOrder ?? 0}
                                  onChange={(e) => setEditForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
                                  className={inputClass + " w-14"}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                c.sortOrder
                              )}
                            </td>
                            <td className="py-2 pr-2 text-center">
                              {c.active ? (
                                <span className="text-green-600">Y</span>
                              ) : (
                                <span className="text-red-600">N</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
