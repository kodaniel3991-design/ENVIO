"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAdminUsers,
  approveUser,
  rejectUser,
  resetUserPassword,
  updateAdminUserStatus,
  type AdminUserItem,
} from "@/services/api/admin";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationBar } from "@/components/common/pagination-bar";
import { UserCheck, UserX, Clock, Users } from "lucide-react";

const inputClass =
  "h-8 w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1 text-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring";

const APPROVAL_TABS = [
  { value: "all", label: "전체" },
  { value: "pending", label: "대기" },
  { value: "approved", label: "승인" },
  { value: "rejected", label: "반려" },
];

const APPROVAL_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const APPROVAL_LABEL: Record<string, string> = {
  pending: "대기",
  approved: "승인",
  rejected: "반려",
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  invited: "bg-blue-100 text-blue-800",
  disabled: "bg-gray-100 text-gray-800",
};

const STATUS_LABEL: Record<string, string> = {
  active: "활성",
  invited: "초대",
  disabled: "비활성",
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [tempPwResult, setTempPwResult] = useState<{ userId: string; pw: string } | null>(null);

  const { data: users = [], isLoading } = useQuery<AdminUserItem[]>({
    queryKey: ["admin-users", approvalFilter, search],
    queryFn: () =>
      getAdminUsers({
        approvalStatus: approvalFilter !== "all" ? approvalFilter : undefined,
        search: search || undefined,
      }),
  });

  const approveMutation = useMutation({
    mutationFn: approveUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (userId: string) => rejectUser(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const resetPwMutation = useMutation({
    mutationFn: resetUserPassword,
    onSuccess: (data, userId) => {
      setTempPwResult({ userId, pw: data.tempPassword });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      updateAdminUserStatus(userId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const pagination = usePagination({ totalItems: users.length, pageSize: 10 });
  const visibleUsers = pagination.paginate(users);

  const counts = useMemo(() => {
    const total = users.length;
    const pending = users.filter((u) => u.approvalStatus === "pending").length;
    const approved = users.filter((u) => u.approvalStatus === "approved").length;
    const rejected = users.filter((u) => u.approvalStatus === "rejected").length;
    return { total, pending, approved, rejected };
  }, [users]);

  return (
    <>
      <PageHeader
        title="사용자 승인 및 관리"
        description="가입 승인/반려, 상태 변경, 비밀번호 초기화를 관리합니다."
      />

      {/* 요약 카드 */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        {[
          { label: "전체 사용자", value: counts.total, Icon: Users, color: "text-foreground" },
          { label: "승인 대기", value: counts.pending, Icon: Clock, color: "text-yellow-600" },
          { label: "승인 완료", value: counts.approved, Icon: UserCheck, color: "text-green-600" },
          { label: "반려", value: counts.rejected, Icon: UserX, color: "text-red-600" },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-3 py-4">
              <c.Icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 임시 비밀번호 알림 */}
      {tempPwResult && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
          <span className="font-medium">임시 비밀번호:</span>{" "}
          <code className="rounded bg-white px-2 py-0.5 font-mono text-sm">
            {tempPwResult.pw}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(tempPwResult.pw);
            }}
            className="ml-2 rounded border px-2 py-0.5 text-xs hover:bg-white"
          >
            복사
          </button>
          <button
            onClick={() => setTempPwResult(null)}
            className="ml-1 text-xs text-muted-foreground hover:text-foreground"
          >
            닫기
          </button>
        </div>
      )}

      {/* 필터 & 목록 */}
      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-col space-y-2 pb-3">
            <CardTitle className="text-sm font-semibold">
              사용자 목록{" "}
              <span className="font-normal text-muted-foreground">({users.length})</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="검색 (이름/이메일/부서)"
                className={inputClass + " max-w-xs"}
              />
              <div className="flex rounded-md border border-border">
                {APPROVAL_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setApprovalFilter(tab.value)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      approvalFilter === tab.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">불러오는 중...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs" aria-label="사용자 목록">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2 pr-2 font-medium">이름</th>
                      <th className="pb-2 pr-2 font-medium">이메일</th>
                      <th className="pb-2 pr-2 font-medium">소속 기업</th>
                      <th className="pb-2 pr-2 font-medium">부서</th>
                      <th className="pb-2 pr-2 font-medium">역할</th>
                      <th className="w-16 pb-2 pr-2 font-medium">승인</th>
                      <th className="w-16 pb-2 pr-2 font-medium">상태</th>
                      <th className="w-28 pb-2 pr-2 font-medium">최근 로그인</th>
                      <th className="w-40 pb-2 font-medium">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {visibleUsers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-muted-foreground">
                          표시할 사용자가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      visibleUsers.map((u) => (
                        <tr key={u.id} className="align-middle hover:bg-muted/50">
                          <td className="py-2 pr-2 font-medium">
                            {u.name}
                            {u.isPlatformAdmin && (
                              <span className="ml-1 rounded bg-purple-100 px-1 py-0.5 text-[9px] text-purple-700">
                                관리자
                              </span>
                            )}
                          </td>
                          <td className="py-2 pr-2 text-muted-foreground">{u.email}</td>
                          <td className="py-2 pr-2">{u.organizationName ?? "-"}</td>
                          <td className="py-2 pr-2">{u.department ?? "-"}</td>
                          <td className="py-2 pr-2">{u.roleName ?? "-"}</td>
                          <td className="py-2 pr-2">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                APPROVAL_BADGE[u.approvalStatus] ?? "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {APPROVAL_LABEL[u.approvalStatus] ?? u.approvalStatus}
                            </span>
                          </td>
                          <td className="py-2 pr-2">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                STATUS_BADGE[u.status] ?? "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {STATUS_LABEL[u.status] ?? u.status}
                            </span>
                          </td>
                          <td className="py-2 pr-2 text-muted-foreground">
                            {u.lastLoginAt
                              ? new Date(u.lastLoginAt).toLocaleDateString("ko-KR")
                              : "-"}
                          </td>
                          <td className="py-2">
                            <div className="flex flex-wrap gap-1">
                              {u.approvalStatus === "pending" && (
                                <>
                                  <button
                                    onClick={() => approveMutation.mutate(u.id)}
                                    className="rounded border border-green-300 px-2 py-1 text-[10px] text-green-700 hover:bg-green-50"
                                  >
                                    승인
                                  </button>
                                  <button
                                    onClick={() => rejectMutation.mutate(u.id)}
                                    className="rounded border border-red-300 px-2 py-1 text-[10px] text-red-700 hover:bg-red-50"
                                  >
                                    반려
                                  </button>
                                </>
                              )}
                              {u.approvalStatus === "approved" && u.status === "active" && (
                                <button
                                  onClick={() =>
                                    statusMutation.mutate({ userId: u.id, status: "disabled" })
                                  }
                                  className="rounded border px-2 py-1 text-[10px] hover:bg-muted"
                                >
                                  비활성화
                                </button>
                              )}
                              {u.status === "disabled" && (
                                <button
                                  onClick={() =>
                                    statusMutation.mutate({ userId: u.id, status: "active" })
                                  }
                                  className="rounded border border-green-300 px-2 py-1 text-[10px] text-green-700 hover:bg-green-50"
                                >
                                  활성화
                                </button>
                              )}
                              <button
                                onClick={() => resetPwMutation.mutate(u.id)}
                                className="rounded border px-2 py-1 text-[10px] hover:bg-muted"
                              >
                                PW 초기화
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <PaginationBar pagination={pagination} totalItems={users.length} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
