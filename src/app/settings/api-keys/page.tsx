"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// DB 연동 거리 API 설정
const getDistanceApiSettings = async (): Promise<DistanceApiSettings> => {
  const res = await fetch("/api/distance");
  if (!res.ok) return { provider: "none", enabled: false };
  return res.json();
};
const saveDistanceApiSettings = async (s: DistanceApiSettings) => {
  const res = await fetch("/api/distance", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(s),
  });
  return res.json();
};
import type { DistanceApiProvider, DistanceApiSettings } from "@/types";
import type { IntegrationSource } from "@/hooks/use-integrations";
import { cn } from "@/lib/utils";
import {
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Plug,
  MapPin,
  TestTube,
  Eye,
  EyeOff,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

const inputClass =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring";

/* ── 소스 타입 정의 ── */
const SOURCE_TYPES = [
  { value: "kepco", label: "KEPCO (한국전력)", scope: 2, defaultEndpoint: "https://apis.data.go.kr/B552113/ElectricityUsageService", description: "한국전력공사 전력사용량 → Scope 2 활동 데이터" },
  { value: "district_heat", label: "지역난방공사", scope: 2, defaultEndpoint: "", description: "지역난방 증기/열 사용량 → Scope 2 활동 데이터" },
  { value: "emission_engine", label: "Emission Engine", scope: 1, defaultEndpoint: "", description: "연소 활동 데이터 → Scope 1 배출량 산정" },
  { value: "supplier_portal", label: "Supplier Portal", scope: 3, defaultEndpoint: "", description: "공급망 배출 데이터 → Scope 3 활동 데이터" },
  { value: "custom", label: "커스텀 API", scope: null, defaultEndpoint: "", description: "사용자 정의 외부 API" },
];

const SCOPE_BADGE: Record<number, { label: string; color: string }> = {
  1: { label: "Scope 1", color: "bg-taupe-50 text-taupe-600 border-taupe-200" },
  2: { label: "Scope 2", color: "bg-green-50 text-carbon-success border-green-200" },
  3: { label: "Scope 3", color: "bg-sky-50 text-sky-600 border-sky-200" },
};

export default function ApiKeysPage() {
  const queryClient = useQueryClient();

  /* ── 1. 거리 산출 API ── */
  const { data: distanceSettings } = useQuery({
    queryKey: ["commute-distance-api-settings"],
    queryFn: getDistanceApiSettings,
  });

  const saveDistanceMutation = useMutation({
    mutationFn: saveDistanceApiSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commute-distance-api-settings"] });
      toast.success("거리 API 설정이 저장되었습니다.");
    },
  });

  const [distForm, setDistForm] = useState<DistanceApiSettings>({
    provider: "none",
    enabled: false,
    baseUrl: "",
    apiKey: "",
  });

  useEffect(() => {
    if (!distanceSettings) return;
    setDistForm({
      provider: distanceSettings.provider ?? "none",
      enabled: !!distanceSettings.enabled,
      baseUrl: distanceSettings.baseUrl ?? "",
      apiKey: distanceSettings.apiKey ?? "",
    });
  }, [distanceSettings]);

  /* ── 2. 배출 데이터 API 소스 ── */
  const { data: integrationSources = [], isLoading: sourcesLoading } = useQuery({
    queryKey: ["integrations"],
    queryFn: async (): Promise<IntegrationSource[]> => {
      const res = await fetch("/api/integrations");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [newType, setNewType] = useState("");
  const [newName, setNewName] = useState("");
  const [newEndpoint, setNewEndpoint] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set());

  // 편집 상태
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editEndpoint, setEditEndpoint] = useState("");
  const [editApiKey, setEditApiKey] = useState("");

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("등록 실패");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("API 소스가 등록되었습니다.");
      setShowAddForm(false);
      setNewType("");
      setNewName("");
      setNewEndpoint("");
      setNewApiKey("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch("/api/integrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("수정 실패");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("API 설정이 저장되었습니다.");
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/integrations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("삭제 실패");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("API 소스가 삭제되었습니다.");
    },
  });

  const testMutation = useMutation({
    mutationFn: async (id: number): Promise<{ ok: boolean; message: string }> => {
      const res = await fetch(`/api/integrations/${id}?action=test`);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.ok) toast.success(data.message);
      else toast.error(data.message);
    },
  });

  const handleCreate = () => {
    if (!newType || !newName) return;
    const srcDef = SOURCE_TYPES.find((s) => s.value === newType);
    createMutation.mutate({
      name: newName,
      sourceType: newType,
      scope: srcDef?.scope ?? null,
      endpoint: newEndpoint || srcDef?.defaultEndpoint || null,
      authType: "api_key",
      authConfig: newApiKey ? { apiKey: newApiKey } : { apiKey: "MOCK" },
    });
  };

  const handleUpdate = (id: number) => {
    updateMutation.mutate({
      id,
      endpoint: editEndpoint,
      authConfig: editApiKey ? { apiKey: editApiKey } : { apiKey: "MOCK" },
    });
  };

  const startEdit = (source: IntegrationSource) => {
    setEditingId(source.id);
    setEditEndpoint(source.endpoint ?? "");
    setEditApiKey("");
  };

  const toggleKeyVisibility = (id: number) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <PageHeader
        title="API 키 관리"
        description="외부 연동 API 키를 중앙에서 관리합니다. 배출량 관리 > API 연동 탭에서 여기 등록된 소스를 참조합니다."
      />

      <div className="mt-6 space-y-6">
        {/* ════════ 섹션 1: 배출 데이터 API 소스 ════════ */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                배출 데이터 API 소스
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                KEPCO, Emission Engine 등 Scope 1·2·3 활동 데이터를 수집하는 외부 API
              </p>
            </div>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              소스 추가
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* 새 소스 등록 폼 */}
            {showAddForm && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                <span className="text-xs font-semibold text-foreground">새 API 소스 등록</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">소스 타입 *</label>
                    <Select value={newType} onValueChange={(v) => {
                      setNewType(v);
                      const t = SOURCE_TYPES.find((s) => s.value === v);
                      setNewName(t?.label ?? "");
                      setNewEndpoint(t?.defaultEndpoint ?? "");
                    }}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOURCE_TYPES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            <span className="flex items-center gap-2">
                              {s.label}
                              {s.scope && (
                                <span className={cn("rounded px-1 py-0.5 text-[9px] font-medium border", SCOPE_BADGE[s.scope].color)}>
                                  {SCOPE_BADGE[s.scope].label}
                                </span>
                              )}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">소스 이름 *</label>
                    <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="예: 본사 전력" className={cn(inputClass, "h-8 text-xs")} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">API Endpoint</label>
                    <input value={newEndpoint} onChange={(e) => setNewEndpoint(e.target.value)} placeholder="https://..." className={cn(inputClass, "h-8 text-xs")} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">API Key</label>
                    <input type="password" value={newApiKey} onChange={(e) => setNewApiKey(e.target.value)} placeholder="비워두면 시뮬레이션 모드" className={cn(inputClass, "h-8 text-xs")} />
                  </div>
                </div>
                {newType && (
                  <p className="text-[11px] text-muted-foreground">
                    {SOURCE_TYPES.find((s) => s.value === newType)?.description}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowAddForm(false)}>취소</Button>
                  <Button size="sm" className="text-xs gap-1" onClick={handleCreate} disabled={!newType || !newName || createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    등록
                  </Button>
                </div>
              </div>
            )}

            {/* 소스 목록 */}
            {sourcesLoading ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 로딩 중...
              </div>
            ) : integrationSources.length === 0 && !showAddForm ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Plug className="mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">등록된 API 소스가 없습니다</p>
                <p className="text-xs text-muted-foreground">&quot;소스 추가&quot;로 시작하세요</p>
              </div>
            ) : (
              <div className="space-y-2">
                {integrationSources.map((source) => {
                  const isEditing = editingId === source.id;
                  const scopeBadge = source.scope ? SCOPE_BADGE[source.scope] : null;
                  const isTesting = testMutation.isPending && testMutation.variables === source.id;
                  const keyVisible = visibleKeys.has(source.id);

                  return (
                    <div key={source.id} className="rounded-lg border border-border p-4 space-y-3">
                      {/* 헤더 행 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            source.is_active ? "bg-carbon-success" : "bg-muted-foreground/30",
                          )} />
                          <span className="text-sm font-semibold text-foreground">{source.name}</span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {source.source_type}
                          </span>
                          {scopeBadge && (
                            <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium border", scopeBadge.color)}>
                              {scopeBadge.label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-[11px]" onClick={() => testMutation.mutate(source.id)} disabled={isTesting}>
                            {isTesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <TestTube className="h-3 w-3" />}
                            테스트
                          </Button>
                          {!isEditing ? (
                            <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => startEdit(source)}>수정</Button>
                          ) : (
                            <Button size="sm" className="h-7 gap-1 text-[11px]" onClick={() => handleUpdate(source.id)} disabled={updateMutation.isPending}>
                              {updateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                              저장
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-carbon-danger"
                            onClick={() => { if (confirm(`"${source.name}" 소스를 삭제하시겠습니까?`)) deleteMutation.mutate(source.id); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* 테스트 결과 */}
                      {testMutation.isSuccess && testMutation.variables === source.id && (
                        <div className={cn(
                          "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs",
                          testMutation.data.ok ? "bg-green-50 text-carbon-success" : "bg-destructive/10 text-carbon-danger"
                        )}>
                          {testMutation.data.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          {testMutation.data.message}
                        </div>
                      )}

                      {/* 설정 필드 (읽기/수정 모드) */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-muted-foreground">Endpoint</label>
                          {isEditing ? (
                            <input value={editEndpoint} onChange={(e) => setEditEndpoint(e.target.value)} className={cn(inputClass, "h-8 text-xs")} />
                          ) : (
                            <p className="text-xs text-muted-foreground truncate">{source.endpoint || "(미설정)"}</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                            API Key
                            <button type="button" onClick={() => toggleKeyVisibility(source.id)} className="text-muted-foreground hover:text-foreground">
                              {keyVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </button>
                          </label>
                          {isEditing ? (
                            <input type="password" value={editApiKey} onChange={(e) => setEditApiKey(e.target.value)} placeholder="새 API Key (비우면 유지)" className={cn(inputClass, "h-8 text-xs")} />
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              {keyVisible ? "(DB에 암호화 저장됨)" : "••••••••"}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 마지막 동기화 정보 */}
                      {source.last_sync_at && (
                        <p className="text-[11px] text-muted-foreground">
                          마지막 동기화: {new Date(source.last_sync_at).toLocaleString("ko-KR")}
                          {source.last_sync?.records_saved != null && ` · ${source.last_sync.records_saved}건`}
                          {source.last_sync_status && (
                            <span className={cn(
                              "ml-1.5 font-medium",
                              source.last_sync_status === "success" ? "text-carbon-success" : "text-carbon-danger"
                            )}>
                              ({source.last_sync_status === "success" ? "성공" : "실패"})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ════════ 섹션 2: 거리 산출 API ════════ */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                거리 산출 API 설정
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                직원 출퇴근 거리 자동 산출용 지도 API (Scope 3 · 직원 출퇴근)
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => saveDistanceMutation.mutate(distForm)}
              disabled={saveDistanceMutation.isPending}
            >
              <Save className="mr-1 h-3.5 w-3.5" />
              {saveDistanceMutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                id="distance-api-enabled"
                type="checkbox"
                checked={distForm.enabled}
                onChange={(e) => setDistForm((p) => ({ ...p, enabled: e.target.checked }))}
                className="h-4 w-4"
              />
              <label htmlFor="distance-api-enabled" className="text-sm font-medium">
                거리 산출 API 사용
              </label>
              <span className="text-xs text-muted-foreground">
                (비활성화 시 demo 값으로 산출)
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Provider</label>
                <select
                  value={distForm.provider}
                  onChange={(e) => setDistForm((p) => ({ ...p, provider: e.target.value as DistanceApiProvider }))}
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
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">API Key</label>
                <input
                  type="password"
                  value={distForm.apiKey ?? ""}
                  onChange={(e) => setDistForm((p) => ({ ...p, apiKey: e.target.value }))}
                  placeholder="API Key"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Base URL (Custom)</label>
                <input
                  value={distForm.baseUrl ?? ""}
                  onChange={(e) => setDistForm((p) => ({ ...p, baseUrl: e.target.value }))}
                  placeholder="https://example.com/distance"
                  className={inputClass}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
