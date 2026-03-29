"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  X,
  PenLine,
  FileSpreadsheet,
  Plug,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Trash2,
  RefreshCw,
  Zap,
  Link2,
  Info,
} from "lucide-react";

/* ── 타입 ── */
type InputCategory = "에너지" | "온실가스" | "폐기물" | "물";
type ScopeType = "scope1" | "scope2" | "scope3" | "none";

interface DirectInputForm {
  category: InputCategory | "";
  indicatorName: string;
  scope: ScopeType;
  value: string;
  unit: string;
  period: string;
  source: string;
  memo: string;
}

interface ApiSource {
  id: string;
  name: string;
  description: string;
  scope: ScopeType;
  status: "connected" | "disconnected" | "syncing";
  lastSync?: string;
  dataPoints?: number;
}

/* ── Scope별 지표 매핑 ── */
const SCOPE_INDICATORS: Record<string, { name: string; unit: string; scope: ScopeType }[]> = {
  "에너지": [
    { name: "총 에너지 사용량", unit: "GJ", scope: "none" },
    { name: "재생에너지 사용량", unit: "GJ", scope: "none" },
    { name: "재생에너지 비율", unit: "%", scope: "none" },
  ],
  "온실가스": [
    { name: "Scope 1 — 고정연소 배출량", unit: "tCO2e", scope: "scope1" },
    { name: "Scope 1 — 이동연소 배출량", unit: "tCO2e", scope: "scope1" },
    { name: "Scope 1 — 탈루 배출량", unit: "tCO2e", scope: "scope1" },
    { name: "Scope 2 — 구입전력 배출량", unit: "tCO2e", scope: "scope2" },
    { name: "Scope 2 — 증기·난방 배출량", unit: "tCO2e", scope: "scope2" },
    { name: "Scope 3 — 구입상품 및 서비스", unit: "tCO2e", scope: "scope3" },
    { name: "Scope 3 — 출장", unit: "tCO2e", scope: "scope3" },
    { name: "Scope 3 — 직원 출퇴근", unit: "tCO2e", scope: "scope3" },
    { name: "Scope 3 — 업스트림 운송", unit: "tCO2e", scope: "scope3" },
  ],
  "폐기물": [
    { name: "발생 폐기물 총량", unit: "ton", scope: "none" },
    { name: "재활용 폐기물", unit: "ton", scope: "none" },
    { name: "폐기물 재활용률", unit: "%", scope: "none" },
  ],
  "물": [
    { name: "총 취수량", unit: "m³", scope: "none" },
    { name: "재이용 용수량", unit: "m³", scope: "none" },
    { name: "총 방류량", unit: "m³", scope: "none" },
  ],
};

/* ── API 데이터 소스 목록 ── */
const API_SOURCES: ApiSource[] = [
  {
    id: "kepco",
    name: "KEPCO API",
    description: "한국전력공사 전력 사용량 데이터 → Scope 2 (구입전력) 자동 산정",
    scope: "scope2",
    status: "connected",
    lastSync: "2026-03-28 14:30",
    dataPoints: 12,
  },
  {
    id: "emission-engine",
    name: "Emission Engine",
    description: "Scope 1 고정·이동·탈루 연소 활동 데이터 기반 배출량 자동 산정",
    scope: "scope1",
    status: "connected",
    lastSync: "2026-03-28 09:15",
    dataPoints: 36,
  },
  {
    id: "erp",
    name: "ERP 시스템",
    description: "에너지·폐기물·용수 사용 내역 연동 (SAP / Oracle)",
    scope: "none",
    status: "connected",
    lastSync: "2026-03-27 18:00",
    dataPoints: 24,
  },
  {
    id: "iot",
    name: "IoT 센서",
    description: "사업장 실시간 에너지·용수 계량 데이터 수집",
    scope: "none",
    status: "disconnected",
  },
  {
    id: "supplier",
    name: "Supplier Portal",
    description: "공급망 Scope 3 데이터 — 구입상품·업스트림 운송 배출량",
    scope: "scope3",
    status: "connected",
    lastSync: "2026-03-25 11:00",
    dataPoints: 8,
  },
  {
    id: "district-heat",
    name: "지역난방공사 API",
    description: "지역난방·증기 사용량 → Scope 2 (증기·난방) 자동 산정",
    scope: "scope2",
    status: "disconnected",
  },
];

const EXCEL_TEMPLATE_COLUMNS = [
  { header: "구분", example: "온실가스" },
  { header: "지표명", example: "Scope 1 — 고정연소 배출량" },
  { header: "값", example: "850" },
  { header: "단위", example: "tCO2e" },
  { header: "기간", example: "2026-Q1" },
  { header: "Scope", example: "Scope 1" },
  { header: "출처", example: "Emission Engine" },
  { header: "비고", example: "" },
];

/* ── 컴포넌트 ── */
interface EnvironmentDataEntryModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: unknown) => void;
}

export function EnvironmentDataEntryModal({
  open,
  onClose,
  onSubmit,
}: EnvironmentDataEntryModalProps) {
  const [tab, setTab] = useState("direct");

  /* 직접입력 폼 */
  const [form, setForm] = useState<DirectInputForm>({
    category: "",
    indicatorName: "",
    scope: "none",
    value: "",
    unit: "",
    period: "",
    source: "Manual",
    memo: "",
  });

  /* Excel 업로드 */
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelPreview, setExcelPreview] = useState<Record<string, string>[] | null>(null);
  const [dragOver, setDragOver] = useState(false);

  /* API 동기화 */
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [scopeFilter, setScopeFilter] = useState<ScopeType | "all">("all");

  const currentYear = new Date().getFullYear();
  const periods = [
    `${currentYear}`,
    `${currentYear}-Q1`,
    `${currentYear}-Q2`,
    `${currentYear}-Q3`,
    `${currentYear}-Q4`,
    ...Array.from({ length: 12 }, (_, i) => `${currentYear}-${String(i + 1).padStart(2, "0")}`),
  ];

  const indicators = form.category ? SCOPE_INDICATORS[form.category] ?? [] : [];

  const handleIndicatorChange = (name: string) => {
    const match = indicators.find((i) => i.name === name);
    setForm((p) => ({
      ...p,
      indicatorName: name,
      unit: match?.unit ?? p.unit,
      scope: match?.scope ?? "none",
    }));
  };

  const handleDirectSubmit = () => {
    onSubmit?.({
      type: "direct",
      ...form,
      value: Number(form.value),
    });
    onClose();
  };

  /* Excel 드래그앤드롭 */
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".csv"))) {
      setExcelFile(file);
      // 시뮬레이션된 파싱 결과
      setExcelPreview([
        { 구분: "온실가스", 지표명: "Scope 1 — 고정연소 배출량", 값: "850", 단위: "tCO2e", 기간: "2026-Q1", Scope: "Scope 1", 출처: "Emission Engine" },
        { 구분: "온실가스", 지표명: "Scope 2 — 구입전력 배출량", 값: "1,200", 단위: "tCO2e", 기간: "2026-Q1", Scope: "Scope 2", 출처: "KEPCO API" },
        { 구분: "에너지", 지표명: "총 에너지 사용량", 값: "32,500", 단위: "GJ", 기간: "2026-Q1", Scope: "-", 출처: "ERP" },
        { 구분: "온실가스", 지표명: "Scope 3 — 구입상품 및 서비스", 값: "1,050", 단위: "tCO2e", 기간: "2026-Q1", Scope: "Scope 3", 출처: "Supplier Portal" },
      ]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setExcelFile(file);
      setExcelPreview([
        { 구분: "온실가스", 지표명: "Scope 1 — 고정연소 배출량", 값: "850", 단위: "tCO2e", 기간: "2026-Q1", Scope: "Scope 1", 출처: "Emission Engine" },
        { 구분: "온실가스", 지표명: "Scope 2 — 구입전력 배출량", 값: "1,200", 단위: "tCO2e", 기간: "2026-Q1", Scope: "Scope 2", 출처: "KEPCO API" },
        { 구분: "에너지", 지표명: "총 에너지 사용량", 값: "32,500", 단위: "GJ", 기간: "2026-Q1", Scope: "-", 출처: "ERP" },
        { 구분: "온실가스", 지표명: "Scope 3 — 구입상품 및 서비스", 값: "1,050", 단위: "tCO2e", 기간: "2026-Q1", Scope: "Scope 3", 출처: "Supplier Portal" },
      ]);
    }
  };

  const handleExcelSubmit = () => {
    onSubmit?.({ type: "excel", file: excelFile, rows: excelPreview });
    onClose();
  };

  /* API Sync */
  const handleSync = (sourceId: string) => {
    setSyncingId(sourceId);
    setTimeout(() => setSyncingId(null), 2000);
  };

  const handleApiSubmit = () => {
    const connected = API_SOURCES.filter((s) => s.status === "connected");
    onSubmit?.({ type: "api", sources: connected.map((s) => s.id) });
    onClose();
  };

  if (!open) return null;

  const scopeLabel = (s: ScopeType) =>
    s === "scope1" ? "Scope 1" : s === "scope2" ? "Scope 2" : s === "scope3" ? "Scope 3" : "";

  const scopeColor = (s: ScopeType) =>
    s === "scope1"
      ? "bg-taupe-50 text-taupe-600 border-taupe-200"
      : s === "scope2"
        ? "bg-green-50 text-carbon-success border-green-200"
        : s === "scope3"
          ? "bg-sky-50 text-sky-600 border-sky-200"
          : "";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border border-border bg-card shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">환경 데이터 입력</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                직접입력 · Excel 일괄 업로드 · API 연동 중 입력 방식을 선택하세요
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="direct" className="gap-1.5 text-xs">
                  <PenLine className="h-3.5 w-3.5" />
                  직접입력
                </TabsTrigger>
                <TabsTrigger value="excel" className="gap-1.5 text-xs">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Excel 일괄입력
                </TabsTrigger>
                <TabsTrigger value="api" className="gap-1.5 text-xs">
                  <Plug className="h-3.5 w-3.5" />
                  API 연동
                </TabsTrigger>
              </TabsList>

              {/* ─── Tab 1: 직접입력 ─── */}
              <TabsContent value="direct" className="mt-5 space-y-4">
                {/* 구분 + 지표명 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">구분 *</label>
                    <Select
                      value={form.category || undefined}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, category: v as InputCategory, indicatorName: "", unit: "", scope: "none" }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="에너지">에너지</SelectItem>
                        <SelectItem value="온실가스">온실가스</SelectItem>
                        <SelectItem value="폐기물">폐기물</SelectItem>
                        <SelectItem value="물">물</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">지표명 *</label>
                    <Select
                      value={form.indicatorName || undefined}
                      onValueChange={handleIndicatorChange}
                      disabled={!form.category}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={form.category ? "지표 선택" : "구분을 먼저 선택"} />
                      </SelectTrigger>
                      <SelectContent>
                        {indicators.map((ind) => (
                          <SelectItem key={ind.name} value={ind.name}>
                            <span className="flex items-center gap-2">
                              {ind.name}
                              {ind.scope !== "none" && (
                                <span className={cn("inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium border", scopeColor(ind.scope))}>
                                  {scopeLabel(ind.scope)}
                                </span>
                              )}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Scope 안내 배너 */}
                {form.scope !== "none" && (
                  <div className={cn("flex items-start gap-2.5 rounded-lg border p-3", scopeColor(form.scope))}>
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="text-xs leading-relaxed">
                      <span className="font-semibold">{scopeLabel(form.scope)}</span>
                      {form.scope === "scope1" && " — 사업장 직접 배출 (고정연소, 이동연소, 탈루). NIER-2023 국가 배출계수가 자동 적용됩니다."}
                      {form.scope === "scope2" && " — 간접 배출 (구입전력, 증기). KEPCO API 또는 지역난방공사 데이터 연동을 권장합니다."}
                      {form.scope === "scope3" && " — 가치사슬 배출. 공급망 데이터 정확도에 따라 Activity/Spend/Supplier-specific 방법론이 달라집니다."}
                    </div>
                  </div>
                )}

                {/* 값 + 단위 + 기간 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">값 *</label>
                    <input
                      type="number"
                      value={form.value}
                      onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                      placeholder="0"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm tabular-nums shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">단위</label>
                    <input
                      type="text"
                      value={form.unit}
                      onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                      placeholder="tCO2e"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">기간 *</label>
                    <Select value={form.period || undefined} onValueChange={(v) => setForm((p) => ({ ...p, period: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="기간 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {periods.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 출처 + 비고 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">데이터 출처</label>
                    <Select value={form.source} onValueChange={(v) => setForm((p) => ({ ...p, source: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Manual">Manual (수기입력)</SelectItem>
                        <SelectItem value="ERP">ERP</SelectItem>
                        <SelectItem value="Excel Upload">Excel Upload</SelectItem>
                        <SelectItem value="Emission Engine">Emission Engine</SelectItem>
                        <SelectItem value="KEPCO API">KEPCO API</SelectItem>
                        <SelectItem value="IoT">IoT 센서</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">비고</label>
                    <input
                      type="text"
                      value={form.memo}
                      onChange={(e) => setForm((p) => ({ ...p, memo: e.target.value }))}
                      placeholder="메모 또는 참고사항"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* ─── Tab 2: Excel 일괄입력 ─── */}
              <TabsContent value="excel" className="mt-5 space-y-4">
                {/* 템플릿 다운로드 */}
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>표준 템플릿을 다운로드하여 데이터를 작성한 뒤 업로드하세요.</span>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    템플릿 다운로드
                  </Button>
                </div>

                {/* 템플릿 컬럼 미리보기 */}
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-muted/50 px-3 py-2 text-[11px] font-medium text-muted-foreground">
                    템플릿 컬럼 구조
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          {EXCEL_TEMPLATE_COLUMNS.map((c) => (
                            <th key={c.header} className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground">
                              {c.header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-muted-foreground/70">
                          {EXCEL_TEMPLATE_COLUMNS.map((c) => (
                            <td key={c.header} className="whitespace-nowrap px-3 py-1.5 italic">
                              {c.example || "—"}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 드래그앤드롭 업로드 영역 */}
                {!excelFile ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleFileDrop}
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 transition-colors",
                      dragOver
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/40"
                    )}
                  >
                    <Upload className="h-8 w-8 text-muted-foreground/60" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        Excel / CSV 파일을 드래그하거나
                      </p>
                      <label className="mt-1 inline-flex cursor-pointer text-sm text-primary hover:underline">
                        파일 선택
                        <input
                          type="file"
                          accept=".xlsx,.csv"
                          className="hidden"
                          onChange={handleFileInput}
                        />
                      </label>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      .xlsx 또는 .csv · 최대 10MB · Scope 컬럼 필수
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* 파일 정보 */}
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-carbon-success" />
                        <span className="font-medium">{excelFile.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(excelFile.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => { setExcelFile(null); setExcelPreview(null); }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>

                    {/* 파싱 프리뷰 */}
                    {excelPreview && (
                      <div className="rounded-lg border border-border overflow-hidden">
                        <div className="flex items-center justify-between bg-muted/50 px-3 py-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            미리보기 — {excelPreview.length}건 인식
                          </span>
                          <div className="flex items-center gap-1 text-[11px] text-carbon-success">
                            <CheckCircle2 className="h-3 w-3" />
                            파싱 완료
                          </div>
                        </div>
                        <div className="overflow-x-auto max-h-52">
                          <table className="w-full text-xs">
                            <thead className="sticky top-0">
                              <tr className="border-b border-border bg-card">
                                {Object.keys(excelPreview[0]).map((k) => (
                                  <th key={k} className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground">
                                    {k}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {excelPreview.map((row, i) => (
                                <tr key={i} className="border-b border-border/50">
                                  {Object.entries(row).map(([k, v]) => (
                                    <td key={k} className="whitespace-nowrap px-3 py-1.5">
                                      {k === "Scope" && v !== "-" ? (
                                        <span className={cn(
                                          "inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium border",
                                          v === "Scope 1" ? "bg-taupe-50 text-taupe-600 border-taupe-200"
                                            : v === "Scope 2" ? "bg-green-50 text-carbon-success border-green-200"
                                              : "bg-sky-50 text-sky-600 border-sky-200"
                                        )}>
                                          {v}
                                        </span>
                                      ) : v}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Scope 매핑 안내 */}
                <div className="flex items-start gap-2.5 rounded-lg border border-sky-200 bg-sky-50 p-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                  <p className="text-xs leading-relaxed text-sky-700">
                    <span className="font-semibold">Scope 매핑 안내:</span> Excel의 &quot;Scope&quot; 컬럼 값(Scope 1 / 2 / 3)에 따라
                    해당 배출 범위에 자동 분류됩니다. 온실가스 지표는 반드시 Scope 값을 입력해 주세요.
                  </p>
                </div>
              </TabsContent>

              {/* ─── Tab 3: API 연동 ─── */}
              <TabsContent value="api" className="mt-5 space-y-4">
                {/* Scope 필터 카드 */}
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { scope: "scope1" as ScopeType, label: "Scope 1", desc: "직접배출", sources: ["Emission Engine"], count: API_SOURCES.filter((s) => s.scope === "scope1").length },
                    { scope: "scope2" as ScopeType, label: "Scope 2", desc: "간접배출", sources: ["KEPCO API", "지역난방공사"], count: API_SOURCES.filter((s) => s.scope === "scope2").length },
                    { scope: "scope3" as ScopeType, label: "Scope 3", desc: "가치사슬", sources: ["Supplier Portal"], count: API_SOURCES.filter((s) => s.scope === "scope3").length },
                  ]).map((s) => {
                    const isActive = scopeFilter === s.scope;
                    return (
                      <button
                        key={s.scope}
                        type="button"
                        onClick={() => setScopeFilter((prev) => prev === s.scope ? "all" : s.scope)}
                        className={cn(
                          "rounded-lg border p-3 text-left transition-all",
                          scopeColor(s.scope),
                          isActive
                            ? "ring-2 ring-offset-1 ring-current shadow-sm scale-[1.02]"
                            : "hover:shadow-sm hover:scale-[1.01]"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Zap className="h-3.5 w-3.5" />
                            <span className="text-xs font-semibold">{s.label}</span>
                          </div>
                          <span className={cn(
                            "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                            isActive ? "bg-current/20" : "bg-black/5"
                          )}>
                            {s.count}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] opacity-80">{s.desc}</p>
                        <div className="mt-2 space-y-0.5">
                          {s.sources.map((src) => (
                            <div key={src} className="flex items-center gap-1 text-[10px]">
                              <Link2 className="h-2.5 w-2.5" />
                              {src}
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* 필터 상태 표시 */}
                {scopeFilter !== "all" && (
                  <div className="flex items-center gap-2">
                    <span className={cn("inline-flex rounded px-2 py-0.5 text-[11px] font-medium border", scopeColor(scopeFilter))}>
                      {scopeLabel(scopeFilter)} 소스만 표시 중
                    </span>
                    <button
                      type="button"
                      onClick={() => setScopeFilter("all")}
                      className="text-[11px] text-muted-foreground hover:text-foreground underline"
                    >
                      전체 보기
                    </button>
                  </div>
                )}

                {/* API 소스 목록 */}
                <div className="space-y-2">
                  {API_SOURCES.filter((s) => scopeFilter === "all" || s.scope === scopeFilter).map((source) => {
                    const isSyncing = syncingId === source.id;
                    return (
                      <div
                        key={source.id}
                        className="flex items-center gap-4 rounded-lg border border-border p-3 transition-colors hover:bg-muted/20"
                      >
                        {/* 상태 표시등 */}
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className={cn(
                              "h-2.5 w-2.5 rounded-full",
                              source.status === "connected"
                                ? "bg-carbon-success"
                                : source.status === "syncing" || isSyncing
                                  ? "bg-yellow-400 animate-pulse"
                                  : "bg-muted-foreground/30"
                            )}
                          />
                        </div>

                        {/* 소스 정보 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{source.name}</span>
                            {source.scope !== "none" && (
                              <span className={cn("inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium border", scopeColor(source.scope))}>
                                {scopeLabel(source.scope)}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed truncate">
                            {source.description}
                          </p>
                          {source.lastSync && (
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                              마지막 동기화: {source.lastSync}
                              {source.dataPoints && ` · ${source.dataPoints}건`}
                            </p>
                          )}
                        </div>

                        {/* 액션 */}
                        <div className="shrink-0">
                          {source.status === "connected" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-xs"
                              disabled={isSyncing}
                              onClick={() => handleSync(source.id)}
                            >
                              {isSyncing ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3 w-3" />
                              )}
                              {isSyncing ? "동기화 중…" : "동기화"}
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                              <Plug className="h-3 w-3" />
                              연결
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 안내 */}
                <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    <p>
                      <span className="font-medium text-foreground">Scope 데이터 정합성 주의:</span>{" "}
                      환경 데이터의 Scope 1·2·3은 서로 다른 소스에서 연동되는 경우가 많습니다.
                    </p>
                    <ul className="mt-1.5 ml-3 list-disc space-y-0.5">
                      <li>Scope 1: Emission Engine 산정치와 ERP 활동 데이터 교차 검증 필요</li>
                      <li>Scope 2: KEPCO 전력 데이터와 계량기 IoT 데이터 대사 권장</li>
                      <li>Scope 3: 공급업체 제출 데이터의 산정 방법론(Activity/Spend/Supplier) 확인 필수</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <p className="text-[11px] text-muted-foreground">
              {tab === "direct" && "입력 후 상태: Pending → 검토 → Verified"}
              {tab === "excel" && excelPreview ? `${excelPreview.length}건 업로드 예정` : tab === "excel" ? "파일을 업로드하세요" : ""}
              {tab === "api" && `${API_SOURCES.filter((s) => s.status === "connected").length}개 소스 연결됨`}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                취소
              </Button>
              {tab === "direct" && (
                <Button
                  size="sm"
                  onClick={handleDirectSubmit}
                  disabled={!form.category || !form.indicatorName || !form.value || !form.period}
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  저장
                </Button>
              )}
              {tab === "excel" && (
                <Button size="sm" onClick={handleExcelSubmit} disabled={!excelPreview}>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  일괄 업로드
                </Button>
              )}
              {tab === "api" && (
                <Button size="sm" onClick={handleApiSubmit}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  전체 동기화
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
