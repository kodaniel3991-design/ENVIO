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
  getEmployeeRoster,
  saveEmployeeRoster,
} from "@/services/api";
import { getOrganizationSettings } from "@/services/api/organization";
import type {
  EmployeeRosterItem,
  CommuteTransportType,
} from "@/types";
import { Ruler, Building2, Upload, Download } from "lucide-react";
import { CardActionBar } from "@/components/ui/card-action-bar";
import { toast } from "sonner";

const COMMUTE_TRANSPORT_OPTIONS: { value: CommuteTransportType; label: string }[] = [
  { value: "public", label: "대중교통" },
  { value: "car", label: "자가용" },
  { value: "ev", label: "전기·수소" },
  { value: "walk_bike", label: "도보·자전거" },
];

const EMPLOYMENT_STATUS_OPTIONS = ["재직", "휴직", "퇴사"];
const EMPLOYMENT_TYPE_OPTIONS = ["정규직", "계약직", "파견", "인턴", "기타"];
const GENDER_OPTIONS = ["남", "여", "기타", "미응답"];
const VEHICLE_FUEL_OPTIONS = ["휘발유", "경유", "LPG", "전기", "수소", "기타"];
const POSITION_OPTIONS = ["사원", "주임", "대리", "과장", "차장", "부장", "팀장", "이사", "상무", "전무", "부사장", "사장", "임원", "기타"];
const JOB_POSITION_OPTIONS = ["팀장", "파트장", "실장", "본부장", "센터장", "사업부장", "그룹장", "실무자", "기타"];

const inputClass =
  "h-7 w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1 ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring";

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

  // 조직 구조 (부서/팀) 조회
  const { data: orgStructure } = useQuery({
    queryKey: ["org-structure"],
    queryFn: async () => {
      const res = await fetch("/api/org-structure");
      if (!res.ok) throw new Error("org-structure fetch failed");
      return res.json() as Promise<{
        departments: { id: string; name: string }[];
        teams: { id: string; departmentId: string | null; name: string; defaultDutyName: string | null }[];
        positions: { id: string; name: string }[];
        duties: { id: string; name: string }[];
      }>;
    },
  });
  const orgDepts = orgStructure?.departments ?? [];
  const orgTeams = orgStructure?.teams ?? [];
  const orgDuties = orgStructure?.duties ?? [];

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

  const saveMutation = useMutation<EmployeeRosterItem[], Error, EmployeeRosterItem[]>({
    mutationFn: (items) => saveEmployeeRoster(items, selectedWorksiteId ?? null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-roster"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const [list, setList] = useState<EmployeeRosterItem[]>([]);
  const listRef = useRef(list);
  useEffect(() => { listRef.current = list; }, [list]);
  useEffect(() => {
    if (roster) setList((roster as EmployeeRosterItem[]).map((e) => ({ ...e })));
  }, [roster]);

  // 엑셀 업로드 시 다른 사업장 직원 임시 보관 (저장 시 함께 처리)
  const [pendingOtherWs, setPendingOtherWs] = useState<EmployeeRosterItem[]>([]);

  // 행 선택 및 편집 상태
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<Record<string, EmployeeRosterItem>>({});
  // 체크박스 다중 선택
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleCheckAll = () => {
    setCheckedIds((prev) => prev.size === list.length ? new Set() : new Set(list.map((e) => e.id)));
  };

  // 탭 전환 시 편집 상태 초기화
  useEffect(() => {
    setSelectedId(null);
    setEditingId(null);
    setSnapshots({});
    setCheckedIds(new Set());
  }, [selectedWorksiteId]);

  const handleAdd = () => {
    const newId = `new-${Date.now()}`;
    setList((prev) => [
      ...prev,
      {
        id: newId,
        worksiteId: selectedWorksiteId ?? undefined,
        name: "",
        department: "",
        subTeam: "",
        isManager: false,
        employeeId: "",
        position: "",
        jobPosition: "",
        jobTitle: "",
        referenceDate: new Date().toISOString().split("T")[0],
        employmentStatus: "재직",
        employmentType: "",
        hireDate: "",
        gender: "",
        commuteTransport: undefined,
        fuel: "",
        address: "",
        addressDetail: "",
        commuteDistanceKm: undefined,
        memo: "",
      },
    ]);
    setSelectedId(newId);
    setEditingId(newId);
  };

  const handleEditStart = (emp: EmployeeRosterItem) => {
    setSnapshots((prev) => ({ ...prev, [emp.id]: { ...emp } }));
    setEditingId(emp.id);
  };

  const handleEditCancel = (id: string) => {
    const snap = snapshots[id];
    if (snap) {
      setList((prev) => prev.map((e) => (e.id === id ? snap : e)));
    } else {
      setList((prev) => prev.filter((e) => e.id !== id));
      setSelectedId(null);
    }
    setEditingId(null);
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
    setEditingId(null);
    setSnapshots((prev) => { const n = { ...prev }; delete n[id]; return n; });
    queryClient.invalidateQueries({ queryKey: ["employee-roster"] });
    queryClient.invalidateQueries({ queryKey: ["employees"] });
    toast.success("저장되었습니다.");
  };

  const handleRemove = (id: string) => {
    setList((prev) => prev.filter((e) => e.id !== id));
    setSelectedId(null);
    setEditingId(null);
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
    const headers = [
      "사업장명*", "부서", "소속팀", "사원번호", "이름*", "직급",
      "관리자여부(Y/N)", "재직상태", "고용형태", "입사일", "퇴사일",
      "휴직시작일", "휴직종료일",
      "성별", "출생연도", "국적", "외국인여부(Y/N)",
      "장애여부(Y/N)", "장애유형",
      "출퇴근교통수단", "연료", "주소",
      "비고",
    ];
    const note = [
      "※ 사업장명·이름 필수. " +
      "관리자여부: Y/N (미입력 시 직급으로 자동 판단)  " +
      "재직상태: 재직/휴직/퇴사  " +
      "고용형태: 정규직/계약직/파견/인턴/기타  " +
      "성별: 남/여/기타/미응답  " +
      "외국인여부: Y/N (미입력 시 국적으로 자동 판단)  " +
      "장애유형: 중증/경증  " +
      "출퇴근교통수단: 대중교통/자가용/전기·수소/도보·자전거  " +
      "연료: 휘발유/경유/LPG/전기/수소  " +
      "입사일·퇴사일·휴직일: YYYY-MM-DD"
    ];
    const exampleRow = [
      "인천본사", "생산3본부", "생산1팀", "00030101", "홍길동", "과장",
      "Y", "재직", "정규직", "2020-03-15", "",
      "", "",
      "남", "1985", "한국", "N",
      "N", "",
      "자가용", "휘발유", "인천광역시 남동구 은봉로 116 (논현동)",
      "",
    ];
    const ws1 = XLSXStyle.utils.aoa_to_sheet([note, headers, exampleRow]);
    ws1["!cols"] = headers.map((h) =>
      ["사업장명*", "주소"].includes(h) ? { wch: 26 } :
      ["부서", "소속팀", "이름*", "출퇴근교통수단", "관리자여부(Y/N)", "외국인여부(Y/N)"].includes(h) ? { wch: 16 } :
      ["휴직시작일", "휴직종료일"].includes(h) ? { wch: 14 } :
      { wch: 13 }
    );

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
    // 예시 행(3행) 회색 이탤릭 스타일 적용
    for (let c = 0; c < headers.length; c++) {
      const cellRef = XLSXStyle.utils.encode_cell({ r: 2, c });
      if (ws1[cellRef]) {
        ws1[cellRef].s = {
          font: { sz: 10, name: "맑은 고딕", italic: true, color: { rgb: "999999" } },
        };
      }
    }

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
          "대중교통": "public",   "public": "public",   "버스": "public",   "지하철": "public",
          "자가용": "car",        "car": "car",          "승용차": "car",    "자동차": "car",
          "자가용(휘발유)": "car", "자가용(경유)": "car", "자가용(lpg)": "car",
          "전기차": "ev",         "전기·수소": "ev",     "ev": "ev",         "수소차": "ev",
          "도보": "walk_bike",    "자전거": "walk_bike", "도보·자전거": "walk_bike", "walk_bike": "walk_bike",
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
          const byStr = (colName: string) => String(r[col(colName)] ?? "").trim() || undefined;
          const byNum = (colName: string) => {
            const v = parseFloat(String(r[col(colName)] ?? ""));
            return isNaN(v) || v <= 0 ? undefined : v;
          };
          newItems.push({
            id: `xl-${Date.now()}-${i}`,
            worksiteId: resolvedWsId,
            department: byStr("부서"),
            subTeam: byStr("소속팀"),

            name,
            employeeId: byStr("사원번호"),
            position: byStr("직급"),
            jobPosition: byStr("직무(소속팀 자동연결)") ?? byStr("직무"),
            referenceDate: byStr("기준일(자동생성-오늘날짜)") ?? byStr("기준일") ?? new Date().toISOString().split("T")[0],
            employmentStatus: byStr("재직상태"),
            employmentType: byStr("고용형태"),
            hireDate: byStr("입사일"),
            terminationDate: byStr("퇴사일"),
            gender: byStr("성별"),
            birthYear: (() => { const v = parseInt(String(r[col("출생연도")] ?? "")); return isNaN(v) ? undefined : v; })(),
            nationality: byStr("국적"),
            isDisabled: (() => { const v = String(r[col("장애여부(Y/N)")] ?? "").trim().toUpperCase(); return v === "Y" ? true : v === "N" ? false : undefined; })(),
            disabilityType: byStr("장애유형"),
            isManager: (() => {
              const MANAGER_POSITIONS = ["과장", "차장", "부장", "이사", "상무", "전무", "부사장", "대표이사"];
              const v = String(r[col("관리자여부(Y/N)")] ?? r[col("관리자(Y/N)")] ?? "").trim().toUpperCase();
              if (v === "Y") return true;
              if (v === "N") return false;
              const pos = String(r[col("직급")] ?? "").trim();
              return pos ? MANAGER_POSITIONS.includes(pos) : undefined;
            })(),
            isForeigner: (() => {
              const v = String(r[col("외국인여부(Y/N)")] ?? "").trim().toUpperCase();
              if (v === "Y") return true;
              if (v === "N") return false;
              // 미입력 시 국적으로 자동 판단
              const KOREAN = ["한국", "대한민국", "korea", "korean", "kr", "south korea"];
              const nat = String(r[col("국적")] ?? "").trim();
              if (!nat) return undefined;
              return !KOREAN.includes(nat.toLowerCase());
            })(),
            leaveStartDate: byStr("휴직시작일"),
            leaveEndDate: byStr("휴직종료일"),
            commuteTransport: TRANSPORT_MAP[rawTransport] ?? undefined,
            fuel: byStr("연료"),
            address: byStr("주소"),
            addressDetail: byStr("상세주소"),
            commuteDistanceKm: byNum("통근거리(km)"),
            memo: byStr("비고"),
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
    toast.loading("거리 계산 완료, 저장 중...", { id: tid });
    // 계산 후 자동 저장
    try {
      // list는 이미 calcEmployeeDistance에서 업데이트됨 — 최신 list를 직접 참조
      const latestList = listRef.current;
      const items = latestList.filter((e) => e.name.trim() !== "").map((e) => ({
        ...e,
        worksiteId: e.worksiteId ?? selectedWorksiteId ?? undefined,
      }));
      await saveEmployeeRoster(items, selectedWorksiteId ?? null);
      queryClient.invalidateQueries({ queryKey: ["employee-roster"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success(`${targets.length}명 거리 계산 및 저장 완료`, { id: tid });
    } catch {
      toast.error("거리 계산은 완료했지만 저장 중 오류가 발생했습니다.", { id: tid });
    }
  };

  return (
    <>
      <PageHeader
        title="임/직원 관리"
        description="Scope 3 직원 출퇴근에 사용할 직원 정보를 입력합니다. 사업장별로 직원을 등록하고 거리를 산출할 수 있습니다."
      />

      {/* 임·직원 명부 */}
      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">임·직원 명부</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleTemplateDownload}>
              <Download className="mr-1 h-4 w-4" /> 양식
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={worksites.length === 0}>
              <Upload className="mr-1 h-4 w-4" /> 업로드
            </Button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelUpload} />
            <Button variant="outline" size="sm" onClick={calcAllDistances} disabled={list.length === 0}>
              <Ruler className="mr-1 h-4 w-4" /> 거리 일괄 계산
            </Button>
            <CardActionBar
              isEditing={!!editingId}
              hasSelection={!!selectedId}
              onEdit={() => { if (selectedId) { const emp = list.find((e) => e.id === selectedId); if (emp) handleEditStart(emp); } }}
              onCancel={() => { if (editingId) handleEditCancel(editingId); }}
              onDelete={() => { if (selectedId && !editingId) handleRemove(selectedId); }}
              onSave={() => { if (editingId) handleRowSave(editingId); }}
              adds={[{ label: "추가", onClick: handleAdd }]}
            />
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
                    className={`relative rounded-md px-4 py-2 text-xs font-medium transition-colors ${
                      selectedWorksiteId === ws.id
                        ? "bg-primary text-primary-foreground shadow-sm"
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
                  <table className="w-full min-w-[2400px] text-[12px]">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="w-8 pb-2 pr-2 text-center">
                          <input type="checkbox" className="h-3.5 w-3.5" checked={list.length > 0 && checkedIds.size === list.length} onChange={toggleCheckAll} />
                        </th>
                        <th className="w-10 pb-2 pr-2 font-medium text-center">No</th>
                        <th className="w-28 pb-2 pr-2 font-medium">부서</th>
                        <th className="w-28 pb-2 pr-2 font-medium">소속팀</th>
                        <th className="w-28 pb-2 pr-2 font-medium">사원번호</th>
                        <th className="w-24 pb-2 pr-2 font-medium">이름</th>
                        <th className="w-20 pb-2 pr-2 font-medium">직급</th>
                        <th className="w-36 pb-2 pr-2 font-medium">직무</th>
                        <th className="w-24 pb-2 pr-2 font-medium">재직상태</th>
                        <th className="w-24 pb-2 pr-2 font-medium">고용형태</th>
                        <th className="w-28 pb-2 pr-2 font-medium">입사일</th>
                        <th className="w-20 pb-2 pr-2 font-medium">성별</th>
                        <th className="w-16 pb-2 pr-2 font-medium">외국인</th>
                        <th className="w-16 pb-2 pr-2 font-medium">장애여부</th>
                        <th className="w-16 pb-2 pr-2 font-medium">관리자</th>
                        <th className="w-32 pb-2 pr-2 font-medium">출퇴근 교통수단</th>
                        <th className="w-24 pb-2 pr-2 font-medium">연료</th>
                        <th className="min-w-[180px] pb-2 pr-2 font-medium">주소</th>
                        <th className="w-24 pb-2 pr-2 font-medium">거리(km)</th>
                        <th className="w-16 pb-2 pr-2 font-medium">계산</th>
                        <th className="w-32 pb-2 pr-2 font-medium">비고</th>
                        <th className="w-24 pb-2 pr-2 font-medium">등록일자</th>
                        <th className="w-24 pb-2 pr-2 font-medium">변경일자</th>
                        <th className="w-28 pb-2 pr-2 font-medium">기준일</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {list.map((emp, idx) => {
                        const isEditing = editingId === emp.id;
                        const transportLabel = COMMUTE_TRANSPORT_OPTIONS.find((o) => o.value === emp.commuteTransport)?.label ?? "";
                        return (
                        <tr
                          key={emp.id}
                          className={`align-middle cursor-pointer transition-colors ${selectedId === emp.id ? "bg-accent" : "hover:bg-muted/50"}`}
                          onClick={() => { if (!editingId) setSelectedId(emp.id); }}
                        >
                          <td className="py-1.5 pr-2 text-center" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" className="h-3.5 w-3.5" checked={checkedIds.has(emp.id)} onChange={() => toggleCheck(emp.id)} />
                          </td>
                          <td className="py-1.5 pr-2 text-center text-muted-foreground">{idx + 1}</td>
                          <td className="py-1.5 pr-2">
                            {isEditing ? (
                              <select
                                value={emp.department ?? ""}
                                onChange={(e) => {
                                  handleChange(emp.id, "department", e.target.value);
                                  handleChange(emp.id, "subTeam", "");
                                }}
                                className={inputClass}
                              >
                                <option value="">선택</option>
                                {orgDepts.map((d) => (
                                  <option key={d.id} value={d.name}>{d.name}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-[12px]">{emp.department || "-"}</span>
                            )}
                          </td>
                          <td className="py-1.5 pr-2">
                            {isEditing ? (
                              <select
                                value={emp.subTeam ?? ""}
                                onChange={(e) => {
                                  const teamName = e.target.value;
                                  handleChange(emp.id, "subTeam", teamName);
                                  // 기본 직무 자동 설정
                                  const matched = orgTeams.find((t) => t.name === teamName);
                                  if (matched?.defaultDutyName) {
                                    handleChange(emp.id, "jobPosition", matched.defaultDutyName);
                                  }
                                }}
                                className={inputClass}
                              >
                                <option value="">선택</option>
                                {orgTeams
                                  .filter((t) => {
                                    if (!emp.department) return true;
                                    const dept = orgDepts.find((d) => d.name === emp.department);
                                    return dept ? t.departmentId === dept.id : true;
                                  })
                                  .map((t) => (
                                    <option key={t.id} value={t.name}>{t.name}</option>
                                  ))}
                              </select>
                            ) : (
                              <span className="text-[12px]">{emp.subTeam || "-"}</span>
                            )}
                          </td>
                          <td className="py-1.5 pr-2">
                            {isEditing ? (
                              <input type="text" value={emp.employeeId ?? ""} onChange={(e) => handleChange(emp.id, "employeeId", e.target.value)} placeholder="사원번호" className={inputClass} />
                            ) : (
                              <span className="text-[12px]">{emp.employeeId || "-"}</span>
                            )}
                          </td>
                          <td className="py-1.5 pr-2">
                            {isEditing ? (
                              <input type="text" value={emp.name} onChange={(e) => handleChange(emp.id, "name", e.target.value)} placeholder="이름" className={inputClass} />
                            ) : (
                              <span className="text-[12px] font-medium">{emp.name}</span>
                            )}
                          </td>
                          <td className="py-1.5 pr-2">
                            {isEditing ? (
                              <select value={emp.position ?? ""} onChange={(e) => handleChange(emp.id, "position", e.target.value || undefined)} className={inputClass}>
                                <option value="">선택</option>
                                {POSITION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                              </select>
                            ) : (
                              <span className="text-[12px]">{emp.position || "-"}</span>
                            )}
                          </td>
                          <td className="py-1.5 pr-2">
                            {isEditing ? (
                              <select value={emp.jobPosition ?? ""} onChange={(e) => handleChange(emp.id, "jobPosition", e.target.value || undefined)} className={inputClass}>
                                <option value="">선택</option>
                                {orgDuties.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                              </select>
                            ) : (
                              <span className="text-[12px]">{emp.jobPosition || "-"}</span>
                            )}
                          </td>
                          <td className="py-1.5 pr-2">
                            {isEditing ? (
                              <select value={emp.employmentStatus ?? ""} onChange={(e) => handleChange(emp.id, "employmentStatus", e.target.value || undefined)} className={inputClass}>
                                <option value="">선택</option>
                                {EMPLOYMENT_STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                              </select>
                            ) : (
                              <span className="text-[12px]">{emp.employmentStatus || "-"}</span>
                            )}
                          </td>
                          <td className="py-1.5 pr-2">
                            {isEditing ? (
                              <select value={emp.employmentType ?? ""} onChange={(e) => handleChange(emp.id, "employmentType", e.target.value || undefined)} className={inputClass}>
                                <option value="">선택</option>
                                {EMPLOYMENT_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                              </select>
                            ) : (
                              <span className="text-[12px]">{emp.employmentType || "-"}</span>
                            )}
                          </td>
                          <td className="py-1.5 pr-2">
                            {isEditing ? (
                              <input type="date" value={emp.hireDate ?? ""} onChange={(e) => handleChange(emp.id, "hireDate", e.target.value)} className={inputClass} />
                            ) : (
                              <span className="text-[12px]">{emp.hireDate || "-"}</span>
                            )}
                          </td>
                          <td className="py-1.5 pr-2">
                            {isEditing ? (
                              <select value={emp.gender ?? ""} onChange={(e) => handleChange(emp.id, "gender", e.target.value || undefined)} className={inputClass}>
                                <option value="">선택</option>
                                {GENDER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                              </select>
                            ) : (
                              <span className="text-[12px]">{emp.gender || "-"}</span>
                            )}
                          </td>
                          <td className="py-1.5 pr-2 text-center">
                            <input
                              type="checkbox"
                              checked={!!emp.isForeigner}
                              disabled={!isEditing}
                              onChange={(e) => setList((prev) => prev.map((item) => item.id === emp.id ? { ...item, isForeigner: e.target.checked } : item))}
                              className="h-4 w-4"
                            />
                          </td>
                          <td className="py-1.5 pr-2 text-center">
                            <input
                              type="checkbox"
                              checked={!!emp.isDisabled}
                              disabled={!isEditing}
                              onChange={(e) => setList((prev) => prev.map((item) => item.id === emp.id ? { ...item, isDisabled: e.target.checked } : item))}
                              className="h-4 w-4"
                            />
                          </td>
                          <td className="py-1.5 pr-2 text-center">
                            <input
                              type="checkbox"
                              checked={!!emp.isManager}
                              disabled={!isEditing}
                              onChange={(e) => setList((prev) => prev.map((item) => item.id === emp.id ? { ...item, isManager: e.target.checked } : item))}
                              className="h-4 w-4"
                            />
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
                              <span className="text-[12px]">{transportLabel || "-"}</span>
                            )}
                          </td>
                          <td className="py-1.5 pr-2">
                            {isEditing ? (
                              <select value={emp.fuel ?? ""} onChange={(e) => handleChange(emp.id, "fuel", e.target.value || undefined)} className={inputClass}>
                                <option value="">선택</option>
                                {VEHICLE_FUEL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                              </select>
                            ) : (
                              <span className="text-[12px]">{emp.fuel || "-"}</span>
                            )}
                          </td>
                          <td className="py-1.5 pr-2">
                            {isEditing ? (
                              <input type="text" value={emp.address ?? ""} onChange={(e) => handleChange(emp.id, "address", e.target.value)} placeholder="주소" className={inputClass} />
                            ) : (
                              <span className="text-[12px]">{emp.address || "-"}</span>
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
                              <span className="text-[12px] font-medium">
                                {emp.commuteDistanceKm != null ? emp.commuteDistanceKm.toFixed(2) : "-"}
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 pr-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => calcEmployeeDistance(emp)} disabled={!(emp.address ?? "").trim()}>
                              <Ruler className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                          <td className="py-1.5 pr-2">
                            {isEditing ? (
                              <input type="text" value={emp.memo ?? ""} onChange={(e) => handleChange(emp.id, "memo", e.target.value)} placeholder="비고" className={inputClass} />
                            ) : (
                              <span className="text-[12px]">{emp.memo || "-"}</span>
                            )}
                          </td>
                          <td className="py-1.5 pr-2 text-xs text-muted-foreground whitespace-nowrap">{emp.createdAt ?? "-"}</td>
                          <td className="py-1.5 pr-2 text-xs text-muted-foreground whitespace-nowrap">{emp.updatedAt ?? "-"}</td>
                          <td className="py-1.5 pr-2 text-[12px] whitespace-nowrap">{emp.referenceDate || "-"}</td>
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
