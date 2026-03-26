"use client";

import { useQuery } from "@tanstack/react-query";
import { getReportTemplates } from "@/services/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportTemplatesPage() {
  const { data: templates, isLoading } = useQuery({
    queryKey: ["report-templates"],
    queryFn: getReportTemplates,
  });

  return (
    <>
      <PageHeader
        title="템플릿 관리"
        description="보고서 템플릿을 관리하고 기본 템플릿을 설정합니다."
      />
      <div className="mt-8">
        {isLoading || !templates ? (
          <Skeleton className="h-40 w-full rounded-lg" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t: any) => (
              <Card key={t.id}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  {t.isDefault && <Badge variant="success">기본</Badge>}
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>{t.description}</p>
                  <p>프레임워크: {t.framework}</p>
                  {t.lastUsedAt && <p>최근 사용: {t.lastUsedAt}</p>}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline">
                      복제
                    </Button>
                    <Button size="sm" variant="outline">
                      편집
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
