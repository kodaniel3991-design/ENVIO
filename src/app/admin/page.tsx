"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Users,
  Clock,
  Activity,
  MessageSquareWarning,
  Megaphone,
  CreditCard,
  Shield,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardData {
  kpi: {
    totalOrgs: number;
    activeOrgs: number;
    suspendedOrgs: number;
    terminatedOrgs: number;
    totalUsers: number;
    pendingApproval: number;
    mau: number;
    openTickets: number;
    noticeCount: number;
    planCount: number;
    activeSubscriptions: number;
  };
  recentOrgs: {
    id: number;
    organizationName: string;
    status: string;
    industry?: string;
    userCount: number;
    createdAt: string;
  }[];
  recentPendingUsers: {
    id: string;
    name: string;
    email: string;
    organizationName?: string;
    createdAt: string;
  }[];
  monthlyOrgTrend: { month: string; count: number }[];
  recentAuditLogs: {
    id: number;
    actorName: string;
    action: string;
    targetName?: string;
    createdAt: string;
  }[];
  recentTickets: {
    id: number;
    subject: string;
    status: string;
    priority: string;
    requesterName: string;
    createdAt: string;
  }[];
}

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  suspended: "bg-yellow-100 text-yellow-800",
  terminated: "bg-red-100 text-red-800",
};
const STATUS_LABEL: Record<string, string> = {
  active: "활성",
  suspended: "정지",
  terminated: "해지",
};
const TICKET_PRIORITY_COLOR: Record<string, string> = {
  urgent: "text-red-600",
  high: "text-orange-600",
  normal: "text-blue-600",
  low: "text-gray-500",
};
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
  "user.reset-password": "PW 초기화",
  "security.force-disable": "강제 비활성화",
};

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  if (isLoading || !data) {
    return (
      <>
        <PageHeader title="플랫폼 관리 대시보드" />
        <p className="mt-8 text-sm text-muted-foreground">불러오는 중...</p>
      </>
    );
  }

  const { kpi } = data;

  return (
    <>
      <PageHeader
        title="플랫폼 관리 대시보드"
        description="플랫폼 운영 현황을 한눈에 확인하고 즉시 조치가 필요한 항목을 관리합니다."
      />

      {/* ── 즉시 조치 필요 알림 ── */}
      {(kpi.pendingApproval > 0 || kpi.openTickets > 0) && (
        <div className="mt-6 flex gap-3">
          {kpi.pendingApproval > 0 && (
            <Link href="/admin/users" className="flex-1">
              <div className="flex items-center gap-3 rounded-lg border-2 border-yellow-300 bg-yellow-50 px-4 py-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800">승인 대기 {kpi.pendingApproval}건</p>
                  <p className="text-[11px] text-yellow-700">가입 승인을 기다리는 사용자가 있습니다</p>
                </div>
              </div>
            </Link>
          )}
          {kpi.openTickets > 0 && (
            <Link href="/admin/support" className="flex-1">
              <div className="flex items-center gap-3 rounded-lg border-2 border-red-300 bg-red-50 px-4 py-3">
                <MessageSquareWarning className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-semibold text-red-800">미처리 문의 {kpi.openTickets}건</p>
                  <p className="text-[11px] text-red-700">응답이 필요한 고객 문의가 있습니다</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* ── 핵심 KPI 카드 ── */}
      <div className="mt-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          플랫폼 현황
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            icon={Building2}
            label="가입 기업"
            value={kpi.totalOrgs}
            detail={`활성 ${kpi.activeOrgs} · 정지 ${kpi.suspendedOrgs} · 해지 ${kpi.terminatedOrgs}`}
            href="/admin/organizations"
          />
          <KpiCard
            icon={Users}
            label="등록 사용자"
            value={kpi.totalUsers}
            detail={`승인 대기 ${kpi.pendingApproval}명`}
            href="/admin/users"
            alert={kpi.pendingApproval > 0}
          />
          <KpiCard
            icon={Activity}
            label="MAU (30일)"
            value={kpi.mau}
            detail={`전체 대비 ${kpi.totalUsers > 0 ? Math.round((kpi.mau / kpi.totalUsers) * 100) : 0}%`}
            href="/admin/security"
          />
          <KpiCard
            icon={CreditCard}
            label="활성 구독"
            value={kpi.activeSubscriptions}
            detail={`${kpi.planCount}개 플랜 운영 중`}
            href="/admin/subscriptions"
          />
        </div>
      </div>

      {/* ── 2열: 기업 등록 추이 + 미처리 문의 ── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* 월별 기업 등록 추이 (3칸) */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">월별 기업 등록 추이</CardTitle>
          </CardHeader>
          <CardContent>
            {data.monthlyOrgTrend.length === 0 ? (
              <p className="py-10 text-center text-xs text-muted-foreground">데이터가 없습니다.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.monthlyOrgTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => [`${v}건`, "등록"]} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 미처리 문의 (2칸) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquareWarning className="h-4 w-4" /> 미처리 문의
            </CardTitle>
            <Link href="/admin/support" className="flex items-center gap-1 text-xs text-primary hover:underline">
              전체 보기 <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentTickets.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">미처리 문의가 없습니다.</p>
            ) : (
              <div className="space-y-1.5">
                {data.recentTickets.map((t) => (
                  <Link key={t.id} href="/admin/support" className="block rounded-md px-3 py-2 hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${TICKET_PRIORITY_COLOR[t.priority] ?? ""}`}>
                        {t.priority === "urgent" ? "긴급" : t.priority === "high" ? "높음" : ""}
                      </span>
                      <span className="truncate text-xs font-medium">{t.subject}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {t.requesterName} · {new Date(t.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── 3열: 최근 기업 + 승인 대기 + 활동 로그 ── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* 최근 등록 기업 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">최근 가입 기업</CardTitle>
            <Link href="/admin/organizations" className="flex items-center gap-1 text-xs text-primary hover:underline">
              전체 <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentOrgs.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">등록된 기업이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {data.recentOrgs.map((o) => (
                  <Link key={o.id} href={`/admin/organizations/${o.id}`} className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
                    <div>
                      <p className="text-xs font-medium">{o.organizationName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {o.industry ?? "-"} · {o.userCount}명
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${STATUS_BADGE[o.status] ?? ""}`}>
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(o.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 승인 대기 사용자 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">
              승인 대기
              {kpi.pendingApproval > 0 && (
                <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-800">
                  {kpi.pendingApproval}
                </span>
              )}
            </CardTitle>
            <Link href="/admin/users" className="flex items-center gap-1 text-xs text-primary hover:underline">
              전체 <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentPendingUsers.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">승인 대기 중인 사용자가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {data.recentPendingUsers.map((u) => (
                  <div key={u.id} className="rounded-md px-3 py-2 hover:bg-muted/50">
                    <p className="text-xs font-medium">{u.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {u.email} · {u.organizationName ?? "소속 없음"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 최근 관리 활동 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Shield className="h-4 w-4" /> 관리 활동
            </CardTitle>
            <Link href="/admin/audit-logs" className="flex items-center gap-1 text-xs text-primary hover:underline">
              전체 <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentAuditLogs.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">활동 로그가 없습니다.</p>
            ) : (
              <div className="space-y-1.5">
                {data.recentAuditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between rounded-md px-3 py-1.5 hover:bg-muted/50">
                    <div className="min-w-0 text-xs">
                      <span className="font-medium">{log.actorName}</span>
                      <span className="mx-1 text-muted-foreground">·</span>
                      <span className="text-primary">{ACTION_LABELS[log.action] ?? log.action}</span>
                      {log.targetName && (
                        <span className="ml-1 text-muted-foreground truncate">→ {log.targetName}</span>
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  detail,
  href,
  alert,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  detail?: string;
  href: string;
  alert?: boolean;
}) {
  return (
    <Link href={href}>
      <Card className={`transition-shadow hover:shadow-md ${alert ? "border-yellow-300" : ""}`}>
        <CardContent className="flex items-center gap-4 py-5">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${alert ? "bg-yellow-100" : "bg-muted"}`}>
            <Icon className={`h-5 w-5 ${alert ? "text-yellow-600" : "text-muted-foreground"}`} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold ${alert ? "text-yellow-600" : ""}`}>{value}</p>
            {detail && <p className="truncate text-[10px] text-muted-foreground">{detail}</p>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
