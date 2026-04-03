"use client";

import { cn, formatNumber } from "@/lib/utils";
import type { Scope1FuelType } from "@/types/scope1";
import {
  calculateMonthlyEmissions,
  calculateGasEmissions,
  getEmissionFactorForFuel,
  SCOPE1_GAS_FACTORS,
  SCOPE1_FACTOR_SOURCES,
} from "@/lib/scope1-utils";
import { useMemo, useState, useRef, useEffect } from "react";
import { Paperclip, Upload, X, FileText, ChevronLeft, ChevronRight, Eye, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useAttachments,
  useUploadAttachment,
  useDeleteAttachment,
  type AttachmentMeta,
} from "@/hooks/use-attachments";

const MONTH_LABELS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

interface MonthlyActivityTableProps {
  activityByMonth: number[];
  onChangeActivity: (values: number[]) => void;
  fuel: Scope1FuelType;
  unitLabel: string;
  facilityName?: string;
  facilityId?: string;
  year: string;
  metaRight?: React.ReactNode;
  headerRight?: React.ReactNode;
  factorSourceOverride?: string;
  gasFactorsOverride?: { co2: number; ch4: number; n2o: number; gwpCh4: number; gwpN2o: number };
}

function fmt3(n: number) {
  return n.toFixed(3);
}

function NumberInput({
  value,
  onChange,
  onFocus,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  onFocus?: () => void;
  className?: string;
}) {
  const [text, setText] = useState(fmt3(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(fmt3(value));
  }, [value, focused]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onFocus={() => {
        setFocused(true);
        onFocus?.();
      }}
      onBlur={() => {
        setFocused(false);
        const n = parseFloat(text);
        const rounded = Number.isNaN(n) ? 0 : Math.round(n * 1000) / 1000;
        setText(fmt3(rounded));
        onChange(rounded);
      }}
      className={className}
    />
  );
}

function FileViewer({ att, onClose }: { att: AttachmentMeta; onClose: () => void }) {
  const url = `/api/attachments/${att.id}/file`;
  const isImage = att.file_type.startsWith("image/");
  const isPdf = att.file_type === "application/pdf";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="relative flex max-h-[90vh] max-w-[90vw] flex-col overflow-hidden rounded-lg bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <span className="max-w-xs truncate text-sm font-medium">{att.file_name}</span>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          {isImage && <img src={url} alt={att.file_name} className="max-h-[80vh] w-auto object-contain" />}
          {isPdf && <iframe src={url} className="h-[80vh] w-[70vw]" title={att.file_name} />}
          {!isImage && !isPdf && (
            <div className="flex flex-col items-center gap-4 p-8 text-muted-foreground">
              <FileText className="h-16 w-16" />
              <p className="text-sm">{att.file_name}</p>
              <a href={url} download={att.file_name}>
                <Button variant="outline" size="sm">다운로드</Button>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MonthlyActivityTable({
  activityByMonth,
  onChangeActivity,
  fuel,
  unitLabel,
  facilityName,
  facilityId,
  year,
  metaRight,
  headerRight,
  factorSourceOverride,
  gasFactorsOverride,
}: MonthlyActivityTableProps) {
  const now = new Date();
  const isCurrentYear = year === String(now.getFullYear());
  const currentMonthIdx = now.getMonth(); // 0-indexed

  const factor = getEmissionFactorForFuel(fuel);
  const gasFactors = gasFactorsOverride
    ? { co2: gasFactorsOverride.co2, ch4: gasFactorsOverride.ch4, n2o: gasFactorsOverride.n2o, gwp_ch4: gasFactorsOverride.gwpCh4, gwp_n2o: gasFactorsOverride.gwpN2o }
    : SCOPE1_GAS_FACTORS[fuel];
  const factorSource = factorSourceOverride ?? SCOPE1_FACTOR_SOURCES[fuel];

  const emissionData = useMemo(
    () => calculateMonthlyEmissions(activityByMonth, fuel),
    [activityByMonth, fuel],
  );

  const totalEmission = emissionData.reduce((sum, row) => sum + row.emission, 0);
  const gasEmissions = useMemo(() => {
    if (gasFactorsOverride) {
      const safe = (v: number) => (Number.isNaN(v) ? 0 : v);
      return {
        co2: activityByMonth.map((v) => safe(v) * gasFactorsOverride.co2),
        ch4: activityByMonth.map((v) => safe(v) * gasFactorsOverride.ch4),
        n2o: activityByMonth.map((v) => safe(v) * gasFactorsOverride.n2o),
      };
    }
    return calculateGasEmissions(activityByMonth, fuel);
  }, [activityByMonth, fuel, gasFactorsOverride]);

  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [viewerAtt, setViewerAtt] = useState<AttachmentMeta | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 시설이 바뀌면 선택된 월 초기화
  useEffect(() => {
    setSelectedMonth(null);
  }, [facilityName]);

  const { data } = useAttachments(facilityId, year);
  const uploadMutation = useUploadAttachment();
  const deleteMutation = useDeleteAttachment();

  const currentAtts: AttachmentMeta[] =
    selectedMonth !== null ? (data?.filter((a) => a.month === selectedMonth + 1) ?? []) : [];

  const handleUploadFiles = (files: FileList | File[], monthIdx: number) => {
    if (!facilityId) return;
    Array.from(files).forEach((file) => {
      uploadMutation.mutate({ file, facilityId, year, month: monthIdx + 1 });
    });
  };

  // OCR 상태
  const [ocrLoading, setOcrLoading] = useState<number | null>(null); // attachmentId
  const [ocrResult, setOcrResult] = useState<{ usage: number; unit: string; type: string; confidence: number } | null>(null);

  const handleOcr = async (att: AttachmentMeta) => {
    setOcrLoading(att.id);
    setOcrResult(null);
    try {
      const res = await fetch("/api/attachments/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachmentId: att.id }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "OCR 처리에 실패했습니다."); return; }

      const item = Array.isArray(data.results) ? data.results[0] : data.results;
      if (!item?.usage) { toast.error("사용량을 읽을 수 없습니다."); return; }

      setOcrResult({ usage: item.usage, unit: item.unit ?? "", type: item.type ?? "", confidence: item.confidence ?? 0 });
    } catch {
      toast.error("OCR 처리 중 오류가 발생했습니다.");
    } finally {
      setOcrLoading(null);
    }
  };

  const applyOcrResult = () => {
    if (!ocrResult || selectedMonth === null) return;
    const next = [...activityByMonth];
    next[selectedMonth] = ocrResult.usage;
    onChangeActivity(next);
    toast.success(`${MONTH_LABELS[selectedMonth]} 활동량에 ${formatNumber(ocrResult.usage, 4)} 적용됨`);
    setOcrResult(null);
  };


  return (
    <>
      {viewerAtt && <FileViewer att={viewerAtt} onClose={() => setViewerAtt(null)} />}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="text-sm font-medium text-foreground">월별 데이터 입력</h2>
            {facilityName && (
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary">
                {facilityName}
              </span>
            )}
            {metaRight}
          </div>
          {headerRight && <div className="ml-auto">{headerRight}</div>}
        </div>

        {/* 계산 근거 */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs">
          <span className="shrink-0 font-semibold text-primary">계산 근거</span>
          <span className="shrink-0 text-muted-foreground">
            활동량
            <span className="mx-1 text-muted-foreground/60">({unitLabel})</span>
            <span className="mx-1.5 text-foreground">×</span>
            배출계수
            <span className="mx-1 rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
              {factor.toExponential(4)} tCO₂e/{unitLabel}
            </span>
            <span className="mx-1.5 text-foreground">=</span>
            배출량
            <span className="ml-1 text-muted-foreground/60">(tCO₂e)</span>
          </span>
          <span className="h-3 w-px shrink-0 bg-primary/10" />
          <span className="text-muted-foreground">
            CO₂:
            <span className="ml-1 font-mono font-medium text-foreground">{gasFactors.co2.toExponential(3)} tCO₂/{unitLabel}</span>
          </span>
          <span className="text-muted-foreground">
            CH₄:
            <span className="ml-1 font-mono font-medium text-foreground">{gasFactors.ch4.toExponential(3)} tCH₄/{unitLabel}</span>
            <span className="ml-0.5 text-[10px] text-primary/70">(×{gasFactors.gwp_ch4})</span>
          </span>
          <span className="text-muted-foreground">
            N₂O:
            <span className="ml-1 font-mono font-medium text-foreground">{gasFactors.n2o.toExponential(3)} tN₂O/{unitLabel}</span>
            <span className="ml-0.5 text-[10px] text-primary/70">(×{gasFactors.gwp_n2o})</span>
          </span>
          <span className="h-3 w-px shrink-0 bg-primary/10" />
          <span className="text-muted-foreground">
            출처:
            <span className="ml-1 text-foreground">{factorSource}</span>
          </span>
        </div>

        {/* 테이블 */}
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <th className="w-24 px-3 py-2 text-left font-medium">구분</th>
                {MONTH_LABELS.map((label, idx) => {
                  const isCurrent = isCurrentYear && idx === currentMonthIdx;
                  const isSelected = selectedMonth === idx;
                  return (
                    <th
                      key={label}
                      className={cn(
                        "px-1 py-2 text-right font-medium",
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : isCurrent
                          ? "bg-taupe-50 text-carbon-warning dark:bg-taupe-50/30 dark:text-carbon-warning"
                          : ""
                      )}
                    >
                      {label}
                      {isCurrent && !isSelected && (
                        <span className="ml-0.5 inline-block h-1 w-1 rounded-full bg-taupe-50 align-middle" />
                      )}
                    </th>
                  );
                })}
                <th className="w-24 px-3 py-2 text-right font-medium">합계</th>
              </tr>
            </thead>
            <tbody>
              {/* 활동량 행 */}
              <tr className="border-b border-border/60">
                <td className="px-3 py-2 text-xs font-medium">활동량 ({unitLabel})</td>
                {MONTH_LABELS.map((_, idx) => {
                  const attCount = data?.filter((a) => a.month === idx + 1).length ?? 0;
                  const isSelected = selectedMonth === idx;
                  const isCurrent = isCurrentYear && idx === currentMonthIdx;
                  return (
                    <td key={idx} className={cn(
                      "px-1 py-1 text-right",
                      isSelected ? "bg-primary/5" : isCurrent ? "bg-taupe-50/60 dark:bg-taupe-50/10" : ""
                    )}>
                      <NumberInput
                        value={activityByMonth[idx] ?? 0}
                        onChange={(v) => {
                          const next = [...activityByMonth];
                          next[idx] = v;
                          onChangeActivity(next);
                        }}
                        onFocus={() => setSelectedMonth(idx)}
                        className={cn(
                          "h-8 w-full min-w-0 rounded-md border bg-transparent px-1 py-1 text-right text-xs ring-offset-background",
                          "focus:outline-none focus:ring-1 focus:ring-ring",
                          isSelected ? "border-primary" : isCurrent ? "border-border dark:border-border" : "border-input"
                        )}
                      />
                      {/* 첨부 버튼 */}
                      <button
                        type="button"
                        onClick={() => setSelectedMonth(isSelected ? null : idx)}
                        className={cn(
                          "mt-0.5 flex w-full items-center justify-end gap-0.5 text-[10px]",
                          attCount > 0 ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Paperclip className="h-2.5 w-2.5" />
                        {attCount > 0 ? attCount : "첨부"}
                      </button>
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                  {formatNumber(activityByMonth.reduce((sum, v) => sum + (Number.isNaN(v) ? 0 : v), 0), 3)}
                </td>
              </tr>
              {/* 배출량 행 */}
              <tr className="border-b border-border/60">
                <td className="px-3 py-2 text-xs font-medium">배출량 (tCO₂e)</td>
                {emissionData.map((row, idx) => (
                  <td key={row.month} className={cn(
                    "px-2 py-2 text-right text-xs",
                    selectedMonth === idx ? "bg-primary/5" : isCurrentYear && idx === currentMonthIdx ? "bg-taupe-50/60 dark:bg-taupe-50/10" : ""
                  )}>
                    {formatNumber(row.emission, 2)}
                  </td>
                ))}
                <td className="px-3 py-2 text-right text-xs font-semibold">
                  {formatNumber(totalEmission, 2)} tCO₂e
                </td>
              </tr>
              {/* 가스별 행 */}
              <tr className="border-b border-border/60 bg-muted/20">
                <td className="px-3 py-2 text-xs text-muted-foreground pl-5">CO₂ (tCO₂)</td>
                {gasEmissions.co2.map((v, idx) => (
                  <td key={idx} className={cn("px-2 py-2 text-right text-xs text-muted-foreground", isCurrentYear && idx === currentMonthIdx && "bg-taupe-50/60 dark:bg-taupe-50/10")}>{formatNumber(v, 3)}</td>
                ))}
                <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                  {formatNumber(gasEmissions.co2.reduce((s, v) => s + v, 0), 3)}
                </td>
              </tr>
              <tr className="border-b border-border/60 bg-muted/20">
                <td className="px-3 py-2 text-xs text-muted-foreground pl-5">CH₄ (tCH₄)</td>
                {gasEmissions.ch4.map((v, idx) => (
                  <td key={idx} className={cn("px-2 py-2 text-right text-xs text-muted-foreground", isCurrentYear && idx === currentMonthIdx && "bg-taupe-50/60 dark:bg-taupe-50/10")}>{formatNumber(v, 3)}</td>
                ))}
                <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                  {formatNumber(gasEmissions.ch4.reduce((s, v) => s + v, 0), 3)}
                </td>
              </tr>
              <tr className="bg-muted/20">
                <td className="px-3 py-2 text-xs text-muted-foreground pl-5">N₂O (tN₂O)</td>
                {gasEmissions.n2o.map((v, idx) => (
                  <td key={idx} className={cn("px-2 py-2 text-right text-xs text-muted-foreground", isCurrentYear && idx === currentMonthIdx && "bg-taupe-50/60 dark:bg-taupe-50/10")}>{formatNumber(v, 3)}</td>
                ))}
                <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                  {formatNumber(gasEmissions.n2o.reduce((s, v) => s + v, 0), 3)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 첨부파일 패널 */}
        {selectedMonth !== null && (
          <div
            className="rounded-lg border border-primary/30 bg-primary/5 p-4"
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (selectedMonth !== null) handleUploadFiles(e.dataTransfer.files, selectedMonth);
            }}
          >
            {/* 패널 헤더 */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMonth((m) => m !== null && m > 0 ? m - 1 : m)}
                  disabled={selectedMonth === 0}
                  className="rounded p-0.5 hover:bg-muted disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-primary">
                  {facilityName ? `${facilityName} · ` : ""}{MONTH_LABELS[selectedMonth]} 첨부자료
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedMonth((m) => m !== null && m < 11 ? m + 1 : m)}
                  disabled={selectedMonth === 11}
                  className="rounded p-0.5 hover:bg-muted disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!facilityId}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-1 h-3.5 w-3.5" />
                  파일 업로드
                </Button>
                <button
                  type="button"
                  onClick={() => setSelectedMonth(null)}
                  className="rounded p-1 hover:bg-muted"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* 파일 목록 또는 빈 상태 */}
            {currentAtts.length === 0 ? (
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed py-4 text-muted-foreground transition-colors",
                  dragOver ? "border-primary bg-primary/10" : "border-border"
                )}
              >
                <Upload className="h-5 w-5" />
                <p className="text-xs">고지서, 영수증 등 파일을 드래그하거나 업로드 버튼을 클릭하세요</p>
                <p className="text-[11px]">PDF, 이미지, 문서 등 모든 파일 지원</p>
              </div>
            ) : (
              <div className={cn(
                "space-y-2 rounded-md border-2 border-dashed p-2 transition-colors",
                dragOver ? "border-primary bg-primary/10" : "border-transparent"
              )}>
                {currentAtts.map((att) => {
                  const isImage = att.file_type.startsWith("image/");
                  const isPdf = att.file_type === "application/pdf";
                  const fileUrl = `/api/attachments/${att.id}/file`;
                  return (
                    <div key={att.id} className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded border border-border bg-muted">
                        {isImage ? (
                          <img src={fileUrl} alt={att.file_name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{att.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(att.file_size / 1024).toFixed(1)} KB
                          {isPdf && " · PDF"}
                          {isImage && " · 이미지"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {isImage && (
                          <button
                            type="button"
                            onClick={() => handleOcr(att)}
                            disabled={ocrLoading === att.id}
                            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
                            title="AI로 사용량 읽기"
                          >
                            {ocrLoading === att.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                            AI 읽기
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setViewerAtt(att)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="보기"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate({ id: att.id, facilityId: facilityId ?? "", year })}
                          className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="삭제"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                <button
                  type="button"
                  disabled={!facilityId}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
                >
                  <Upload className="h-3 w-3" />
                  파일 추가
                </button>
              </div>
            )}

            {/* OCR 결과 확인/적용 */}
            {ocrResult && selectedMonth !== null && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI 사용량 추출 결과
                </p>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">유형:</span>
                  <span className="font-medium">{ocrResult.type}</span>
                  <span className="text-muted-foreground">사용량:</span>
                  <span className="font-bold text-primary text-lg">{formatNumber(ocrResult.usage, 4)}</span>
                  <span className="text-muted-foreground">{ocrResult.unit}</span>
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    ocrResult.confidence >= 0.9 ? "bg-green-100 text-green-700" :
                    ocrResult.confidence >= 0.7 ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  )}>
                    확신도 {Math.round(ocrResult.confidence * 100)}%
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={applyOcrResult}>
                    {MONTH_LABELS[selectedMonth]} 활동량에 적용
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setOcrResult(null)}>
                    취소
                  </Button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && selectedMonth !== null) {
                  handleUploadFiles(e.target.files, selectedMonth);
                  e.target.value = "";
                }
              }}
            />
          </div>
        )}
      </section>
    </>
  );
}
