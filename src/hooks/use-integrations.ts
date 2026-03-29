"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface IntegrationSource {
  id: number;
  name: string;
  source_type: string;
  scope: number | null;
  endpoint: string | null;
  auth_type: string;
  sync_interval: number | null;
  is_active: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync: { status: string; records_saved: number; started_at: string } | null;
  created_at: string;
}

export interface SyncLogEntry {
  id: number;
  status: string;
  records_total: number;
  records_saved: number;
  records_failed: number;
  error_message: string | null;
  duration_ms: number | null;
  started_at: string;
  completed_at: string | null;
}

export interface PreviewData {
  facilityId: string;
  facilityName: string;
  year: number;
  values: number[];
  unit: string;
  source: string;
}

export function useIntegrations(scope?: number) {
  return useQuery({
    queryKey: ["integrations", scope],
    queryFn: async (): Promise<IntegrationSource[]> => {
      const url = scope ? `/api/integrations?scope=${scope}` : "/api/integrations";
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      name: string;
      sourceType: string;
      scope?: number;
      endpoint?: string;
      authType?: string;
      authConfig?: Record<string, string>;
      fieldMapping?: Record<string, string>;
      syncInterval?: number;
    }) => {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("등록 실패");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integrations"] }),
  });
}

export function useTestConnection() {
  return useMutation({
    mutationFn: async (sourceId: number): Promise<{ ok: boolean; message: string }> => {
      const res = await fetch(`/api/integrations/${sourceId}?action=test`);
      return res.json();
    },
  });
}

export function usePreviewData() {
  return useMutation({
    mutationFn: async ({ sourceId, year }: { sourceId: number; year: number }): Promise<PreviewData[]> => {
      const res = await fetch(`/api/integrations/${sourceId}?action=preview&year=${year}`);
      if (!res.ok) throw new Error("미리보기 실패");
      return res.json();
    },
  });
}

export function useSyncIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sourceId, year, facilityId }: { sourceId: number; year: number; facilityId?: string }) => {
      const res = await fetch(`/api/integrations/${sourceId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, facilityId }),
      });
      if (!res.ok) throw new Error("동기화 실패");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integrations"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useSyncLogs(sourceId: number | null) {
  return useQuery({
    queryKey: ["sync-logs", sourceId],
    queryFn: async (): Promise<SyncLogEntry[]> => {
      const res = await fetch(`/api/integrations/${sourceId}/sync?limit=10`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!sourceId,
    staleTime: 1000 * 30,
  });
}
