"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  User,
  Building2,
  LogIn,
  KeyRound,
  Settings,
} from "lucide-react";

const inputClass =
  "h-8 w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1 text-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring";

interface AuditLogItem {
  id: number;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  targetName?: string;
  detail?: string;
  ipAddress?: string;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  "auth.login": "로그인",
  "org.create": "기업 등록",
  "org.update": "기업 수정",
  "org.active": "기업 활성화",
  "org.suspended": "기업 정지",
  "org.terminated": "기업 해지",
  "user.approve": "사용자 승인",
  "user.reject": "사용자 반려",
  "user.active": "사용자 활성화",
  "user.disabled": "사용자 비활성화",
  "user.reset-password": "비밀번호 초기화",
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  auth: LogIn,
  org: Building2,
  user: User,
};

const TARGET_TYPE_TABS = [
  { value: "", label: "전체" },
  { value: "user", label: "사용자" },
  { value: "organization", label: "기업" },
];

export default function AdminAuditLogsPage() {
  const [targetType, setTargetType] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 30;

  const { data, isLoading } = useQuery<{ items: AuditLogItem[]; total: number }>({
    queryKey: ["admin-audit-logs", targetType, search, page],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (targetType) sp.set("targetType", targetType);
      if (search) sp.set("search", search);
      sp.set("limit", String(pageSize));
      sp.set("offset", String(page * pageSize));
      const res = await fetch(`/api/admin/audit-logs?${sp.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const logs = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <PageHeader
        title="감사 로그"
        description="플랫폼 관리자의 활동 이력을 확인합니다."
      />

      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-col space-y-2 pb-3">
            <CardTitle className="text-sm font-semibold">
              활동 로그{" "}
              <span className="font-normal text-muted-foreground">({total}건)</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder="검색 (이름/대상/상세)"
                className={inputClass + " max-w-xs"}
              />
              <div className="flex rounded-md border border-border">
                {TARGET_TYPE_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => { setTargetType(tab.value); setPage(0); }}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      targetType === tab.value
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
            ) : logs.length === 0 ? (
              <p className="py-10 text-center text-xs text-muted-foreground">
                기록된 활동 로그가 없습니다.
              </p>
            ) : (
              <>
                <div className="space-y-1">
                  {logs.map((log) => {
                    const actionPrefix = log.action.split(".")[0];
                    const Icon = ACTION_ICONS[actionPrefix] ?? Shield;
                    const actionLabel = ACTION_LABELS[log.action] ?? log.action;

                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 rounded-md px-3 py-2.5 hover:bg-muted/50"
                      >
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs">
                            <span className="font-medium">{log.actorName}</span>
                            <span className="text-muted-foreground">{" — "}</span>
                            <span className="font-medium text-primary">{actionLabel}</span>
                            {log.targetName && (
                              <>
                                <span className="text-muted-foreground">{" → "}</span>
                                <span className="font-medium">{log.targetName}</span>
                              </>
                            )}
                          </p>
                          {log.detail && (
                            <p className="mt-0.5 text-[11px] text-muted-foreground">{log.detail}</p>
                          )}
                        </div>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString("ko-KR", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="rounded border px-3 py-1 text-xs disabled:opacity-40"
                    >
                      이전
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {page + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="rounded border px-3 py-1 text-xs disabled:opacity-40"
                    >
                      다음
                    </button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
