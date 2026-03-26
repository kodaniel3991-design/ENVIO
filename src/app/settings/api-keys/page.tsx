"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDistanceApiSettings, saveDistanceApiSettings } from "@/services/api";
import type { DistanceApiProvider, DistanceApiSettings } from "@/types";
import { Save } from "lucide-react";
import { toast } from "sonner";

const inputClass =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring";

export default function ApiKeysPage() {
  const queryClient = useQueryClient();

  const { data: distanceSettings } = useQuery({
    queryKey: ["commute-distance-api-settings"],
    queryFn: getDistanceApiSettings,
  });

  const saveDistanceSettingsMutation = useMutation({
    mutationFn: saveDistanceApiSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commute-distance-api-settings"] });
      toast.success("저장되었습니다.");
    },
  });

  const [form, setForm] = useState<DistanceApiSettings>({
    provider: "none",
    enabled: false,
    baseUrl: "",
    apiKey: "",
  });

  useEffect(() => {
    if (!distanceSettings) return;
    setForm({
      provider: distanceSettings.provider ?? "none",
      enabled: !!distanceSettings.enabled,
      baseUrl: distanceSettings.baseUrl ?? "",
      apiKey: distanceSettings.apiKey ?? "",
    });
  }, [distanceSettings]);

  const handleSave = async () => {
    await saveDistanceSettingsMutation.mutateAsync({
      provider: form.provider,
      enabled: !!form.enabled,
      baseUrl: form.baseUrl?.trim() || undefined,
      apiKey: form.apiKey?.trim() || undefined,
    });
  };

  return (
    <>
      <PageHeader
        title="API 키 관리"
        description="외부 연동·API 키 발급 및 만료 관리를 합니다."
      />

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">거리 산출 API 설정</CardTitle>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saveDistanceSettingsMutation.isPending}
          >
            <Save className="mr-1 h-4 w-4" />
            {saveDistanceSettingsMutation.isPending ? "저장 중..." : "저장"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              id="distance-api-enabled"
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.checked }))}
              className="h-4 w-4"
            />
            <label htmlFor="distance-api-enabled" className="text-sm font-medium">
              거리 산출 API 사용
            </label>
            <span className="text-xs text-muted-foreground">
              (현재는 demo 값으로 산출되며, 추후 실제 API 호출로 교체 가능)
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Provider</label>
              <select
                value={form.provider}
                onChange={(e) => setForm((p) => ({ ...p, provider: e.target.value as DistanceApiProvider }))}
                className={inputClass}
              >
                <option value="none">미사용</option>
                <option value="kakao">Kakao</option>
                <option value="naver">Naver</option>
                <option value="google">Google</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">API Key</label>
              <input
                value={form.apiKey ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, apiKey: e.target.value }))}
                placeholder="API Key"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Base URL (Custom)</label>
              <input
                value={form.baseUrl ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, baseUrl: e.target.value }))}
                placeholder="https://example.com/distance"
                className={inputClass}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
