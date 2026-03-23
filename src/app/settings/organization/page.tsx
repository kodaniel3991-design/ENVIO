"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { OrganizationSettings, WorksiteItem } from "@/types";
import {
  createWorksiteDraft,
  getOrganizationSettings,
  saveOrganizationSettings,
} from "@/services/api";
import { Plus, Save, Trash2, Star, Pencil, X } from "lucide-react";

const inputClass =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring";

function trimOptional(s: string | undefined): string | undefined {
  const t = s?.trim();
  return t === "" ? undefined : t;
}

export default function SettingsOrganizationPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["organization-settings"],
    queryFn: getOrganizationSettings,
  });

  const saveMutation = useMutation({
    mutationFn: saveOrganizationSettings,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["organization-settings"] }),
  });

  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [form, setForm] = useState<OrganizationSettings>({
    organizationName: "",
    organizationAddress: "",
    organizationAddressDetail: "",
    worksites: [],
    defaultWorksiteId: undefined,
  });
  // 편집 취소용 스냅샷
  const [orgSnapshot, setOrgSnapshot] = useState({ organizationName: "", organizationAddress: "", organizationAddressDetail: "" });
  // 사업장 행별 편집 모드 (id Set)
  const [editingWsIds, setEditingWsIds] = useState<Set<string>>(new Set());
  // 사업장 편집 취소용 스냅샷
  const [wsSnapshots, setWsSnapshots] = useState<Record<string, WorksiteItem>>({});

  useEffect(() => {
    if (!data) return;
    setForm({
      organizationName: data.organizationName ?? "",
      organizationAddress: data.organizationAddress ?? "",
      organizationAddressDetail: data.organizationAddressDetail ?? "",
      worksites: (data.worksites ?? []).map((w) => ({ ...w })),
      defaultWorksiteId: data.defaultWorksiteId,
    });
  }, [data]);

  const handleAdd = () => {
    setForm((p) => {
      const ws = createWorksiteDraft();
      const next = { ...p, worksites: [...p.worksites, ws] };
      if (!next.defaultWorksiteId) next.defaultWorksiteId = ws.id;
      return next;
    });
  };

  const handleRemove = async (id: string) => {
    let nextForm: OrganizationSettings = {} as OrganizationSettings;
    setForm((p) => {
      const worksites = p.worksites.filter((w) => w.id !== id);
      const defaultWorksiteId =
        p.defaultWorksiteId === id ? worksites[0]?.id : p.defaultWorksiteId;
      nextForm = { ...p, worksites, defaultWorksiteId };
      return nextForm;
    });
    // 삭제 즉시 서버에 반영
    await saveMutation.mutateAsync({
      ...nextForm,
      worksites: nextForm.worksites
        .filter((w) => w.name.trim() !== "" || w.address.trim() !== "")
        .map((w) => ({
          id: w.id,
          name: w.name.trim() || "사업장",
          address: w.address.trim(),
          addressDetail: trimOptional(w.addressDetail),
        })),
    });
  };

  const handleWorksiteChange = (
    id: string,
    field: keyof WorksiteItem,
    value: string
  ) => {
    setForm((p) => ({
      ...p,
      worksites: p.worksites.map((w) =>
        w.id === id ? { ...w, [field]: value } : w
      ),
    }));
  };

  const setDefault = (id: string) => {
    setForm((p) => ({ ...p, defaultWorksiteId: id }));
  };

  const handleWsEdit = (w: WorksiteItem) => {
    setWsSnapshots((p) => ({ ...p, [w.id]: { ...w } }));
    setEditingWsIds((p) => new Set(Array.from(p).concat(w.id)));
  };

  const handleWsCancel = (id: string) => {
    const snap = wsSnapshots[id];
    if (snap) {
      setForm((p) => ({
        ...p,
        worksites: p.worksites.map((w) => (w.id === id ? { ...snap } : w)),
      }));
    }
    setEditingWsIds((p) => new Set(Array.from(p).filter((x) => x !== id)));
  };

  const handleWsSave = async (id: string) => {
    setEditingWsIds((p) => new Set(Array.from(p).filter((x) => x !== id)));
    await handleSave();
  };

  const handleOrgEdit = () => {
    setOrgSnapshot({
      organizationName: form.organizationName,
      organizationAddress: form.organizationAddress ?? "",
      organizationAddressDetail: form.organizationAddressDetail ?? "",
    });
    setIsEditingOrg(true);
  };

  const handleOrgCancel = () => {
    setForm((p) => ({ ...p, ...orgSnapshot }));
    setIsEditingOrg(false);
  };

  const handleSave = async () => {
    const payload: OrganizationSettings = {
      organizationName: form.organizationName.trim() || "조직",
      organizationAddress: form.organizationAddress?.trim() ?? "",
      organizationAddressDetail: trimOptional(form.organizationAddressDetail),
      defaultWorksiteId: form.defaultWorksiteId,
      worksites: form.worksites
        .filter((w) => w.name.trim() !== "" || w.address.trim() !== "")
        .map((w) => ({
          id: w.id,
          name: w.name.trim() || "사업장",
          address: w.address.trim(),
          addressDetail: trimOptional(w.addressDetail),
        })),
    };

    // default가 삭제되었거나 비어있다면 첫 사업장으로 보정
    if (
      payload.defaultWorksiteId &&
      !payload.worksites.some((w) => w.id === payload.defaultWorksiteId)
    ) {
      payload.defaultWorksiteId = payload.worksites[0]?.id;
    }

    await saveMutation.mutateAsync(payload);
    setIsEditingOrg(false);
  };

  return (
    <>
      <PageHeader
        title="조직 및 사업장"
        description="조직 정보와 사업장 목록을 관리합니다. 기본 사업장은 직원 출퇴근 거리 산출의 출근지로 사용됩니다."
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">조직 정보</CardTitle>
            {!isLoading && (
              isEditingOrg ? (
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                  >
                    <Save className="mr-1 h-4 w-4" />
                    {saveMutation.isPending ? "저장 중..." : "저장"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOrgCancel}
                    disabled={saveMutation.isPending}
                  >
                    <X className="mr-1 h-4 w-4" />
                    취소
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={handleOrgEdit}>
                  <Pencil className="mr-1 h-4 w-4" />
                  수정
                </Button>
              )
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">불러오는 중...</p>
            ) : isEditingOrg ? (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    조직명
                  </label>
                  <input
                    value={form.organizationName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, organizationName: e.target.value }))
                    }
                    placeholder="조직명"
                    className={inputClass}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    대표 주소
                  </label>
                  <input
                    value={form.organizationAddress ?? ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, organizationAddress: e.target.value }))
                    }
                    placeholder="대표 주소"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    상세 주소
                  </label>
                  <input
                    value={form.organizationAddressDetail ?? ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, organizationAddressDetail: e.target.value }))
                    }
                    placeholder="층/호수 등"
                    className={inputClass}
                  />
                </div>
              </>
            ) : (
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="mb-0.5 text-xs font-medium text-muted-foreground">조직명</dt>
                  <dd className="font-medium">{form.organizationName || <span className="text-muted-foreground">미입력</span>}</dd>
                </div>
                <div>
                  <dt className="mb-0.5 text-xs font-medium text-muted-foreground">대표 주소</dt>
                  <dd>{form.organizationAddress || <span className="text-muted-foreground">미입력</span>}</dd>
                </div>
                {form.organizationAddressDetail && (
                  <div>
                    <dt className="mb-0.5 text-xs font-medium text-muted-foreground">상세 주소</dt>
                    <dd>{form.organizationAddressDetail}</dd>
                  </div>
                )}
              </dl>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">사업장 목록</CardTitle>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saveMutation.isPending || isLoading}
              >
                <Save className="mr-1 h-4 w-4" />
                {saveMutation.isPending ? "저장 중..." : "저장"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAdd}
                disabled={isLoading}
              >
                <Plus className="mr-1 h-4 w-4" /> 추가
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">불러오는 중...</p>
            ) : form.worksites.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                등록된 사업장이 없습니다. &quot;추가&quot;로 사업장을 등록하세요.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="w-36 pb-2 pr-2 font-medium">사업장명</th>
                      <th className="min-w-[260px] pb-2 pr-2 font-medium">주소</th>
                      <th className="min-w-[112px] pb-2 pr-2 font-medium">상세주소</th>
                      <th className="w-20 pb-2 pr-2 font-medium">기본</th>
                      <th className="w-28 pb-2 text-right font-medium">작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {form.worksites.map((w) => {
                      const isDefault = w.id === form.defaultWorksiteId;
                      const isEditing = editingWsIds.has(w.id);
                      return (
                        <tr key={w.id} className="align-middle">
                          {isEditing ? (
                            <>
                              <td className="py-2 pr-2">
                                <input
                                  value={w.name}
                                  onChange={(e) => handleWorksiteChange(w.id, "name", e.target.value)}
                                  placeholder="사업장명"
                                  className={inputClass}
                                  autoFocus
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <input
                                  value={w.address}
                                  onChange={(e) => handleWorksiteChange(w.id, "address", e.target.value)}
                                  placeholder="주소"
                                  className={inputClass}
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <input
                                  value={w.addressDetail ?? ""}
                                  onChange={(e) => handleWorksiteChange(w.id, "addressDetail", e.target.value)}
                                  placeholder="층/호수 등"
                                  className={inputClass}
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <Button
                                  type="button"
                                  variant={isDefault ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setDefault(w.id)}
                                >
                                  <Star className="mr-1 h-3.5 w-3.5" />
                                  {isDefault ? "기본" : "설정"}
                                </Button>
                              </td>
                              <td className="py-2 text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handleWsSave(w.id)}
                                    disabled={saveMutation.isPending}
                                  >
                                    <Save className="mr-1 h-3.5 w-3.5" />
                                    저장
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleWsCancel(w.id)}
                                  >
                                    <X className="mr-1 h-3.5 w-3.5" />
                                    취소
                                  </Button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-2 pr-2 font-medium">{w.name || <span className="text-muted-foreground">미입력</span>}</td>
                              <td className="py-2 pr-2 text-muted-foreground">{w.address || "—"}</td>
                              <td className="py-2 pr-2 text-muted-foreground">{w.addressDetail || "—"}</td>
                              <td className="py-2 pr-2">
                                {isDefault ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                    <Star className="h-3 w-3 fill-current" /> 기본
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                                    onClick={() => setDefault(w.id)}
                                  >
                                    기본으로
                                  </button>
                                )}
                              </td>
                              <td className="py-2 text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleWsEdit(w)}
                                  >
                                    <Pencil className="mr-1 h-3.5 w-3.5" />
                                    수정
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={() => handleRemove(w.id)}
                                  >
                                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                                    삭제
                                  </Button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
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
