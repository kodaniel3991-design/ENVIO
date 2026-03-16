"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getDashboardKpis,
  getDashboardTrendData,
  getScopeDonutData,
  getOffsetSummary,
  getTopVendorEmissions,
  getDashboardInsights,
  getDashboardNotifications,
} from "@/services/api";
import { queryKeys } from "@/lib/query-keys";
import { useApiErrorMessage } from "@/hooks/use-api-error";

export function useDashboardData() {
  const kpisQuery = useQuery({
    queryKey: queryKeys.dashboard.kpis,
    queryFn: getDashboardKpis,
  });
  const trendQuery = useQuery({
    queryKey: queryKeys.dashboard.trend,
    queryFn: getDashboardTrendData,
  });
  const scopeDonutQuery = useQuery({
    queryKey: queryKeys.dashboard.scopeDonut,
    queryFn: getScopeDonutData,
  });
  const offsetSummaryQuery = useQuery({
    queryKey: queryKeys.dashboard.offsetSummary,
    queryFn: getOffsetSummary,
  });
  const topVendorsQuery = useQuery({
    queryKey: queryKeys.dashboard.topVendors,
    queryFn: getTopVendorEmissions,
  });
  const insightsQuery = useQuery({
    queryKey: queryKeys.dashboard.insights,
    queryFn: getDashboardInsights,
  });
  const notificationsQuery = useQuery({
    queryKey: queryKeys.dashboard.notifications,
    queryFn: getDashboardNotifications,
  });

  const isLoading =
    kpisQuery.isLoading ||
    trendQuery.isLoading ||
    scopeDonutQuery.isLoading;

  const firstError =
    kpisQuery.error ??
    trendQuery.error ??
    scopeDonutQuery.error ??
    offsetSummaryQuery.error ??
    topVendorsQuery.error ??
    insightsQuery.error ??
    notificationsQuery.error ??
    null;

  const errorMessage = useApiErrorMessage(firstError);

  return {
    kpisQuery,
    trendQuery,
    scopeDonutQuery,
    offsetSummaryQuery,
    topVendorsQuery,
    insightsQuery,
    notificationsQuery,
    isLoading,
    firstError,
    errorMessage,
  };
}
