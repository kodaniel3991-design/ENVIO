"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Clock, LogIn, UserX } from "lucide-react";

interface SecurityData {
  activeSessions: {
    userId: string;
    userName: string;
    email: string;
    lastLoginAt?: string;
    isPlatformAdmin: boolean;
  }[];
  recentLogins: {
    id: number;
    actorName: string;
    createdAt: string;
  }[];
  disabledUsers: number;
  totalUsers: number;
}

export default function AdminSecurityPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<SecurityData>({
    queryKey: ["admin-security"],
    queryFn: async () => {
      const res = await fetch("/api/admin/security");
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const forceLogoutMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch("/api/admin/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "force-disable", userId }),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-security"] }),
  });

  const activeSessions = data?.activeSessions ?? [];
  const recentLogins = data?.recentLogins ?? [];

  return (
    <>
      <PageHeader
        title="접근 제어 / 보안"
        description="활성 세션, 로그인 이력, 계정 보안을 관리합니다."
      />

      {isLoading || !data ? (
        <p className="mt-8 text-sm text-muted-foreground">불러오는 중...</p>
      ) : (
        <>
          {/* 요약 카드 */}
          <div className="mt-6 grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <LogIn className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">활성 세션 (24h)</p>
                  <p className="text-xl font-bold">{activeSessions.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">전체 사용자</p>
                  <p className="text-xl font-bold">{data.totalUsers}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <UserX className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-xs text-muted-foreground">비활성 계정</p>
                  <p className="text-xl font-bold text-red-600">{data.disabledUsers}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">최근 로그인</p>
                  <p className="text-xl font-bold">{recentLogins.length}건</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* 활성 세션 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  활성 세션 (최근 24시간 로그인)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeSessions.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">활성 세션이 없습니다.</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="pb-2 pr-2 font-medium">사용자</th>
                        <th className="pb-2 pr-2 font-medium">이메일</th>
                        <th className="pb-2 pr-2 font-medium">마지막 로그인</th>
                        <th className="w-20 pb-2 font-medium">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {activeSessions.map((s) => (
                        <tr key={s.userId} className="hover:bg-muted/50">
                          <td className="py-2 pr-2 font-medium">
                            {s.userName}
                            {s.isPlatformAdmin && (
                              <span className="ml-1 rounded bg-purple-100 px-1 py-0.5 text-[9px] text-purple-700">관리자</span>
                            )}
                          </td>
                          <td className="py-2 pr-2 text-muted-foreground">{s.email}</td>
                          <td className="py-2 pr-2 text-muted-foreground">
                            {s.lastLoginAt
                              ? new Date(s.lastLoginAt).toLocaleString("ko-KR", {
                                  month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
                                })
                              : "-"}
                          </td>
                          <td className="py-2">
                            {!s.isPlatformAdmin && (
                              <button
                                onClick={() => forceLogoutMutation.mutate(s.userId)}
                                className="rounded border border-red-300 px-2 py-1 text-[10px] text-red-700 hover:bg-red-50"
                              >
                                비활성화
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            {/* 최근 로그인 이력 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">최근 로그인 이력 (7일)</CardTitle>
              </CardHeader>
              <CardContent>
                {recentLogins.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">로그인 기록이 없습니다.</p>
                ) : (
                  <div className="space-y-1">
                    {recentLogins.map((l) => (
                      <div key={l.id} className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <LogIn className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-xs font-medium">{l.actorName}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(l.createdAt).toLocaleString("ko-KR", {
                            month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
