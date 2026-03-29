"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Plug,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Eye,
  Clock,
  Zap,
  X,
  TestTube,
  Settings,
  Link2,
  Unlink,
} from "lucide-react";
import {
  useIntegrations,
  useTestConnection,
  usePreviewData,
  useSyncIntegration,
  useSyncLogs,
  type PreviewData,
} from "@/hooks/use-integrations";

/* ── 타입 ── */
export interface FacilityItem {
  id: string;
  name: string;
  fuel?: string;
  unit?: string;
}

interface ApiIntegrationPanelProps {
  scope?: number;
  /** 현재 카테고리의 시설(배출원) 목록 — 데이터 입력 탭과 동일 */
  facilities: FacilityItem[];
  selectedFacilityId?: string;
  onSelectFacility?: (id: string) => void;
  year?: string;
}

/* ── 유틸 ── */
const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  success: { icon: CheckCircle2, color: "text-carbon-success", label: "성공" },
  error: { icon: XCircle, color: "text-carbon-danger", label: "실패" },
  partial: { icon: AlertCircle, color: "text-carbon-warning", label: "부분 성공" },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const MONTH_LABELS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

export function ApiIntegrationPanel({
  scope,
  facilities,
  selectedFacilityId: externalSelectedId,
  onSelectFacility,
  year: yearProp,
}: ApiIntegrationPanelProps) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(yearProp ?? String(currentYear));
  const [internalSelectedId, setInternalSelectedId] = useState(externalSelectedId ?? facilities[0]?.id ?? "");
  const selectedFacilityId = externalSelectedId ?? internalSelectedId;

  const [linkedSources, setLinkedSources] = useState<Record<string, number>>({});
  const [previewData, setPreviewData] = useState<PreviewData[] | null>(null);

  const { data: sources = [], isLoading: sourcesLoading } = useIntegrations(scope);
  const selectedSourceId = linkedSources[selectedFacilityId] ?? null;
  const { data: syncLogs = [] } = useSyncLogs(selectedSourceId);
  const testMutation = useTestConnection();
  const previewMutation = usePreviewData();
  const syncMutation = useSyncIntegration();

  const handleSelectFacility = (id: string) => {
    setInternalSelectedId(id);
    onSelectFacility?.(id);
    setPreviewData(null);
  };

  const handleLinkSource = (facilityId: string, sourceId: number) => {
    setLinkedSources((prev) => ({ ...prev, [facilityId]: sourceId }));
  };

  const handleUnlinkSource = (facilityId: string) => {
    setLinkedSources((prev) => {
      const next = { ...prev };
      delete next[facilityId];
      return next;
    });
  };

  const handlePreview = (sourceId: number) => {
    previewMutation.mutate({ sourceId, year: parseInt(year) }, {
      onSuccess: (data) => setPreviewData(data),
    });
  };

  const handleSync = (sourceId: number) => {
    syncMutation.mutate({
      sourceId,
      year: parseInt(year),
      facilityId: selectedFacilityId || undefined,
    }, {
      onSuccess: () => setPreviewData(null),
    });
  };

  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId);
  const linkedSource = sources.find((s) => s.id === selectedSourceId);

  return (
    <div className="grid gap-4 lg:grid-cols-[220px,1fr]">
      {/* ── 좌측: 시설 목록 ── */}
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <h4 className="text-xs font-semibold text-foreground">배출원 목록</h4>
          <p className="text-[11px] text-muted-foreground">시설을 선택하여 API 소스를 연결하세요</p>
        </CardHeader>
        <CardContent className="space-y-1 pb-3">
          {facilities.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              데이터 입력 탭에서 배출원을 먼저 등록하세요
            </p>
          ) : (
            facilities.map((f) => {
              const isSelected = f.id === selectedFacilityId;
              const isLinked = !!linkedSources[f.id];
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleSelectFacility(f.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors",
                    isSelected
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    isLinked ? "bg-carbon-success" : "bg-muted-foreground/30"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-medium truncate", isSelected && "text-foreground")}>{f.name}</p>
                    {f.fuel && <p className="text-[10px] text-muted-foreground">{f.fuel} · {f.unit}</p>}
                  </div>
                  {isLinked && (
                    <Link2 className="h-3 w-3 shrink-0 text-carbon-success" />
                  )}
                </button>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* ── 우측: API 소스 매핑 & 동기화 ── */}
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Plug className="h-4 w-4 text-muted-foreground" />
                {selectedFacility ? (
                  <>
                    <span>{selectedFacility.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">API 연동</span>
                  </>
                ) : (
                  "API 데이터 연동"
                )}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {selectedFacility
                  ? linkedSource
                    ? `${linkedSource.name} 소스에 연결됨`
                    : "API 소스를 연결하여 데이터를 자동 수집하세요"
                  : "좌측에서 시설을 선택하세요"
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="h-8 rounded-md border border-input bg-transparent px-2 py-1 text-xs"
              >
                {Array.from({ length: 4 }, (_, i) => String(currentYear - i)).map((y) => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                <a href="/settings/api-keys">
                  <Settings className="h-3 w-3" />
                  API 키 관리
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pb-5">
          {!selectedFacilityId ? (
            <div className="flex flex-col items-center py-10 text-center text-sm text-muted-foreground">
              <Plug className="mb-3 h-8 w-8 text-muted-foreground/30" />
              좌측에서 배출원을 선택하세요
            </div>
          ) : sourcesLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 소스 목록 로딩 중...
            </div>
          ) : sources.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <Plug className="mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">
                {scope ? `Scope ${scope}에 등록된 API 소스가 없습니다` : "등록된 API 소스가 없습니다"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">설정 &gt; API 키 관리에서 소스를 먼저 등록하세요</p>
              <Button variant="outline" size="sm" className="mt-3 gap-1.5 text-xs" asChild>
                <a href="/settings/api-keys"><Settings className="h-3 w-3" /> API 키 관리로 이동</a>
              </Button>
            </div>
          ) : (
            <>
              {/* 소스 연결 선택 */}
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  사용 가능한 API 소스 — 클릭하여 &quot;{selectedFacility?.name}&quot;에 연결
                </p>
                <div className="space-y-1.5">
                  {sources.map((source) => {
                    const isLinkedToThis = linkedSources[selectedFacilityId] === source.id;
                    const statusCfg = source.last_sync_status ? STATUS_CONFIG[source.last_sync_status] : null;
                    const StatusIcon = statusCfg?.icon ?? Clock;
                    const isTesting = testMutation.isPending && testMutation.variables === source.id;

                    return (
                      <div
                        key={source.id}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3 transition-all cursor-pointer",
                          isLinkedToThis
                            ? "border-carbon-success/50 bg-green-50/50"
                            : "border-border hover:bg-muted/20"
                        )}
                        onClick={() => {
                          if (isLinkedToThis) handleUnlinkSource(selectedFacilityId);
                          else handleLinkSource(selectedFacilityId, source.id);
                        }}
                      >
                        {/* 연결 상태 */}
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                          isLinkedToThis ? "bg-carbon-success/10 text-carbon-success" : "bg-muted text-muted-foreground"
                        )}>
                          {isLinkedToThis ? <Link2 className="h-4 w-4" /> : <Unlink className="h-4 w-4" />}
                        </div>

                        {/* 소스 정보 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{source.name}</span>
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {source.source_type}
                            </span>
                          </div>
                          {source.last_sync_at ? (
                            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                              <StatusIcon className={cn("h-3 w-3", statusCfg?.color)} />
                              <span>마지막 동기화: {formatDate(source.last_sync_at)}</span>
                              {source.last_sync?.records_saved != null && <span>· {source.last_sync.records_saved}건</span>}
                            </div>
                          ) : (
                            <p className="mt-0.5 text-[11px] text-muted-foreground">동기화 기록 없음</p>
                          )}
                        </div>

                        {/* 액션 */}
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-[11px]" onClick={() => testMutation.mutate(source.id)} disabled={isTesting}>
                            {isTesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <TestTube className="h-3 w-3" />}
                            테스트
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 테스트 결과 */}
                {testMutation.isSuccess && (
                  <div className={cn(
                    "mt-2 flex items-center gap-2 rounded-md px-3 py-1.5 text-xs",
                    testMutation.data.ok ? "bg-green-50 text-carbon-success" : "bg-destructive/10 text-carbon-danger"
                  )}>
                    {testMutation.data.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {testMutation.data.message}
                  </div>
                )}
              </div>

              {/* 연결된 소스: 미리보기 + 동기화 */}
              {linkedSource && (
                <div className="space-y-3 rounded-lg border border-carbon-success/30 bg-green-50/30 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-carbon-success" />
                      <span className="text-sm font-medium text-foreground">{linkedSource.name}</span>
                      <span className="text-xs text-muted-foreground">→</span>
                      <span className="text-sm font-medium text-foreground">{selectedFacility?.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 text-[11px]"
                        onClick={() => handlePreview(linkedSource.id)}
                        disabled={previewMutation.isPending}
                      >
                        {previewMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                        미리보기
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 gap-1 text-[11px]"
                        onClick={() => handleSync(linkedSource.id)}
                        disabled={syncMutation.isPending}
                      >
                        {syncMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                        동기화 실행
                      </Button>
                    </div>
                  </div>

                  {/* 동기화 결과 */}
                  {syncMutation.isSuccess && (
                    <div className="flex items-center gap-2 rounded-md bg-green-100 px-3 py-1.5 text-xs text-carbon-success">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {syncMutation.data.records_saved}건 → &quot;{selectedFacility?.name}&quot; 활동량에 저장 완료 ({syncMutation.data.duration_ms}ms)
                    </div>
                  )}
                </div>
              )}

              {/* 데이터 미리보기 */}
              {previewData && previewData.length > 0 && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="flex items-center justify-between bg-muted/50 px-3 py-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      <Eye className="mr-1 inline h-3 w-3" />
                      데이터 미리보기 — {year}년 → {selectedFacility?.name}
                    </span>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setPreviewData(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-card">
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground sticky left-0 bg-card">소스</th>
                          {MONTH_LABELS.map((m) => (
                            <th key={m} className="px-2 py-2 text-right font-medium text-muted-foreground">{m}</th>
                          ))}
                          <th className="px-3 py-2 text-right font-medium text-muted-foreground">합계</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((p, i) => (
                          <tr key={i} className="border-b border-border/50">
                            <td className="px-3 py-2 font-medium sticky left-0 bg-card">
                              {p.facilityName}
                              <span className="ml-1 text-muted-foreground">({p.unit})</span>
                            </td>
                            {p.values.map((v, mi) => (
                              <td key={mi} className="px-2 py-2 text-right tabular-nums">
                                {v > 0 ? v.toLocaleString("ko-KR") : <span className="text-muted-foreground/40">-</span>}
                              </td>
                            ))}
                            <td className="px-3 py-2 text-right font-semibold tabular-nums">
                              {p.values.reduce((s, v) => s + v, 0).toLocaleString("ko-KR")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between border-t border-border bg-muted/30 px-3 py-2">
                    <span className="text-[11px] text-muted-foreground">
                      동기화 시 &quot;{selectedFacility?.name}&quot;의 월별 활동량 데이터로 저장됩니다
                    </span>
                    <Button
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={() => linkedSource && handleSync(linkedSource.id)}
                      disabled={syncMutation.isPending || !linkedSource}
                    >
                      {syncMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                      이 데이터로 동기화
                    </Button>
                  </div>
                </div>
              )}

              {/* 동기화 이력 */}
              {selectedSourceId && syncLogs.length > 0 && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                    <Clock className="mr-1 inline h-3 w-3" />
                    동기화 이력 (최근 10건)
                  </div>
                  <div className="divide-y divide-border/50 max-h-36 overflow-y-auto">
                    {syncLogs.map((log) => {
                      const cfg = STATUS_CONFIG[log.status] ?? STATUS_CONFIG.error;
                      const Icon = cfg.icon;
                      return (
                        <div key={log.id} className="flex items-center gap-3 px-3 py-1.5 text-xs">
                          <Icon className={cn("h-3 w-3 shrink-0", cfg.color)} />
                          <span className={cn("font-medium", cfg.color)}>{cfg.label}</span>
                          <span className="text-muted-foreground">{log.records_saved}건</span>
                          {log.duration_ms && <span className="text-muted-foreground">{log.duration_ms}ms</span>}
                          <span className="ml-auto text-muted-foreground">{formatDate(log.started_at)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
