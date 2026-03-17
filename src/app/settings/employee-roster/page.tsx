"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import XLSXStyle from "xlsx-js-style";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  calculateDistanceKm,
  getDistanceApiSettings,
  getEmployeeRoster,
  saveDistanceApiSettings,
  saveEmployeeRoster,
} from "@/services/api";
import { getOrganizationSettings } from "@/services/api/organization";
import type {
  DistanceApiProvider,
  DistanceApiSettings,
  EmployeeRosterItem,
  CommuteTransportType,
} from "@/types";
import { Plus, Trash2, Ruler, Save, Building2, Upload, Download, Pencil, X } from "lucide-react";
import { toast } from "sonner";

const COMMUTE_TRANSPORT_OPTIONS: { value: CommuteTransportType; label: string }[] = [
  { value: "public", label: "대중교통" },
  { value: "car", label: "자가용" },
  { value: "ev", label: "전기·수소" },
  { value: "walk_bike", label: "도보·자전거" },
];

const inputClass =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring";

function trimOptional(s: string | undefined): string | undefined {
  const t = s?.trim();
  return t === "" ? undefined : t;
}

/** 동일 사업장 내 중복 직원 탐지 (사원번호 우선, 없으면 이름 기준) */
function detectDuplicates(items: EmployeeRosterItem[]): string[] {
  const seen = new Map<string, string>();
  const dupes: string[] = [];
  for (const e of items) {
    const wsKey = e.worksiteId ?? "__none__";
    const naturalKey = e.employeeId?.trim()
      ? `${wsKey}::id::${e.employeeId.trim()}`
      : `${wsKey}::name::${e.name.trim().toLowerCase()}`;
    if (seen.has(naturalKey)) {
      dupes.push(e.name.trim());
    } else {
      seen.set(naturalKey, e.name.trim());
    }
  }
  return dupes;
}

export default function SettingsEmployeeRosterPage() {
  const queryClient = useQueryClient();

  // 조직/사업장 목록 조회
  const { data: orgData } = useQuery({
    queryKey: ["organization-settings"],
    queryFn: getOrganizationSettings,
  });
  const worksites = orgData?.worksites ?? [];

  // 선택된 사업장 (undefined = 아직 미초기화, null = 미배정)
  const [selectedWorksiteId, setSelectedWorksiteId] = useState<string | null | undefined>(undefined);

  // 사업장 목록 로드 시 첫 번째 사업장 자동 선택 (최초 1회)
  useEffect(() => {
    if (worksites.length > 0 && selectedWorksiteId === undefined) {
      setSelectedWorksiteId(worksites[0].id);
    }
  }, [worksites, selectedWorksiteId]);

  // 선택된 사업장의 주소 (거리 계산용)
  const selectedWorksite = worksites.find((w) => w.id === selectedWorksiteId);
  const worksiteAddress = selectedWorksite?.address ?? "";
  const worksiteAddressDetail = selectedWorksite?.addressDetail;

  // 전체 직원 목록 (사업장별 인원수 집계용)
  const { data: allRoster } = useQuery<EmployeeRosterItem[]>({
    queryKey: ["employee-roster"],
    queryFn: () => getEmployeeRoster(),
  });
  const worksiteCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const emp of allRoster ?? []) {
      const key = emp.worksiteId ?? "__none__";
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [allRoster]);

  // 직원 목록 조회 (선택된 사업장 기준)
  const { data: roster, isLoading } = useQuery<EmployeeRosterItem[]>({
    queryKey: ["employee-roster", selectedWorksiteId],
    queryFn: () => getEmployeeRoster(selectedWorksiteId),
  });

  const { data: distanceSettings } = useQuery({
    queryKey: ["commute-distance-api-settings"],
    queryFn: getDistanceApiSettings,
  });

  const saveMutation = useMutation<EmployeeRosterItem[], Error, EmployeeRosterItem[]>({
    mutationFn: (items) => saveEmployeeRoster(items, selectedWorksiteId ?? null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-roster"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const saveDistanceSettingsMutation = useMutation({
    mutationFn: saveDistanceApiSettings,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["commute-distance-api-settings"] }),
  });

  const [list, setList] = useState<EmployeeRosterItem[]>([]);
  useEffect(() => {
    if (roster) setList((roster as EmployeeRosterItem[]).map((e) => ({ ...e })));
  }, [roster]);

  // 엑셀 업로드 시 다른 사업장 직원 임시 보관 (저장 시 함께 처리)
  const [pendingOtherWs, setPendingOtherWs] = useState<EmployeeRosterItem[]>([]);

  // 행별 편집 모드
  const [editingIds, setEditingIds] = useState<Set<string>>(new Set());
  const [snapshots, setSnapshots] = useState<Record<string, EmployeeRosterItem>>({});

  // 탭 전환 시 편집 상태 초기화
  useEffect(() => {
    setEditingIds(new Set());
    setSnapshots({});
  }, [selectedWorksiteId]);

  const [distanceSettingsForm, setDistanceSettingsForm] = useState<DistanceApiSettings>({
    provider: "none",
    enabled: false,
    baseUrl: "",
    apiKey: "",
  });
  useEffect(() => {
    if (!distanceSettings) return;
    setDistanceSettingsForm({
      provider: distanceSettings.provider ?? "none",
      enabled: !!distanceSettings.enabled,
      baseUrl: distanceSettings.baseUrl ?? "",
      apiKey: distanceSettings.apiKey ?? "",
    });
  }, [distanceSettings]);

  const handleAdd = () => {
    const newId = `new-${Date.now()}`;
    setList((prev) => [
      ...prev,
      {
        id: newId,
        worksiteId: selectedWorksiteId ?? undefined,
        name: "",
        department: "",
        employeeId: "",
        commuteTransport: undefined,
        fuel: "",
        address: "",
        addressDetail: "",
        commuteDistanceKm: undefined,
      },
    ]);
    setEditingIds((prev) => new Set([...Array.from(prev), newId]));
  };

  const handleEditStart = (emp: EmployeeRosterItem) => {
    setSnapshots((prev) => ({ ...prev, [emp.id]: { ...emp } }));
    setEditingIds((prev) => new Set([...Array.from(prev), emp.id]));
  };

  const handleEditCancel = (id: string) => {
    const snap = snapshots[id];
    if (snap) {
      setList((prev) => prev.map((e) => (e.id === id ? snap : e)));
    } else {
      setList((prev) => prev.filter((e) => e.id !== id));
    }
    setEditingIds((prev) => { const n = new Set(Array.from(prev)); n.delete(id); return n; });
    setSnapshots((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleRowSave = async (id: string) => {
    const toSave = list
      .filter((e) => e.name.trim() !== "")
      .map((e) => ({
        ...e,
        worksiteId: e.worksiteId ?? selectedWorksiteId ?? undefined,
        department: trimOptional(e.department),
        name: e.name.trim(),
        employeeId: trimOptional(e.employeeId),
        commuteTransport: e.commuteTransport,
        fuel: trimOptional(e.fuel),
        address: trimOptional(e.address),
        addressDetail: trimOptional(e.addressDetail),
        commuteDistanceKm: e.commuteDistanceKm,
      }));
    const dupes = detectDuplicates(toSave);
    if (dupes.length > 0) {
      toast.error(`중복된 직원이 있습니다: ${dupes.join(", ")}`);
      return;
    }
    await saveEmployeeRoster(toSave, selectedWorksiteId ?? null);
    setEditingIds((prev) => { const n = new Set(Array.from(prev)); n.delete(id); return n; });
    setSnapshots((prev) => { const n = { ...prev }; delete n[id]; return n; });
    queryClient.invalidateQueries({ queryKey: ["employee-roster"] });
    queryClient.invalidateQueries({ queryKey: ["employees"] });
    toast.success("저장되었습니다.");
  };

  const handleRemove = (id: string) => {
    setList((prev) => prev.filter((e) => e.id !== id));
    setEditingIds((prev) => { const n = new Set(Array.from(prev)); n.delete(id); return n; });
  };

  const handleChange = (
    id: string,
    field: keyof EmployeeRosterItem,
    value: string | undefined
  ) => {
    setList((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              [field]:
                field === "commuteTransport"
                  ? (value as CommuteTransportType) || undefined
                  : value ?? "",
            }
          : e
      )
    );
  };

  const handleSave = async () => {
    const mapItem = (e: EmployeeRosterItem, fallbackWsId?: string | null) => ({
      ...e,
      worksiteId: e.worksiteId ?? fallbackWsId ?? undefined,
      department: trimOptional(e.department),
      name: e.name.trim(),
      employeeId: trimOptional(e.employeeId),
      commuteTransport: e.commuteTransport,
      fuel: trimOptional(e.fuel),
      address: trimOptional(e.address),
      addressDetail: trimOptional(e.addressDetail),
      commuteDistanceKm: e.commuteDistanceKm,
    });

    const currentItems = list.filter((e) => e.name.trim() !== "").map((e) => mapItem(e, selectedWorksiteId));
    const otherItems = pendingOtherWs.filter((e) => e.name.trim() !== "").map((e) => mapItem(e));

    // 사업장별 그룹화 저장
    const groups = new Map<string | null, EmployeeRosterItem[]>();
    for (const emp of [...currentItems, ...otherItems]) {
      const key = emp.worksiteId ?? null;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(emp);
    }
    const allItems = [...currentItems, ...otherItems];
    const dupes = detectDuplicates(allItems);
    if (dupes.length > 0) {
      toast.error(`중복된 직원이 있습니다: ${dupes.join(", ")}`);
      return;
    }

    const totalCount = allItems.length;
    const tid = toast.loading("저장 중...");
    try {
      for (const [wsId, emps] of Array.from(groups.entries())) {
        await saveEmployeeRoster(emps, wsId);
      }
      setPendingOtherWs([]);
      queryClient.invalidateQueries({ queryKey: ["employee-roster"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success(`${totalCount}명이 저장되었습니다.`, { id: tid });
    } catch {
      toast.error("저장 중 오류가 발생했습니다.", { id: tid });
    }
  };

  const handleSaveDistanceSettings = async () => {
    const payload: DistanceApiSettings = {
      provider: distanceSettingsForm.provider,
      enabled: !!distanceSettingsForm.enabled,
      baseUrl: trimOptional(distanceSettingsForm.baseUrl),
      apiKey: trimOptional(distanceSettingsForm.apiKey),
    };
    await saveDistanceSettingsMutation.mutateAsync(payload);
  };

  const calcEmployeeDistance = async (emp: EmployeeRosterItem) => {
    if (!(emp.address ?? "").trim()) return 0;
    const destination = worksiteAddress.trim() || selectedWorksite?.name || "";
    if (!destination) {
      toast.warning("사업장 주소가 등록되지 않아 거리를 계산할 수 없습니다.");
      return 0;
    }
    const km = await calculateDistanceKm({
      originAddress: emp.address ?? "",
      originDetail: emp.addressDetail,
      destinationAddress: destination,
      destinationDetail: worksiteAddress.trim() ? worksiteAddressDetail : undefined,
    });
    setList((prev) =>
      prev.map((e) => (e.id === emp.id ? { ...e, commuteDistanceKm: km } : e))
    );
    return km;
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 엑셀 양식 다운로드
  const handleTemplateDownload = () => {
    const headers = ["사업장명*", "부서", "이름*", "사원번호", "출퇴근교통수단", "연료", "주소", "통근거리(km)", "등록일자", "변경일자"];
    const note = ["※ 사업장명·이름 필수. 출퇴근교통수단: 대중교통/자가용/전기·수소/도보·자전거  연료: 휘발유/경유/LPG 등 (자가용 선택 시 입력). 통근거리: 편도 거리(km) 입력. 등록일자·변경일자는 자동 입력됩니다."];
    const ws1 = XLSXStyle.utils.aoa_to_sheet([note, headers]);
    ws1["!cols"] = headers.map((h) => ({ wch: h === "사업장명*" || h === "주소" ? 24 : 16 }));

    // 전체 셀 폰트 10pt 적용
    const applyFont = (ws: ReturnType<typeof XLSXStyle.utils.aoa_to_sheet>) => {
      for (const key of Object.keys(ws)) {
        if (key.startsWith("!")) continue;
        // eslint-disable-next-line
        const cell = ws[key] as { s?: object };
        cell.s = { ...(cell.s ?? {}), font: { sz: 10, name: "맑은 고딕" } };
      }
    };
    applyFont(ws1);

    // 사업장 목록 시트
    const wsiteRows = [
      ["사업장명", "주소", "상세주소"],
      ...worksites.map((w) => [w.name, w.address ?? "", w.addressDetail ?? ""]),
    ];
    const ws2 = XLSXStyle.utils.aoa_to_sheet(wsiteRows);
    ws2["!cols"] = [{ wch: 20 }, { wch: 30 }, { wch: 16 }];
    applyFont(ws2);

    const wb = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(wb, ws1, "직원명부");
    XLSXStyle.utils.book_append_sheet(wb, ws2, "사업장목록");
    XLSXStyle.writeFile(wb, "직원명부_양식.xlsx");
  };

  // 엑셀 업로드 파싱
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][];

        // 헤더 행 탐색 (이름* 또는 이름 포함 행)
        const headerIdx = rows.findIndex((r) =>
          r.some((c) => String(c ?? "").replace("*", "").trim() === "이름")
        );
        if (headerIdx < 0) { toast.error("헤더 행(이름)을 찾을 수 없습니다."); return; }

        const header = rows[headerIdx].map((c) => String(c ?? "").replace("*", "").trim());
        const col = (name: string) => header.indexOf(name);

        const TRANSPORT_MAP: Record<string, CommuteTransportType> = {
          "대중교통": "public",   "public": "public",
          "자가용": "car",        "car": "car",
          // 구버전 호환
          "자가용(휘발유)": "car", "자가용(경유)": "car", "자가용(lpg)": "car",
          "전기·수소": "ev",      "ev": "ev",
          "도보·자전거": "walk_bike", "walk_bike": "walk_bike",
        };

        // 사업장명 → ID 매핑 (대소문자·공백 무시)
        const wsMap = new Map(worksites.map((w) => [w.name.trim(), w.id]));

        const newItems: EmployeeRosterItem[] = [];
        for (let i = headerIdx + 1; i < rows.length; i++) {
          const r = rows[i];
          const name = String(r[col("이름")] ?? "").trim();
          if (!name) continue;
          const rawTransport = String(r[col("출퇴근교통수단")] ?? "").trim().toLowerCase();
          const rawWsName = String(r[col("사업장명")] ?? "").replace("*", "").trim();
          const resolvedWsId = wsMap.get(rawWsName) ?? selectedWorksiteId ?? undefined;
          newItems.push({
            id: `xl-${Date.now()}-${i}`,
            worksiteId: resolvedWsId,
            department: String(r[col("부서")] ?? "").trim() || undefined,
            name,
            employeeId: String(r[col("사원번호")] ?? "").trim() || undefined,
            commuteTransport: TRANSPORT_MAP[rawTransport] ?? undefined,
            fuel: String(r[col("연료")] ?? "").trim() || undefined,
            address: String(r[col("주소")] ?? "").trim() || undefined,
            addressDetail: String(r[col("상세주소")] ?? "").trim() || undefined,
            commuteDistanceKm: (() => {
              const distCol = col("통근거리(km)");
              if (distCol < 0) return undefined;
              const v = parseFloat(String(r[distCol] ?? ""));
              return isNaN(v) || v <= 0 ? undefined : v;
            })(),
          });
        }

        if (newItems.length === 0) { toast.error("유효한 데이터가 없습니다."); return; }

        // 현재 탭 사업장 직원만 표시, 나머지는 저장 시 처리
        const currentItems = newItems.filter((e) => (e.worksiteId ?? null) === selectedWorksiteId);
        const otherItems = newItems.filter((e) => (e.worksiteId ?? null) !== selectedWorksiteId);
        setList((prev) => [...prev, ...currentItems]);
        setPendingOtherWs((prev) => [...prev, ...otherItems]);

        const otherMsg = otherItems.length > 0 ? ` (다른 사업장 ${otherItems.length}명 포함)` : "";
        toast.info(`${newItems.length}명이 업로드되었습니다${otherMsg}. 저장 버튼을 눌러 반영하세요.`);
      } catch {
        toast.error("파일을 읽는 중 오류가 발생했습니다.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const calcAllDistances = async () => {
    const targets = list.filter((emp) => (emp.address ?? "").trim());
    if (targets.length === 0) {
      toast.warning("주소가 입력된 직원이 없습니다.");
      return;
    }
    const tid = toast.loading(`${targets.length}명 거리 계산 중...`);
    for (const emp of targets) {
      await calcEmployeeDistance(emp);
    }
    toast.success(`${targets.length}명 거리 계산 완료`, { id: tid });
  };

  return (
    <>
      <PageHeader
        title="직원명부"
        description="Scope 3 직원 출퇴근에 사용할 직원 정보를 입력합니다. 사업장별로 직원을 등록하고 거리를 산출할 수 있습니다."
      />

      {/* 거리 산출 API 설정 */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">거리 산출 API 설정</CardTitle>
          <Button
            size="sm"
            onClick={handleSaveDistanceSettings}
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
              checked={distanceSettingsForm.enabled}
              onChange={(e) =>
                setDistanceSettingsForm((p) => ({ ...p, enabled: e.target.checked }))
              }
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
                value={distanceSettingsForm.provider}
                onChange={(e) =>
                  setDistanceSettingsForm((p) => ({ ...p, provider: e.target.value as DistanceApiProvider }))
                }
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
                value={distanceSettingsForm.apiKey ?? ""}
                onChange={(e) =>
                  setDistanceSettingsForm((p) => ({ ...p, apiKey: e.target.value }))
                }
                placeholder="API Key"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Base URL (Custom)</label>
              <input
                value={distanceSettingsForm.baseUrl ?? ""}
                onChange={(e) =>
                  setDistanceSettingsForm((p) => ({ ...p, baseUrl: e.target.value }))
                }
                placeholder="https://example.com/distance"
                className={inputClass}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 직원 목록 */}
      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">직원 목록</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleTemplateDownload}>
              <Download className="mr-1 h-4 w-4" /> 양식
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={worksites.length === 0}>
              <Upload className="mr-1 h-4 w-4" /> 업로드
            </Button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} />
            <Button variant="outline" size="sm" onClick={calcAllDistances} disabled={list.length === 0}>
              <Ruler className="mr-1 h-4 w-4" /> 거리 일괄 계산
            </Button>
            <Button variant="outline" size="sm" onClick={handleAdd} disabled={worksites.length === 0}>
              <Plus className="mr-1 h-4 w-4" /> 추가
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
              <Save className="mr-1 h-4 w-4" />
              {saveMutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 사업장 탭 */}
          {worksites.length === 0 ? (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4 shrink-0" />
              <span>
                등록된 사업장이 없습니다.{" "}
                <a href="/settings/organization" className="font-medium underline underline-offset-2">
                  조직 및 사업장 설정
                </a>
                에서 사업장을 먼저 등록하세요.
              </span>
            </div>
          ) : (
            <>
              {/* 탭 */}
              <div className="mb-4 flex gap-1 border-b border-border">
                {worksites.map((ws) => (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => setSelectedWorksiteId(ws.id)}
                    className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                      selectedWorksiteId === ws.id
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {ws.name}
                      <span className={`rounded-full px-1.5 py-0.5 text-xs font-normal ${
                        selectedWorksiteId === ws.id
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {worksiteCountMap[ws.id] ?? 0}명
                      </span>
                    </span>
                    {selectedWorksiteId === ws.id && ws.address && (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        {ws.address}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* 선택된 사업장 직원 테이블 */}
              {isLoading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">불러오는 중...</p>
              ) : list.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  이 사업장에 등록된 직원이 없습니다. &quot;추가&quot;로 직원을 등록한 뒤 &quot;저장&quot;하세요.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1200px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="w-24 pb-2 pr-2 font-medium">부서</th>
                        <th className="w-24 pb-2 pr-2 font-medium">이름</th>
                        <th className="w-24 pb-2 pr-2 font-medium">사원번호</th>
                        <th className="w-32 pb-2 pr-2 font-medium">출퇴근 교통수단</th>
                        <th className="w-20 pb-2 pr-2 font-medium">연료</th>
                        <th className="min-w-[180px] pb-2 pr-2 font-medium">주소</th>
                        <th className="w-24 pb-2 pr-2 font-medium">거리(km)</th>
                        <th className="w-16 pb-2 pr-2 font-medium">계산</th>
                        <th className="w-24 pb-2 pr-2 font-medium">등록일자</th>
                        <th className="w-24 pb-2 pr-2 font-medium">변경일자</th>
                        <th className="w-10 pb-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {list.map((emp) => {
                        const isEditing = editingIds.has(emp.id);
                        const transportLabel = COMMUTE_TRANSPORT_OPTIONS.find((o) => o.value === emp.commuteTransport)?.label ?? "";
                        return (
                        <tr key={emp.id} className="align-middle">
                          <td className="py-1.5 pr-2">
                            {isEditing ? (
                              <input type="text" value={emp.department ?? ""} onChange={(e) => handleChange(emp.id, "department", e.target.value)} placeholder="부서" className={inputClass} />
                            ) : (
                              <span className="text-sm">{emp.department || "-"}</span>
                            )}
                          </td>
                          <td className="py-1.5 pr-2">
                            {isEditing ? (
                              <input type="text" value={emp.name} onChange={(e) => handleChange(emp.id, "name", e.target.value)} placeholder="이름" className={inputClass} />
                            ) : (
                              <span className="text-sm font-medium">{emp.name}</span>
                            )}
                          </td>
                          <td className="py-1.5 pr-2">
                            {isEditing ? (
                              <input type="text" value={emp.employeeId ?? ""} onChange={(e) => handleChange(emp.id, "employeeId", e.target.value)} placeholder="사원번호" className={inputClass} />
                            ) : (
                              <span className="text-sm">{emp.employeeId || "-"}</span>
                            )}
                          </td>
                          <td className="py-1.5 pr-2">
                            {isEditing ? (
                              <select value={emp.commuteTransport ?? ""} onChange={(e) => handleChange(emp.id, "commuteTransport", e.target.value || undefined)} className={inputClass}>
                                <option value="">선택</option>
                                {COMMUTE_TRANSPORT_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-sm">{transportLabel || "-"}</span>
                            )}
                          </td>
                          <td className="py-1.5 pr-2">
                            {isEditing ? (
                              <input type="text" value={emp.fuel ?? ""} onChange={(e) => handleChange(emp.id, "fuel", e.target.value)} placeholder="연료" className={inputClass} />
                            ) : (
                              <span className="text-sm">{emp.fuel || "-"}</span>
                            )}
                          </td>
                          <td className="py-1.5 pr-2">
                            {isEditing ? (
                              <input type="text" value={emp.address ?? ""} onChange={(e) => handleChange(emp.id, "address", e.target.value)} placeholder="주소" className={inputClass} />
                            ) : (
                              <span className="text-sm">{emp.address || "-"}</span>
                            )}
                          </td>
                          <td className="py-1.5 pr-2 text-right">
                            {isEditing ? (
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={emp.commuteDistanceKm ?? ""}
                                onChange={(e) => {
                                  const v = parseFloat(e.target.value);
                                  setList((prev) => prev.map((item) =>
                                    item.id === emp.id
                                      ? { ...item, commuteDistanceKm: isNaN(v) || v <= 0 ? undefined : v }
                                      : item
                                  ));
                                }}
                                placeholder="편도(km)"
                                className={inputClass}
                                style={{ width: 80 }}
                              />
                            ) : (
                              <span className="text-sm font-medium">
                                {emp.commuteDistanceKm != null ? emp.commuteDistanceKm.toFixed(2) : "-"}
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 pr-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => calcEmployeeDistance(emp)} disabled={!(emp.address ?? "").trim()}>
                              <Ruler className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                          <td className="py-1.5 pr-2 text-xs text-muted-foreground whitespace-nowrap">{emp.createdAt ?? "-"}</td>
                          <td className="py-1.5 pr-2 text-xs text-muted-foreground whitespace-nowrap">{emp.updatedAt ?? "-"}</td>
                          <td className="py-1.5">
                            {isEditing ? (
                              <div className="flex gap-1">
                                <Button type="button" size="sm" onClick={() => handleRowSave(emp.id)} disabled={!emp.name.trim()}>저장</Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => handleEditCancel(emp.id)}><X className="h-3.5 w-3.5" /></Button>
                              </div>
                            ) : (
                              <div className="flex gap-1">
                                <Button type="button" variant="outline" size="sm" onClick={() => handleEditStart(emp)}><Pencil className="h-3.5 w-3.5" /></Button>
                                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => handleRemove(emp.id)}>
                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
