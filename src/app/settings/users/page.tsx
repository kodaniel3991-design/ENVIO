"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { UserItem, UserStatus } from "@/types";
import {
  deleteUser,
  getRoles,
  getUsers,
  inviteUser,
  setUserStatus,
  upsertUser,
} from "@/services/api";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { USER_STATUS_LABEL } from "@/lib/constants/status-badges";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationBar } from "@/components/common/pagination-bar";

const inputClass =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring";

function trimOptional(s: string | undefined): string | undefined {
  const t = s?.trim();
  return t === "" ? undefined : t;
}

export default function SettingsUsersPage() {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["settings-users"],
    queryFn: getUsers,
  });
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["settings-roles"],
    queryFn: getRoles,
  });

  const inviteMutation = useMutation({
    mutationFn: inviteUser,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["settings-users"] }),
  });
  const upsertMutation = useMutation({
    mutationFn: upsertUser,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["settings-users"] }),
  });
  const statusMutation = useMutation({
    mutationFn: setUserStatus,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["settings-users"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["settings-users"] }),
  });

  const [query, setQuery] = useState("");
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    department: "",
    jobTitle: "",
    roleId: "",
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const hay = [
        u.name,
        u.email,
        u.department ?? "",
        u.jobTitle ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [users, query]);

  const pagination = usePagination({ totalItems: filtered.length, pageSize: 10 });
  const visibleUsers = pagination.paginate(filtered);

  const roleNameById = useMemo(() => {
    const map = new Map<string, string>();
    roles.forEach((r) => map.set(r.id, r.name));
    return map;
  }, [roles]);

  const handleInvite = async () => {
    const payload = {
      name: inviteForm.name.trim(),
      email: inviteForm.email.trim(),
      department: trimOptional(inviteForm.department),
      jobTitle: trimOptional(inviteForm.jobTitle),
      roleId: trimOptional(inviteForm.roleId),
    };
    if (!payload.name || !payload.email) return;
    await inviteMutation.mutateAsync(payload);
    setInviteForm({
      name: "",
      email: "",
      department: "",
      jobTitle: "",
      roleId: "",
    });
  };

  const handleRoleChange = (user: UserItem, roleId: string) => {
    upsertMutation.mutate({
      ...user,
      roleId: roleId || undefined,
    });
  };

  const handleStatusChange = (userId: string, status: UserStatus) => {
    statusMutation.mutate({ userId, status });
  };

  return (
    <>
      <PageHeader
        title="사용자 및 권한"
        description="사용자 계정과 역할·권한을 관리합니다."
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">사용자 초대</CardTitle>
            <p className="text-sm text-muted-foreground">
              이메일로 초대장을 발송하는 흐름을 가정합니다. (현재는 demo로 목록에 추가)
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  이름
                </label>
                <input
                  value={inviteForm.name}
                  onChange={(e) =>
                    setInviteForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="이름"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  이메일
                </label>
                <input
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="email@company.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  부서
                </label>
                <input
                  value={inviteForm.department}
                  onChange={(e) =>
                    setInviteForm((p) => ({ ...p, department: e.target.value }))
                  }
                  placeholder="부서"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  직책
                </label>
                <input
                  value={inviteForm.jobTitle}
                  onChange={(e) =>
                    setInviteForm((p) => ({ ...p, jobTitle: e.target.value }))
                  }
                  placeholder="직책"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  역할
                </label>
                <select
                  value={inviteForm.roleId}
                  onChange={(e) =>
                    setInviteForm((p) => ({ ...p, roleId: e.target.value }))
                  }
                  className={inputClass}
                  disabled={rolesLoading}
                >
                  <option value="">선택</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button
              onClick={handleInvite}
              disabled={inviteMutation.isPending || !inviteForm.name || !inviteForm.email}
              className="w-full"
            >
              <UserPlus className="mr-1 h-4 w-4" />
              {inviteMutation.isPending ? "초대 중..." : "초대"}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">사용자 목록</CardTitle>
              <p className="text-sm text-muted-foreground">
                역할 할당, 상태 변경, 삭제를 수행할 수 있습니다.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="검색 (이름/이메일/부서/직책)"
                className={inputClass}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  inviteMutation.mutate({
                    name: "새 사용자",
                    email: `new-${Date.now()}@carbonos.demo`,
                    roleId: roles[0]?.id,
                  })
                }
                title="테스트용 빠른 추가"
                disabled={inviteMutation.isPending}
              >
                <Plus className="mr-1 h-4 w-4" />
                빠른 추가
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <p className="text-sm text-muted-foreground">불러오는 중...</p>
            ) : filtered.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                표시할 사용자가 없습니다.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-sm" aria-label="사용자 목록">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="w-28 pb-2 pr-2 font-medium">이름</th>
                      <th className="min-w-[220px] pb-2 pr-2 font-medium">
                        이메일
                      </th>
                      <th className="w-28 pb-2 pr-2 font-medium">부서</th>
                      <th className="w-28 pb-2 pr-2 font-medium">직책</th>
                      <th className="w-28 pb-2 pr-2 font-medium">역할</th>
                      <th className="w-20 pb-2 pr-2 font-medium">상태</th>
                      <th className="w-28 pb-2 pr-2 font-medium">최근 로그인</th>
                      <th className="w-12 pb-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {visibleUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="py-2 pr-2 font-medium">{u.name}</td>
                        <td className="py-2 pr-2 text-muted-foreground">
                          {u.email}
                        </td>
                        <td className="py-2 pr-2">{u.department ?? "-"}</td>
                        <td className="py-2 pr-2">{u.jobTitle ?? "-"}</td>
                        <td className="py-2 pr-2">
                          <select
                            value={u.roleId ?? ""}
                            onChange={(e) => handleRoleChange(u, e.target.value)}
                            className={inputClass}
                            disabled={rolesLoading || upsertMutation.isPending}
                          >
                            <option value="">미지정</option>
                            {roles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 pr-2">
                          <select
                            value={u.status}
                            onChange={(e) =>
                              handleStatusChange(
                                u.id,
                                e.target.value as UserStatus
                              )
                            }
                            className={inputClass}
                            disabled={statusMutation.isPending}
                          >
                            <option value="active">{USER_STATUS_LABEL["active"]}</option>
                            <option value="invited">{USER_STATUS_LABEL["invited"]}</option>
                            <option value="disabled">{USER_STATUS_LABEL["disabled"]}</option>
                          </select>
                        </td>
                        <td className="py-2 pr-2 text-muted-foreground">
                          {u.lastLoginAt ?? "-"}
                        </td>
                        <td className="py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => deleteMutation.mutate(u.id)}
                            disabled={deleteMutation.isPending}
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <PaginationBar pagination={pagination} totalItems={filtered.length} />
              </div>
            )}

            <div className="mt-4 text-xs text-muted-foreground">
              현재 역할 이름:{" "}
              {filtered
                .map((u) => roleNameById.get(u.roleId ?? "") ?? "미지정")
                .filter(Boolean)
                .slice(0, 4)
                .join(", ")}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
