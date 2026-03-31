"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
} from "lucide-react";

interface MonitoringData {
  syncLogs: {
    id: number;
    sourceName: string;
    sourceType: string;
    status: string;
    recordsTotal: number;
    recordsSaved: number;
    recordsFailed: number;
    errorMessage?: string;
    durationMs?: number;
    startedAt: string;
    completedAt?: string;
  }[];
  integrationSources: {
    id: number;
    name: string;
    sourceType: string;
    isActive: boolean;
    lastSyncAt?: string;
    lastSyncStatus?: string;
    syncCount: number;
  }[];
  dbStats: Record<string, number>;
}

const STATUS_ICON: Record<string, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  partial: AlertTriangle,
};

const STATUS_COLOR: Record<string, string> = {
  success: "text-green-600",
  error: "text-red-600",
  partial: "text-yellow-600",
};

const STATUS_LABEL: Record<string, string> = {
  success: "성공",
  error: "실패",
  partial: "일부 실패",
};

const DB_TABLE_LABELS: Record<string, string> = {
  organizations: "기업",
  users: "사용자",
  worksites: "사업장",
  emissionFacilities: "배출원",
  activityData: "활동 데이터",
  emissionFactors: "배출계수",
  kpiMasters: "KPI",
  vendors: "협력사",
  reports: "보고서",
  auditLogs: "감사 로그",
};

export default function AdminMonitoringPage() {
  const { data, isLoading } = useQuery<MonitoringData>({
    queryKey: ["admin-monitoring"],
    queryFn: async () => {
      const res = await fetch("/api/admin/monitoring");
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    refetchInterval: 30000,
  });

  return (
    <>
      <PageHeader
        title="시스템 모니터링"
        description="데이터 연동 현황, 동기화 이력, DB 통계를 확인합니다."
      />

      {isLoading || !data ? (
        <p className="mt-8 text-sm text-muted-foreground">불러오는 중...</p>
      ) : (
        <>
          {/* DB 통계 */}
          <div className="mt-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Database className="h-4 w-4" /> 데이터베이스 현황
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {Object.entries(data.dbStats).map(([key, count]) => (
                    <div
                      key={key}
                      className="rounded-lg border border-border px-4 py-3 text-center"
                    >
                      <p className="text-xs text-muted-foreground">
                        {DB_TABLE_LABELS[key] ?? key}
                      </p>
                      <p className="mt-1 text-xl font-bold">{count.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 연동 소스 현황 */}
          <div className="mt-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Server className="h-4 w-4" /> 데이터 연동 소스
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.integrationSources.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    등록된 연동 소스가 없습니다.
                  </p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="pb-2 pr-2 font-medium">소스명</th>
                        <th className="pb-2 pr-2 font-medium">유형</th>
                        <th className="w-16 pb-2 pr-2 text-center font-medium">상태</th>
                        <th className="pb-2 pr-2 font-medium">마지막 동기화</th>
                        <th className="w-16 pb-2 pr-2 text-center font-medium">결과</th>
                        <th className="w-20 pb-2 text-center font-medium">실행 횟수</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {data.integrationSources.map((s) => {
                        const SIcon = STATUS_ICON[s.lastSyncStatus ?? ""] ?? RefreshCw;
                        return (
                          <tr key={s.id} className="hover:bg-muted/50">
                            <td className="py-2 pr-2 font-medium">{s.name}</td>
                            <td className="py-2 pr-2 text-muted-foreground">{s.sourceType}</td>
                            <td className="py-2 pr-2 text-center">
                              {s.isActive ? (
                                <span className="text-green-600">활성</span>
                              ) : (
                                <span className="text-gray-400">비활성</span>
                              )}
                            </td>
                            <td className="py-2 pr-2 text-muted-foreground">
                              {s.lastSyncAt
                                ? new Date(s.lastSyncAt).toLocaleString("ko-KR")
                                : "-"}
                            </td>
                            <td className="py-2 pr-2 text-center">
                              {s.lastSyncStatus ? (
                                <SIcon
                                  className={`inline h-4 w-4 ${STATUS_COLOR[s.lastSyncStatus] ?? ""}`}
                                />
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="py-2 text-center">{s.syncCount}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 동기화 실행 이력 */}
          <div className="mt-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <RefreshCw className="h-4 w-4" /> 최근 동기화 이력
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.syncLogs.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    동기화 이력이 없습니다.
                  </p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="pb-2 pr-2 font-medium">소스</th>
                        <th className="w-16 pb-2 pr-2 text-center font-medium">결과</th>
                        <th className="w-20 pb-2 pr-2 text-center font-medium">전체</th>
                        <th className="w-20 pb-2 pr-2 text-center font-medium">성공</th>
                        <th className="w-20 pb-2 pr-2 text-center font-medium">실패</th>
                        <th className="w-20 pb-2 pr-2 text-center font-medium">소요시간</th>
                        <th className="pb-2 font-medium">시작 시간</th>
                        <th className="pb-2 font-medium">오류</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {data.syncLogs.map((l) => {
                        const SIcon = STATUS_ICON[l.status] ?? RefreshCw;
                        return (
                          <tr key={l.id} className="hover:bg-muted/50">
                            <td className="py-2 pr-2 font-medium">{l.sourceName}</td>
                            <td className="py-2 pr-2 text-center">
                              <span className="flex items-center justify-center gap-1">
                                <SIcon
                                  className={`h-3.5 w-3.5 ${STATUS_COLOR[l.status] ?? ""}`}
                                />
                                <span className={`text-[10px] ${STATUS_COLOR[l.status] ?? ""}`}>
                                  {STATUS_LABEL[l.status] ?? l.status}
                                </span>
                              </span>
                            </td>
                            <td className="py-2 pr-2 text-center">{l.recordsTotal}</td>
                            <td className="py-2 pr-2 text-center text-green-600">
                              {l.recordsSaved}
                            </td>
                            <td className="py-2 pr-2 text-center text-red-600">
                              {l.recordsFailed}
                            </td>
                            <td className="py-2 pr-2 text-center text-muted-foreground">
                              {l.durationMs ? `${(l.durationMs / 1000).toFixed(1)}s` : "-"}
                            </td>
                            <td className="py-2 pr-2 text-muted-foreground">
                              {new Date(l.startedAt).toLocaleString("ko-KR", {
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="max-w-[200px] truncate py-2 text-red-500" title={l.errorMessage ?? ""}>
                              {l.errorMessage ?? "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
