"use client";

import { useEffect, useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { OrganizationSettings, WorksiteItem } from "@/types";
import {
  createWorksiteDraft,
  getOrganizationSettings,
  saveOrganizationSettings,
} from "@/services/api";
import { Plus, Save, Star, Pencil, X, ChevronRight } from "lucide-react";
import { CardActionBar } from "@/components/ui/card-action-bar";

const inputClass =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring";

const selectClass =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring";

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

type OrgDept = { id: string; name: string; sort_order: number };
type OrgTeam = { id: string; departmentId: string | null; name: string; leaderName: string | null; defaultDutyName: string | null; sort_order: number };
type OrgPosition = { id: string; name: string; sort_order: number };
type OrgDuty = { id: string; name: string; sort_order: number };

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-settings"] });
      toast.success("저장되었습니다.");
    },
    onError: () => {
      toast.error("저장에 실패했습니다.");
    },
  });

  // ── 조직 구조 ──────────────────────────────────
  const { data: orgStructureData } = useQuery({
    queryKey: ["org-structure"],
    queryFn: async () => {
      const res = await fetch("/api/org-structure");
      if (!res.ok) throw new Error("org-structure fetch failed");
      return res.json() as Promise<{ departments: OrgDept[]; teams: OrgTeam[]; positions: OrgPosition[]; duties: OrgDuty[] }>;
    },
  });

  type OrgStructureCache = { departments: OrgDept[]; teams: OrgTeam[]; positions: OrgPosition[]; duties: OrgDuty[] };
  const normalizeTeams = (raw: any[]): OrgTeam[] =>
    raw.map((t) => ({
      ...t,
      departmentId: t.departmentId ?? t.department_id ?? null,
      leaderName: t.leaderName ?? t.leader_name ?? null,
      defaultDutyName: t.defaultDutyName ?? t.default_duty_name ?? null,
    }));

  const [departments, setDepartments] = useState<OrgDept[]>(() => {
    const c = queryClient.getQueryData<OrgStructureCache>(["org-structure"]);
    return c?.departments ?? [];
  });
  const [teams, setTeams] = useState<OrgTeam[]>(() => {
    const c = queryClient.getQueryData<OrgStructureCache>(["org-structure"]);
    return normalizeTeams(c?.teams ?? []);
  });
  const [positions, setPositions] = useState<OrgPosition[]>(() => {
    const c = queryClient.getQueryData<OrgStructureCache>(["org-structure"]);
    return c?.positions ?? [];
  });
  const [duties, setDuties] = useState<OrgDuty[]>(() => {
    const c = queryClient.getQueryData<OrgStructureCache>(["org-structure"]);
    return c?.duties ?? [];
  });

  useEffect(() => {
    if (!orgStructureData) return;
    setDepartments(orgStructureData.departments ?? []);
    setTeams(normalizeTeams(orgStructureData.teams ?? []));
    setPositions(orgStructureData.positions ?? []);
    setDuties(orgStructureData.duties ?? []);
  }, [orgStructureData]);

  const orgMutation = useMutation({
    mutationFn: async (payload: { type: string; action: string; item: any }) => {
      const res = await fetch("/api/org-structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("org-structure mutation failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["org-structure"] }),
  });

  // 부서 편집 상태
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [deptSnapshots, setDeptSnapshots] = useState<Record<string, OrgDept>>({});

  const addDept = useCallback(() => {
    const newItem: OrgDept = { id: genId(), name: "", sort_order: departments.length };
    setDepartments((p) => [...p, newItem]);
    setEditingDeptId(newItem.id);
    setSelectedDeptId(newItem.id);
    setSelectedTeamId(null);
  }, [departments.length]);

  const saveDept = useCallback(async (dept: OrgDept) => {
    if (!dept.name.trim()) return;
    await orgMutation.mutateAsync({ type: "department", action: "upsert", item: dept });
    setEditingDeptId(null);
  }, [orgMutation]);

  const cancelDept = useCallback((id: string) => {
    const snap = deptSnapshots[id];
    if (snap) {
      setDepartments((p) => p.map((d) => (d.id === id ? snap : d)));
    } else {
      setDepartments((p) => p.filter((d) => d.id !== id));
    }
    setEditingDeptId(null);
  }, [deptSnapshots]);

  const deleteDept = useCallback(async (id: string) => {
    setDepartments((p) => p.filter((d) => d.id !== id));
    await orgMutation.mutateAsync({ type: "department", action: "delete", item: { id } });
  }, [orgMutation]);

  const startEditDept = useCallback((dept: OrgDept) => {
    setDeptSnapshots((p) => ({ ...p, [dept.id]: { ...dept } }));
    setEditingDeptId(dept.id);
  }, []);

  // 팀 편집 상태
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamSnapshots, setTeamSnapshots] = useState<Record<string, OrgTeam>>({});

  const addTeam = useCallback((deptId?: string | null) => {
    const newItem: OrgTeam = { id: genId(), name: "", departmentId: deptId ?? null, leaderName: null, defaultDutyName: null, sort_order: teams.length };
    setTeams((p) => [...p, newItem]);
    setEditingTeamId(newItem.id);
    setSelectedTeamId(newItem.id);
    setSelectedDeptId(null);
    if (deptId) setExpandedDeptIds((prev) => new Set(prev).add(deptId));
  }, [teams.length]);

  const saveTeam = useCallback(async (team: OrgTeam) => {
    if (!team.name.trim()) return;
    await orgMutation.mutateAsync({ type: "team", action: "upsert", item: team });
    setEditingTeamId(null);
  }, [orgMutation]);

  const cancelTeam = useCallback((id: string) => {
    const snap = teamSnapshots[id];
    if (snap) {
      setTeams((p) => p.map((t) => (t.id === id ? snap : t)));
    } else {
      setTeams((p) => p.filter((t) => t.id !== id));
    }
    setEditingTeamId(null);
  }, [teamSnapshots]);

  const deleteTeam = useCallback(async (id: string) => {
    setTeams((p) => p.filter((t) => t.id !== id));
    await orgMutation.mutateAsync({ type: "team", action: "delete", item: { id } });
  }, [orgMutation]);

  const startEditTeam = useCallback((team: OrgTeam) => {
    setTeamSnapshots((p) => ({ ...p, [team.id]: { ...team } }));
    setEditingTeamId(team.id);
  }, []);

  // 직급 편집 상태
  const [editingPosId, setEditingPosId] = useState<string | null>(null);
  const [posSnapshots, setPosSnapshots] = useState<Record<string, OrgPosition>>({});

  const addPos = useCallback(() => {
    const newItem: OrgPosition = { id: genId(), name: "", sort_order: positions.length };
    setPositions((p) => [...p, newItem]);
    setEditingPosId(newItem.id);
  }, [positions.length]);

  const savePos = useCallback(async (pos: OrgPosition) => {
    if (!pos.name.trim()) return;
    await orgMutation.mutateAsync({ type: "position", action: "upsert", item: pos });
    setEditingPosId(null);
  }, [orgMutation]);

  const cancelPos = useCallback((id: string) => {
    const snap = posSnapshots[id];
    if (snap) {
      setPositions((p) => p.map((pos) => (pos.id === id ? snap : pos)));
    } else {
      setPositions((p) => p.filter((pos) => pos.id !== id));
    }
    setEditingPosId(null);
  }, [posSnapshots]);

  const deletePos = useCallback(async (id: string) => {
    setPositions((p) => p.filter((pos) => pos.id !== id));
    await orgMutation.mutateAsync({ type: "position", action: "delete", item: { id } });
  }, [orgMutation]);

  const startEditPos = useCallback((pos: OrgPosition) => {
    setPosSnapshots((p) => ({ ...p, [pos.id]: { ...pos } }));
    setEditingPosId(pos.id);
  }, []);

  // 직무 편집 상태
  const [editingDutyId, setEditingDutyId] = useState<string | null>(null);
  const [dutySnapshots, setDutySnapshots] = useState<Record<string, OrgDuty>>({});

  const addDuty = useCallback(() => {
    const newItem: OrgDuty = { id: genId(), name: "", sort_order: duties.length };
    setDuties((p) => [...p, newItem]);
    setEditingDutyId(newItem.id);
  }, [duties.length]);

  const saveDuty = useCallback(async (duty: OrgDuty) => {
    if (!duty.name.trim()) return;
    await orgMutation.mutateAsync({ type: "duty", action: "upsert", item: duty });
    setEditingDutyId(null);
  }, [orgMutation]);

  const cancelDuty = useCallback((id: string) => {
    const snap = dutySnapshots[id];
    if (snap) setDuties((p) => p.map((d) => d.id === id ? snap : d));
    else setDuties((p) => p.filter((d) => d.id !== id));
    setEditingDutyId(null);
  }, [dutySnapshots]);

  const deleteDuty = useCallback(async (id: string) => {
    setDuties((p) => p.filter((d) => d.id !== id));
    await orgMutation.mutateAsync({ type: "duty", action: "delete", item: { id } });
  }, [orgMutation]);

  const startEditDuty = useCallback((duty: OrgDuty) => {
    setDutySnapshots((p) => ({ ...p, [duty.id]: { ...duty } }));
    setEditingDutyId(duty.id);
  }, []);

  // 행 선택 상태
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedPosId, setSelectedPosId] = useState<string | null>(null);
  const [selectedDutyId, setSelectedDutyId] = useState<string | null>(null);

  // 트리 확장 상태
  const [expandedDeptIds, setExpandedDeptIds] = useState<Set<string>>(new Set());
  const toggleDeptExpand = useCallback((id: string) => {
    setExpandedDeptIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [form, setForm] = useState<OrganizationSettings>(() => {
    const c = queryClient.getQueryData<OrganizationSettings>(["organization-settings"]);
    if (c) return {
      organizationName: c.organizationName ?? "",
      organizationAddress: c.organizationAddress ?? "",
      organizationAddressDetail: c.organizationAddressDetail ?? "",
      industry: c.industry ?? "",
      country: c.country ?? "",
      employeeCount: c.employeeCount ?? "",
      revenue: c.revenue ?? "",
      worksites: (c.worksites ?? []).map((w) => ({ ...w })),
      defaultWorksiteId: c.defaultWorksiteId,
    };
    return { organizationName: "", organizationAddress: "", organizationAddressDetail: "", industry: "", country: "", employeeCount: "", revenue: "", worksites: [], defaultWorksiteId: undefined };
  });
  // 편집 취소용 스냅샷
  const [orgSnapshot, setOrgSnapshot] = useState({ organizationName: "", organizationAddress: "", organizationAddressDetail: "" });
  // 사업장 행별 편집 모드
  const [editingWsId, setEditingWsId] = useState<string | null>(null);
  const [selectedWsId, setSelectedWsId] = useState<string | null>(null);
  // 사업장 편집 취소용 스냅샷
  const [wsSnapshots, setWsSnapshots] = useState<Record<string, WorksiteItem>>({});

  useEffect(() => {
    if (!data) return;
    setForm({
      organizationName: data.organizationName ?? "",
      organizationAddress: data.organizationAddress ?? "",
      organizationAddressDetail: data.organizationAddressDetail ?? "",
      industry: data.industry ?? "",
      country: data.country ?? "",
      employeeCount: data.employeeCount ?? "",
      revenue: data.revenue ?? "",
      worksites: (data.worksites ?? []).map((w) => ({ ...w })),
      defaultWorksiteId: data.defaultWorksiteId,
    });
  }, [data]);

  const handleAdd = () => {
    const ws = createWorksiteDraft();
    setForm((p) => {
      const next = { ...p, worksites: [...p.worksites, ws] };
      if (!next.defaultWorksiteId) next.defaultWorksiteId = ws.id;
      return next;
    });
    setSelectedWsId(ws.id);
    setEditingWsId(ws.id);
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
        .filter((w) => w.name.trim() !== "" || (w.address ?? "").trim() !== "")
        .map((w) => ({
          id: w.id,
          name: w.name.trim() || "사업장",
          address: (w.address ?? "").trim(),
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
    setEditingWsId(w.id);
  };

  const handleWsCancel = (id: string) => {
    const snap = wsSnapshots[id];
    if (snap) {
      setForm((p) => ({
        ...p,
        worksites: p.worksites.map((w) => (w.id === id ? { ...snap } : w)),
      }));
    }
    setEditingWsId(null);
  };

  const handleWsSave = async (id: string) => {
    setEditingWsId(null);
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
      industry: form.industry?.trim() ?? "",
      country: form.country?.trim() ?? "",
      employeeCount: form.employeeCount?.trim() ?? "",
      revenue: form.revenue?.trim() ?? "",
      defaultWorksiteId: form.defaultWorksiteId,
      worksites: form.worksites
        .filter((w) => w.name.trim() !== "" || (w.address ?? "").trim() !== "")
        .map((w) => ({
          id: w.id,
          name: w.name.trim() || "사업장",
          address: (w.address ?? "").trim(),
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">업종</label>
                    <input
                      value={form.industry ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}
                      placeholder="제조업, IT 등"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">국가</label>
                    <input
                      value={form.country ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                      placeholder="대한민국"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">종업원 수</label>
                    <input
                      value={form.employeeCount ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, employeeCount: e.target.value }))}
                      placeholder="예: 100~300명"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">매출 규모</label>
                    <input
                      value={form.revenue ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, revenue: e.target.value }))}
                      placeholder="예: 100억 이상"
                      className={inputClass}
                    />
                  </div>
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
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <dt className="mb-0.5 text-xs font-medium text-muted-foreground">업종</dt>
                    <dd>{form.industry || <span className="text-muted-foreground">미입력</span>}</dd>
                  </div>
                  <div>
                    <dt className="mb-0.5 text-xs font-medium text-muted-foreground">국가</dt>
                    <dd>{form.country || <span className="text-muted-foreground">미입력</span>}</dd>
                  </div>
                  <div>
                    <dt className="mb-0.5 text-xs font-medium text-muted-foreground">종업원 수</dt>
                    <dd>{form.employeeCount || <span className="text-muted-foreground">미입력</span>}</dd>
                  </div>
                  <div>
                    <dt className="mb-0.5 text-xs font-medium text-muted-foreground">매출 규모</dt>
                    <dd>{form.revenue || <span className="text-muted-foreground">미입력</span>}</dd>
                  </div>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">사업장 목록</CardTitle>
            <CardActionBar
              isEditing={!!editingWsId}
              hasSelection={!!selectedWsId}
              onEdit={() => {
                if (selectedWsId) {
                  const w = form.worksites.find((x) => x.id === selectedWsId);
                  if (w) handleWsEdit(w);
                }
              }}
              onCancel={() => { if (editingWsId) handleWsCancel(editingWsId); }}
              onDelete={() => {
                if (selectedWsId && !editingWsId) {
                  handleRemove(selectedWsId);
                  setSelectedWsId(null);
                }
              }}
              onSave={() => { if (editingWsId) handleWsSave(editingWsId); }}
              adds={[{ label: "추가", onClick: handleAdd }]}
            />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">불러오는 중...</p>
            ) : form.worksites.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                등록된 사업장이 없습니다. &quot;추가&quot;로 사업장을 등록하세요.
              </p>
            ) : (
              <div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="w-28 pb-2 pr-2 font-medium">사업장명</th>
                      <th className="pb-2 pr-2 font-medium">주소</th>
                      <th className="w-28 pb-2 pr-2 font-medium">상세주소</th>
                      <th className="w-16 pb-2 font-medium">기본</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {form.worksites.map((w) => {
                      const isDefault = w.id === form.defaultWorksiteId;
                      const isEditing = editingWsId === w.id;
                      const isSelected = selectedWsId === w.id;
                      return (
                        <tr
                          key={w.id}
                          className={`align-middle cursor-pointer transition-colors ${isSelected ? "bg-accent" : "hover:bg-muted/50"}`}
                          onClick={() => { if (!isEditing) { setSelectedWsId(w.id); } }}
                        >
                          {isEditing ? (
                            <>
                              <td className="py-1 pr-2">
                                <input
                                  value={w.name}
                                  onChange={(e) => handleWorksiteChange(w.id, "name", e.target.value)}
                                  placeholder="사업장명"
                                  className={inputClass}
                                  autoFocus
                                />
                              </td>
                              <td className="py-1 pr-2">
                                <input
                                  value={w.address}
                                  onChange={(e) => handleWorksiteChange(w.id, "address", e.target.value)}
                                  placeholder="주소"
                                  className={inputClass}
                                />
                              </td>
                              <td className="py-1 pr-2">
                                <input
                                  value={w.addressDetail ?? ""}
                                  onChange={(e) => handleWorksiteChange(w.id, "addressDetail", e.target.value)}
                                  placeholder="층/호수 등"
                                  className={inputClass}
                                />
                              </td>
                              <td className="py-1">
                                <Button
                                  type="button"
                                  variant={isDefault ? "default" : "outline"}
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); setDefault(w.id); }}
                                >
                                  <Star className="mr-1 h-3.5 w-3.5" />
                                  {isDefault ? "기본" : "설정"}
                                </Button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-2 pr-2 font-medium">{w.name || <span className="text-muted-foreground">미입력</span>}</td>
                              <td className="py-2 pr-2 text-muted-foreground">{w.address || "—"}</td>
                              <td className="py-2 pr-2 text-muted-foreground">{w.addressDetail || "—"}</td>
                              <td className="py-2">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setDefault(w.id); }}
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                                    isDefault
                                      ? "bg-primary/10 text-primary cursor-default"
                                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                                  }`}
                                >
                                  <Star className={`h-3 w-3 ${isDefault ? "fill-current" : ""}`} />
                                  기본
                                </button>
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

      {/* 조직 구조 관리 */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">

        {/* 부서/팀 트리 카드 */}
        <Card>
          <CardHeader className="flex flex-col space-y-2 pb-3">
            <CardTitle className="text-sm font-semibold">부서/팀 <span className="font-normal text-muted-foreground">({departments.length}부서 {teams.length}팀)</span></CardTitle>
            <CardActionBar
              isEditing={!!(editingDeptId || editingTeamId)}
              hasSelection={!!(selectedDeptId || selectedTeamId)}
              onEdit={() => {
                if (selectedDeptId) { const d = departments.find(x => x.id === selectedDeptId); if (d) startEditDept(d); }
                else if (selectedTeamId) { const t = teams.find(x => x.id === selectedTeamId); if (t) startEditTeam(t); }
              }}
              onCancel={() => {
                if (editingDeptId) cancelDept(editingDeptId);
                if (editingTeamId) cancelTeam(editingTeamId);
              }}
              onDelete={() => {
                if (selectedDeptId) { deleteDept(selectedDeptId); setSelectedDeptId(null); }
                else if (selectedTeamId) { deleteTeam(selectedTeamId); setSelectedTeamId(null); }
              }}
              onSave={() => {
                if (editingDeptId) { const d = departments.find(x => x.id === editingDeptId); if (d) saveDept(d); }
                else if (editingTeamId) { const t = teams.find(x => x.id === editingTeamId); if (t) saveTeam(t); }
              }}
              adds={[
                { label: "부서", onClick: addDept },
                {
                  label: "팀", onClick: () => {
                    const deptId = selectedDeptId
                      ?? (selectedTeamId ? (teams.find(t => t.id === selectedTeamId)?.departmentId ?? null) : null);
                    addTeam(deptId);
                  }
                },
              ]}
            />
          </CardHeader>
          <CardContent className="space-y-0.5 max-h-[520px] overflow-y-auto">
            {departments.map((dept) => {
              const deptTeams = teams.filter((t) => t.departmentId === dept.id);
              const isExpanded = expandedDeptIds.has(dept.id);
              const isDeptSelected = selectedDeptId === dept.id;
              const isDeptEditing = editingDeptId === dept.id;

              return (
                <div key={dept.id}>
                  {/* 부서 행 */}
                  <div
                    className={`flex items-center gap-1.5 rounded px-2 py-1 cursor-pointer transition-colors ${isDeptSelected ? "bg-accent" : "hover:bg-muted/50"}`}
                    onClick={() => {
                      if (!isDeptEditing) {
                        setSelectedDeptId(dept.id);
                        setSelectedTeamId(null);
                        toggleDeptExpand(dept.id);
                      }
                    }}
                  >
                    <ChevronRight
                      className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    />
                    {isDeptEditing ? (
                      <input
                        value={dept.name}
                        onChange={(e) => setDepartments((p) => p.map((d) => d.id === dept.id ? { ...d, name: e.target.value } : d))}
                        placeholder="부서명 입력"
                        className={inputClass}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium">{dept.name}</span>
                        <span className="text-xs text-muted-foreground">{deptTeams.length}팀</span>
                      </>
                    )}
                  </div>

                  {/* 팀 행 (확장 시) */}
                  {isExpanded && deptTeams.map((team) => {
                    const isTeamSelected = selectedTeamId === team.id;
                    const isTeamEditing = editingTeamId === team.id;
                    return (
                      <div
                        key={team.id}
                        className={`flex items-center gap-1.5 rounded pl-8 pr-2 py-1 cursor-pointer transition-colors ${isTeamSelected ? "bg-accent" : "hover:bg-muted/50"}`}
                        onClick={() => {
                          if (!isTeamEditing) {
                            setSelectedTeamId(team.id);
                            setSelectedDeptId(null);
                          }
                        }}
                      >
                        <span className="text-muted-foreground text-xs shrink-0">└</span>
                        {isTeamEditing ? (
                          <div className="flex-1 space-y-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              value={team.name}
                              onChange={(e) => setTeams((p) => p.map((t) => t.id === team.id ? { ...t, name: e.target.value } : t))}
                              placeholder="팀명 입력"
                              className={inputClass}
                              autoFocus
                            />
                            <input
                              value={team.leaderName ?? ""}
                              onChange={(e) => setTeams((p) => p.map((t) => t.id === team.id ? { ...t, leaderName: e.target.value || null } : t))}
                              placeholder="팀장 이름 (선택사항)"
                              className={inputClass}
                            />
                            <select
                              value={team.defaultDutyName ?? ""}
                              onChange={(e) => setTeams((p) => p.map((t) => t.id === team.id ? { ...t, defaultDutyName: e.target.value || null } : t))}
                              className={selectClass}
                            >
                              <option value="">기본 직무 (선택사항)</option>
                              {duties.map((d) => (
                                <option key={d.id} value={d.name}>{d.name}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <>
                            <span className="flex-1 text-sm">{team.name}</span>
                            {team.leaderName && (
                              <span className="text-xs text-muted-foreground">{team.leaderName}</span>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}

                  {/* 확장됐는데 팀 없을 때 */}
                  {isExpanded && deptTeams.length === 0 && (
                    <p className="pl-8 py-0.5 text-xs text-muted-foreground">등록된 팀 없음</p>
                  )}
                </div>
              );
            })}

            {/* 부서 미배정 팀 */}
            {teams.filter((t) => !t.departmentId).map((team) => {
              const isTeamSelected = selectedTeamId === team.id;
              const isTeamEditing = editingTeamId === team.id;
              return (
                <div
                  key={team.id}
                  className={`flex items-center gap-1.5 rounded px-2 py-1 cursor-pointer transition-colors ${isTeamSelected ? "bg-accent" : "hover:bg-muted/50"}`}
                  onClick={() => { if (!isTeamEditing) { setSelectedTeamId(team.id); setSelectedDeptId(null); } }}
                >
                  {isTeamEditing ? (
                    <div className="flex-1 space-y-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        value={team.name}
                        onChange={(e) => setTeams((p) => p.map((t) => t.id === team.id ? { ...t, name: e.target.value } : t))}
                        placeholder="팀명 입력"
                        className={inputClass}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <span className="flex-1 text-sm text-muted-foreground">{team.name} (미배정)</span>
                  )}
                </div>
              );
            })}

            {departments.length === 0 && teams.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">등록된 부서/팀이 없습니다.</p>
            )}
          </CardContent>
        </Card>

        {/* 직급 카드 */}
        <Card>
          <CardHeader className="flex flex-col space-y-2 pb-3">
            <CardTitle className="text-sm font-semibold">직급 <span className="font-normal text-muted-foreground">({positions.length})</span></CardTitle>
            <CardActionBar
              isEditing={!!editingPosId}
              hasSelection={!!selectedPosId}
              onEdit={() => { const p = positions.find(x => x.id === selectedPosId); if (p) startEditPos(p); }}
              onCancel={() => cancelPos(editingPosId!)}
              onDelete={() => { if (selectedPosId) { deletePos(selectedPosId); setSelectedPosId(null); } }}
              onSave={() => { const p = positions.find(x => x.id === editingPosId); if (p) savePos(p); }}
              adds={[{ label: "추가", onClick: addPos }]}
            />
          </CardHeader>
          <CardContent className="space-y-0.5">
            {positions.map((pos) => (
              <div
                key={pos.id}
                className={`flex items-center gap-2 rounded px-2 py-1 cursor-pointer transition-colors ${selectedPosId === pos.id ? "bg-accent" : "hover:bg-muted/50"}`}
                onClick={() => editingPosId !== pos.id && setSelectedPosId(pos.id)}
              >
                {editingPosId === pos.id ? (
                  <input
                    value={pos.name}
                    onChange={(e) => setPositions((p) => p.map((x) => x.id === pos.id ? { ...x, name: e.target.value } : x))}
                    placeholder="직급명 입력"
                    className={inputClass}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="flex-1 text-sm">{pos.name}</span>
                )}
              </div>
            ))}
            {positions.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">등록된 직급이 없습니다.</p>
            )}
          </CardContent>
        </Card>

        {/* 직무 카드 */}
        <Card>
          <CardHeader className="flex flex-col space-y-2 pb-3">
            <CardTitle className="text-sm font-semibold">직무 <span className="font-normal text-muted-foreground">({duties.length})</span></CardTitle>
            <CardActionBar
              isEditing={!!editingDutyId}
              hasSelection={!!selectedDutyId}
              onEdit={() => { const d = duties.find(x => x.id === selectedDutyId); if (d) startEditDuty(d); }}
              onCancel={() => cancelDuty(editingDutyId!)}
              onDelete={() => { if (selectedDutyId) { deleteDuty(selectedDutyId); setSelectedDutyId(null); } }}
              onSave={() => { const d = duties.find(x => x.id === editingDutyId); if (d) saveDuty(d); }}
              adds={[{ label: "추가", onClick: addDuty }]}
            />
          </CardHeader>
          <CardContent className="space-y-0.5">
            {duties.map((duty) => (
              <div
                key={duty.id}
                className={`flex items-center gap-2 rounded px-2 py-1 cursor-pointer transition-colors ${selectedDutyId === duty.id ? "bg-accent" : "hover:bg-muted/50"}`}
                onClick={() => editingDutyId !== duty.id && setSelectedDutyId(duty.id)}
              >
                {editingDutyId === duty.id ? (
                  <input
                    value={duty.name}
                    onChange={(e) => setDuties((p) => p.map((d) => d.id === duty.id ? { ...d, name: e.target.value } : d))}
                    placeholder="직무명 입력"
                    className={inputClass}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="flex-1 text-sm">{duty.name}</span>
                )}
              </div>
            ))}
            {duties.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">등록된 직무가 없습니다.</p>
            )}
          </CardContent>
        </Card>

      </div>
    </>
  );
}
