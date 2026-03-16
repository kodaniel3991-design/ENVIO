"use client";

import Link from "next/link";
import {
  getEnvironmentSummary,
  getSocialSummary,
  getGovernanceSummary,
  getScopeBreakdown,
  getSubmissions,
} from "@/services/api";
import { PageShell, PageSection } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { useDataDashboard } from "@/hooks/use-data-dashboard";
import { ErrorState } from "@/components/common/error-state";

export default function DataManagementLandingPage() {
  const {
    envSummaryQuery,
    socialSummaryQuery,
    govSummaryQuery,
    scopeBreakdownQuery,
    submissionsQuery,
    esgLoading,
    esgErrorMessage,
    scopeErrorMessage,
    submissionsErrorMessage,
  } = useDataDashboard();

  const envSummary = envSummaryQuery.data;
  const socialSummary = socialSummaryQuery.data;
  const govSummary = govSummaryQuery.data;
  const scopeBreakdown = scopeBreakdownQuery.data;
  const submissions = submissionsQuery.data;
  const scopeLoading = scopeBreakdownQuery.isLoading;
  const submissionsLoading = submissionsQuery.isLoading;
  const submittedCount =
    submissions?.filter(
      (s) => s.status === "verified" || s.status === "submitted"
    ).length ?? 0;
  const totalVendors = submissions?.length ?? 0;

  return (
    <PageShell
      title="데이터 관리"
      description="ESG 데이터 현황, 배출량 입력 현황, 공급망 제출 현황을 한눈에 확인합니다."
      data-page="data-management"
    >
      <div className="space-y-10">
        <PageSection
          title="ESG 데이터 현황"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/data/esg/environment">
                자세히 보기 <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          }
        >
          <Card>
            <CardHeader className="pb-2">
              <p className="text-sm text-muted-foreground">
                환경·사회·거버넌스 요약 지표
              </p>
            </CardHeader>
            <CardContent>
              {esgLoading ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : esgErrorMessage ? (
                <ErrorState
                  message={esgErrorMessage}
                  onRetry={() => {
                    envSummaryQuery.refetch();
                    socialSummaryQuery.refetch();
                    govSummaryQuery.refetch();
                  }}
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      환경 (E)
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {envSummary?.slice(0, 3).map((item, i) => (
                        <span
                          key={i}
                          className="text-sm font-medium text-foreground"
                        >
                          {item.label}: {String(item.value)}
                          {item.unit ?? ""}
                        </span>
                      ))}
                    </div>
                    <Link
                      href="/data/esg/environment"
                      className="mt-2 inline-block text-xs text-primary hover:underline"
                    >
                      환경 데이터 →
                    </Link>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      사회 (S)
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {socialSummary?.slice(0, 3).map((item, i) => (
                        <span
                          key={i}
                          className="text-sm font-medium text-foreground"
                        >
                          {item.label}: {String(item.value)}
                          {item.unit ?? ""}
                        </span>
                      ))}
                    </div>
                    <Link
                      href="/data/esg/social"
                      className="mt-2 inline-block text-xs text-primary hover:underline"
                    >
                      사회 데이터 →
                    </Link>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      거버넌스 (G)
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {govSummary?.slice(0, 3).map((item, i) => (
                        <span
                          key={i}
                          className="text-sm font-medium text-foreground"
                        >
                          {item.label}: {String(item.value)}
                          {item.unit ?? ""}
                        </span>
                      ))}
                    </div>
                    <Link
                      href="/data/esg/governance"
                      className="mt-2 inline-block text-xs text-primary hover:underline"
                    >
                      거버넌스 데이터 →
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </PageSection>

        <PageSection
          title="배출량 입력 현황"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/data/emissions/scope1">
                자세히 보기 <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          }
        >
          <Card>
            <CardHeader className="pb-2">
              <p className="text-sm text-muted-foreground">
                Scope 1·2·3 배출량 요약 (tCO₂e)
              </p>
            </CardHeader>
            <CardContent>
              {scopeLoading ? (
                <div className="flex gap-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-28" />
                  ))}
                </div>
              ) : scopeErrorMessage ? (
                <ErrorState
                  message={scopeErrorMessage}
                  onRetry={() => scopeBreakdownQuery.refetch()}
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                  {scopeBreakdown?.map((scope) => (
                    <Link
                      key={scope.scope}
                      href={`/data/emissions/${scope.scope}`}
                      className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
                    >
                      <p className="text-xs font-medium text-muted-foreground">
                        {scope.label}
                      </p>
                      <p className="mt-1 text-xl font-semibold text-foreground">
                        {scope.value.toLocaleString()} tCO₂e
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        전체의 {scope.percent}%
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </PageSection>

        <PageSection
          title="공급망 제출 현황"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/data/supply-chain/submissions">
                자세히 보기 <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          }
        >
          <Card>
            <CardHeader className="pb-2">
              <p className="text-sm text-muted-foreground">
                협력사별 데이터 제출·검증 상태
              </p>
            </CardHeader>
            <CardContent>
              {submissionsLoading ? (
                <Skeleton className="h-24" />
              ) : submissionsErrorMessage ? (
                <ErrorState
                  message={submissionsErrorMessage}
                  onRetry={() => submissionsQuery.refetch()}
                />
              ) : (
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      제출 완료 (검증 포함)
                    </p>
                    <p className="text-2xl font-semibold text-foreground">
                      {submittedCount} / {totalVendors}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        협력사
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      진행 중 / 미시작
                    </p>
                    <p className="text-2xl font-semibold text-foreground">
                      {totalVendors - submittedCount}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        협력사
                      </span>
                    </p>
                  </div>
                  <Link
                    href="/data/supply-chain/vendors"
                    className="text-sm text-primary hover:underline"
                  >
                    협력사 관리 →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </PageSection>
      </div>
    </PageShell>
  );
}
