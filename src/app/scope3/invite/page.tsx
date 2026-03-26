"use client";

import { useQuery } from "@tanstack/react-query";
import { getPortalInvitations } from "@/services/api";
import { PageHeader } from "@/components/layout/page-header";
import { PortalSubNav } from "@/components/portal/portal-sub-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";

export default function PortalInvitePage() {
  const { data: invitations, isLoading } = useQuery({
    queryKey: ["portal-invitations"],
    queryFn: getPortalInvitations,
  });
  const statusLabel = (s: string) => (s === "pending" ? "대기" : s === "accepted" ? "수락" : "만료");
  return (
    <>
      <PageHeader title="협력사 초대" description="포털 가입 초대 목록을 확인하고 재발송할 수 있습니다.">
        <PortalSubNav />
      </PageHeader>
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">발송된 초대</CardTitle>
            <p className="text-sm text-muted-foreground">초대 이메일 발송 이력 및 만료일</p>
          </CardHeader>
          <CardContent>
            {isLoading && <Skeleton className="h-40 w-full rounded-lg" />}
            {!isLoading && !invitations?.length && <p className="text-sm text-muted-foreground">발송된 초대가 없습니다.</p>}
            {!isLoading && invitations?.map((inv: any) => (
              <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4 mt-3">
                <div>
                  <p className="font-medium">{inv.vendorName}</p>
                  <p className="text-sm text-muted-foreground">{inv.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">발송: {inv.sentAt.slice(0,10)} / 만료: {inv.expiresAt.slice(0,10)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={inv.status === "pending" ? "warning" : "secondary"}>{statusLabel(inv.status)}</Badge>
                  {inv.status === "pending" && <Button variant="outline" size="sm" className="gap-1"><RefreshCw className="h-3.5 w-3.5" /> 재발송</Button>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
