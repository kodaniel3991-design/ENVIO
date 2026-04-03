"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardActionBar } from "@/components/ui/card-action-bar";
import type { UserItem, UserStatus } from "@/types";
import {
  deleteUser,
  getUsers,
  inviteUser,
  resetPassword,
  upsertUser,
} from "@/services/api";
import { USER_STATUS_LABEL } from "@/lib/constants/status-badges";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationBar } from "@/components/common/pagination-bar";

const inputClass =
  "h-8 w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1 text-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring";

const emptyForm = { name: "", email: "", department: "", jobTitle: "", duty: "" };

function trimOptional(s: string | undefined): string | undefined {
  const t = s?.trim();
  return t === "" ? undefined : t;
}

type OrgStructure = {
  departments: { id: string; name: string }[];
  teams: { id: string; departmentId: string | null; name: string }[];
  positions: { id: string; name: string }[];
  duties: { id: string; name: string; description: string }[];
};

type EditForm = { name: string; department: string; jobTitle: string; duty: string; status: UserStatus };

export default function SettingsUsersPage() {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading: usersLoading } = useQuery<UserItem[]>({
    queryKey: ["settings-users"],
    queryFn: getUsers,
  });

  const { data: orgStructure } = useQuery<OrgStructure>({
    queryKey: ["org-structure"],
    queryFn: async () => {
      const res = await fetch("/api/org-structure");
      if (!res.ok) throw new Error("org-structure fetch failed");
      return res.json();
    },
  });
  const orgDepts = orgStructure?.departments ?? [];
  const orgTeams = orgStructure?.teams ?? [];
  const orgPositions = orgStructure?.positions ?? [];
  const orgDuties = orgStructure?.duties ?? [];

  const inviteMutation = useMutation({
    mutationFn: inviteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-users"] });
      toast.success("초대되었습니다.");
    },
    onError: () => {
      toast.error("처리에 실패했습니다.");
    },
  });
  const upsertMutation = useMutation({
    mutationFn: upsertUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-users"] });
      toast.success("저장되었습니다.");
    },
    onError: () => {
      toast.error("처리에 실패했습니다.");
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-users"] });
      toast.success("삭제되었습니다.");
    },
    onError: () => {
      toast.error("처리에 실패했습니다.");
    },
  });

  const [tempPwResult, setTempPwResult] = useState<{ userName: string; pw: string } | null>(null);
  const resetPwMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: (data, userId) => {
      const u = users.find((x) => x.id === userId);
      setTempPwResult({ userName: u?.name ?? "", pw: data.tempPassword });
      toast.success("비밀번호가 초기화되었습니다.");
    },
    onError: () => {
      toast.error("비밀번호 초기화에 실패했습니다.");
    },
  });

  const [query, setQueryState] = useState(() =>
    typeof window !== "undefined" ? (sessionStorage.getItem("users-search-q") ?? "") : ""
  );
  const setQuery = (val: string) => {
    setQueryState(val);
    sessionStorage.setItem("users-search-q", val);
  };

  const [showAddRow, setShowAddRow] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.email, u.department ?? "", u.jobTitle ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [users, query]);

  const pagination = usePagination({ totalItems: filtered.length, pageSize: 10 });
  const visibleUsers = pagination.paginate(filtered);

  const handleAdd = async () => {
    const payload = {
      name: addForm.name.trim(),
      email: addForm.email.trim(),
      department: trimOptional(addForm.department),
      jobTitle: trimOptional(addForm.jobTitle),
      duty: trimOptional(addForm.duty),
    };
    if (!payload.name || !payload.email) return;
    await inviteMutation.mutateAsync(payload);
    setAddForm(emptyForm);
    setShowAddRow(false);
  };

  const handleEditStart = () => {
    const u = users.find((x) => x.id === selectedUserId);
    if (!u) return;
    setEditForm({
      name: u.name,
      department: u.department ?? "",
      jobTitle: u.jobTitle ?? "",
      duty: u.duty ?? "",
      status: u.status as UserStatus,
    });
    setEditingUserId(u.id);
  };

  const handleEditCancel = () => {
    setEditingUserId(null);
    setEditForm(null);
  };

  const handleEditSave = async () => {
    if (!editingUserId || !editForm) return;
    const u = users.find((x) => x.id === editingUserId);
    if (!u) return;
    await upsertMutation.mutateAsync({
      ...u,
      name: editForm.name.trim(),
      department: trimOptional(editForm.department),
      jobTitle: trimOptional(editForm.jobTitle),
      duty: trimOptional(editForm.duty),
      status: editForm.status,
    });
    setEditingUserId(null);
    setEditForm(null);
  };

  const handleDelete = () => {
    if (!selectedUserId) return;
    deleteMutation.mutate(selectedUserId);
    setSelectedUserId(null);
    setEditingUserId(null);
    setEditForm(null);
  };

  /** 부서/팀 드롭다운 렌더 */
  const renderDeptSelect = (value: string, onChange: (v: string) => void, disabled?: boolean) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} disabled={disabled} onClick={(e) => e.stopPropagation()}>
      <option value="">미지정</option>
      {orgDepts.map((dept) => {
        const teams = orgTeams.filter((t) => t.departmentId === dept.id);
        return teams.length > 0 ? (
          <optgroup key={dept.id} label={dept.name}>
            <option value={dept.name}>{dept.name} (본부)</option>
            {teams.map((t) => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </optgroup>
        ) : (
          <option key={dept.id} value={dept.name}>{dept.name}</option>
        );
      })}
    </select>
  );

  /** 직급 드롭다운 렌더 */
  const renderPositionSelect = (value: string, onChange: (v: string) => void, disabled?: boolean) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} disabled={disabled} onClick={(e) => e.stopPropagation()}>
      <option value="">미지정</option>
      {orgPositions.map((p) => (
        <option key={p.id} value={p.name}>{p.name}</option>
      ))}
    </select>
  );

  /** 직무(역할) 드롭다운 렌더 */
  const renderDutySelect = (value: string, onChange: (v: string) => void, disabled?: boolean) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} disabled={disabled} onClick={(e) => e.stopPropagation()}>
      <option value="">미지정</option>
      {orgDuties.map((d) => (
        <option key={d.id} value={d.name}>{d.name}</option>
      ))}
    </select>
  );

  return (
    <>
      <PageHeader
        title="사용자 및 권한"
        description="사용자 계정과 역할·권한을 관리합니다."
      />

      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-col space-y-2 pb-3">
            <CardTitle className="text-sm font-semibold">
              사용자 목록 <span className="font-normal text-muted-foreground">({users.length})</span>
            </CardTitle>
            <div className="flex items-center justify-between gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="검색 (이름/이메일/부서/직책)"
                className={inputClass + " max-w-xs"}
              />
              <div className="flex items-center gap-2">
                {selectedUserId && !editingUserId && (
                  <button
                    type="button"
                    onClick={() => resetPwMutation.mutate(selectedUserId)}
                    disabled={resetPwMutation.isPending}
                    className="rounded border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted/50 disabled:opacity-50"
                  >
                    PW 초기화
                  </button>
                )}
                <CardActionBar
                  isEditing={!!editingUserId}
                  hasSelection={!!selectedUserId}
                  onEdit={handleEditStart}
                  onCancel={handleEditCancel}
                  onDelete={handleDelete}
                  onSave={handleEditSave}
                  adds={[{ label: "추가", onClick: () => { setShowAddRow(true); setAddForm(emptyForm); } }]}
                />
              </div>
            </div>
          </CardHeader>
          {tempPwResult && (
            <div className="mx-6 mb-3 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm dark:border-blue-800 dark:bg-blue-950/40">
              <span className="font-medium">{tempPwResult.userName}</span>
              <span className="text-muted-foreground">임시 비밀번호:</span>
              <code className="rounded bg-white px-2 py-0.5 font-mono text-sm dark:bg-background">
                {tempPwResult.pw}
              </code>
              <button
                onClick={() => { navigator.clipboard.writeText(tempPwResult.pw); toast.success("복사되었습니다."); }}
                className="rounded border px-2 py-0.5 text-xs hover:bg-white dark:hover:bg-background"
              >
                복사
              </button>
              <button
                onClick={() => setTempPwResult(null)}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              >
                닫기
              </button>
            </div>
          )}
          <CardContent>
            {usersLoading ? (
              <p className="text-sm text-muted-foreground">불러오는 중...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs" aria-label="사용자 목록">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="w-24 pb-2 pr-2 font-medium">이름</th>
                      <th className="w-32 pb-2 pr-2 font-medium">이메일</th>
                      <th className="w-24 pb-2 pr-2 font-medium">부서</th>
                      <th className="w-24 pb-2 pr-2 font-medium">직책</th>
                      <th className="w-28 pb-2 pr-2 font-medium">역할</th>
                      <th className="w-20 pb-2 pr-2 font-medium">상태</th>
                      <th className="w-28 pb-2 pr-2 font-medium">최근 로그인</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {/* 인라인 추가 행 */}
                    {showAddRow && (
                      <tr className="bg-muted/30">
                        <td className="py-1.5 pr-2">
                          <input
                            autoFocus
                            value={addForm.name}
                            onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="이름"
                            className={inputClass}
                          />
                        </td>
                        <td className="py-1.5 pr-2">
                          <input
                            value={addForm.email}
                            onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                            placeholder="이메일"
                            className={inputClass}
                          />
                        </td>
                        <td className="py-1.5 pr-2">
                          {renderDeptSelect(addForm.department, (v) => setAddForm((p) => ({ ...p, department: v })))}
                        </td>
                        <td className="py-1.5 pr-2">
                          {renderPositionSelect(addForm.jobTitle, (v) => setAddForm((p) => ({ ...p, jobTitle: v })))}
                        </td>
                        <td className="py-1.5 pr-2">
                          {renderDutySelect(addForm.duty, (v) => setAddForm((p) => ({ ...p, duty: v })))}
                        </td>
                        <td className="py-1.5 pr-2 text-muted-foreground" colSpan={2}>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={handleAdd}
                              disabled={inviteMutation.isPending || !addForm.name || !addForm.email}
                              className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-50"
                            >저장</button>
                            <button
                              type="button"
                              onClick={() => setShowAddRow(false)}
                              className="rounded border px-2 py-1 text-xs"
                            >취소</button>
                          </div>
                        </td>
                      </tr>
                    )}

                    {filtered.length === 0 && !showAddRow ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-muted-foreground">
                          표시할 사용자가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      visibleUsers.map((u) => {
                        const isEditing = editingUserId === u.id;
                        const isSelected = selectedUserId === u.id;
                        return (
                          <tr
                            key={u.id}
                            className={`cursor-pointer align-middle transition-colors ${isSelected ? "bg-accent" : "hover:bg-muted/50"}`}
                            onClick={() => { if (!isEditing) setSelectedUserId(u.id); }}
                          >
                            <td className="py-2 pr-2 font-medium">
                              {isEditing ? (
                                <input
                                  value={editForm!.name}
                                  onChange={(e) => setEditForm((p) => p && ({ ...p, name: e.target.value }))}
                                  className={inputClass}
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : u.name}
                            </td>
                            <td className="py-2 pr-2 text-muted-foreground">{u.email}</td>
                            <td className="py-2 pr-2">
                              {isEditing
                                ? renderDeptSelect(editForm!.department, (v) => setEditForm((p) => p && ({ ...p, department: v })))
                                : (u.department ?? "-")}
                            </td>
                            <td className="py-2 pr-2">
                              {isEditing
                                ? renderPositionSelect(editForm!.jobTitle, (v) => setEditForm((p) => p && ({ ...p, jobTitle: v })))
                                : (u.jobTitle ?? "-")}
                            </td>
                            <td className="py-2 pr-2">
                              {isEditing
                                ? renderDutySelect(editForm!.duty, (v) => setEditForm((p) => p && ({ ...p, duty: v })))
                                : renderDutySelect(u.duty ?? "", () => {}, true)}
                            </td>
                            <td className="py-2 pr-2">
                              <select
                                value={isEditing ? editForm!.status : u.status}
                                onChange={(e) => {
                                  if (isEditing) setEditForm((p) => p && ({ ...p, status: e.target.value as UserStatus }));
                                }}
                                className={inputClass}
                                disabled={!isEditing}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="active">{USER_STATUS_LABEL["active"]}</option>
                                <option value="invited">{USER_STATUS_LABEL["invited"]}</option>
                                <option value="disabled">{USER_STATUS_LABEL["disabled"]}</option>
                              </select>
                            </td>
                            <td className="py-2 pr-2 text-muted-foreground">{u.lastLoginAt ?? "-"}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                <PaginationBar pagination={pagination} totalItems={filtered.length} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
