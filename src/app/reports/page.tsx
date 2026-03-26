"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getReportTemplates,
  getReportReadiness,
  getReportHistory,
} from "@/services/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Download } from "lucide-react";

export default function ReportGenerationPage() {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);
  const { data: templates, isLoading: tLoading } = useQuery({
    queryKey: ["report-templates"],
    queryFn: getReportTemplates,
  });
  const { data: readiness, isLoading: rLoading } = useQuery({
    queryKey: ["report-readiness"],
    queryFn: getReportReadiness,
  });
  const { data: history, isLoading: hLoading } = useQuery({
    queryKey: ["report-history"],
    queryFn: getReportHistory,
  });

  return (
    <>
      <PageHeader
        title="보고서 생성"
        description="보고서 유형, 기간, 템플릿을 선택해 ESG 보고서를 생성합니다."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[2fr,1.5fr]">
        <section className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">생성 옵션</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">
                  보고서 유형
                </p>
                <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                  <option>ESG</option>
                  <option>K-ESG</option>
                  <option>GRI</option>
                  <option>ISSB</option>
                  <option>CSRD</option>
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    보고 기간
                  </p>
                  <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                    {years.map((y) => (
                      <option key={y}>{`FY ${y}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    사업장
                  </p>
                  <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                    <option>전체</option>
                    <option>본사</option>
                    <option>데이터센터</option>
                  </select>
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">포함 챕터</p>
                <div className="flex flex-wrap gap-2">
                  {["개요", "전략·거버넌스", "환경", "사회", "거버넌스"].map(
                    (c) => (
                      <button
                        key={c}
                        className="rounded-full bg-muted px-3 py-1 text-xs"
                        type="button"
                      >
                        {c}
                      </button>
                    )
                  )}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">템플릿</p>
                {tLoading ? (
                  <Skeleton className="h-16 w-full rounded-md" />
                ) : (
                  <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                    {templates?.map((t: any) => (
                      <option key={t.id}>
                        {t.name} ({t.framework})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">보고서 미리보기</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>선택한 유형·기간·템플릿 기준으로 목차와 요약이 표시됩니다.</p>
              <div className="h-32 rounded-md border border-dashed border-border" />
              <div className="flex flex-wrap gap-2">
                <Button size="sm">생성</Button>
                <Button size="sm" variant="outline">
                  <Download className="mr-1 h-4 w-4" />
                  PDF
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="mr-1 h-4 w-4" />
                  Word
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="mr-1 h-4 w-4" />
                  PPT
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">준비도 요약</CardTitle>
            </CardHeader>
            <CardContent>
              {rLoading || !readiness ? (
                <Skeleton className="h-32 w-full rounded-lg" />
              ) : (
                <ul className="space-y-2 text-sm">
                  {readiness.map((r: any) => (
                    <li
                      key={r.framework}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                    >
                      <span className="font-medium">{r.framework}</span>
                      <span className="text-xs text-muted-foreground">
                        준비도 {r.readinessPercent}% · 프레임워크 충족률{" "}
                        {r.coveragePercent}% · 누락 KPI {r.missingKpiCount}개
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      <div className="mt-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">보고서 생성 이력</CardTitle>
          </CardHeader>
          <CardContent>
            {hLoading || !history ? (
              <Skeleton className="h-32 w-full rounded-lg" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">제목</th>
                      <th className="px-4 py-3 font-medium">프레임워크</th>
                      <th className="px-4 py-3 font-medium">기간</th>
                      <th className="px-4 py-3 font-medium">생성일</th>
                      <th className="px-4 py-3 font-medium">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h: any) => (
                      <tr
                        key={h.id}
                        className="border-b border-border/50 hover:bg-muted/20"
                      >
                        <td className="px-4 py-3 font-medium">{h.title}</td>
                        <td className="px-4 py-3">{h.framework}</td>
                        <td className="px-4 py-3">{h.period}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {h.createdAt}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              h.status === "generated" ? "success" : "secondary"
                            }
                          >
                            {h.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
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
