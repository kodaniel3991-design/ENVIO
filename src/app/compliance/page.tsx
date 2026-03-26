"use client";

import { useQuery } from "@tanstack/react-query";
import { getComplianceStatus } from "@/services/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck } from "lucide-react";
import { ErrorState } from "@/components/common/error-state";
import { getApiErrorMessage } from "@/hooks/use-api-error";
import {
  COMPLIANCE_STATUS_LABEL,
  COMPLIANCE_STATUS_VARIANT,
} from "@/lib/constants/status-badges";

export default function ComplianceStatusPage() {
  const { data: items, isLoading, error, isError, refetch } = useQuery({
    queryKey: ["compliance"],
    queryFn: getComplianceStatus,
  });

  return (
    <>
      <PageHeader
        title="Compliance Status"
        description="Regulatory and voluntary framework alignment."
      />

      <div className="mt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Framework requirements</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Current status per requirement; update when assessments are
              completed.
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : isError ? (
              <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />
            ) : (
              <div className="space-y-0 divide-y divide-border">
                {items?.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0"
                  >
                    <div>
                      <p className="font-medium">{item.framework}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.requirement}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          Due {item.dueDate}
                        </span>
                      )}
                      <Badge variant={COMPLIANCE_STATUS_VARIANT[item.status] ?? "secondary"}>
                        {COMPLIANCE_STATUS_LABEL[item.status] ?? item.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Checked {item.lastChecked}
                      </span>
                    </div>
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
