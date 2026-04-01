 "use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { ScopeTabs } from "@/components/scope1/scope-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PenLine, BarChart3, ShieldCheck, Plug } from "lucide-react";
import { ApiIntegrationPanel } from "@/components/integrations/api-integration-panel";
import { cn, formatNumber } from "@/lib/utils";
import { ValidationInsightsCard } from "@/components/scope1/validation-insights-card";
import { AuditLogTable } from "@/components/scope1/audit-log-table";
import { ActionFooter, type DataStatus } from "@/components/scope1/action-footer";
import { EmissionTrendCard } from "@/components/scope1/emission-trend-card";
import { Scope3CategorySidebar } from "@/components/scope3/category-sidebar";
import {
  Scope3SourceInfoCard,
  type Scope3FacilityRow,
} from "@/components/scope3/source-info-card";
import { Scope3SourceReference } from "@/components/scope3/source-reference";
import type { Scope3CategoryConfig } from "@/components/emissions/scope3-monthly-input";
import type {
  PurchasedGoodsActivity,
  DataEntryMode,
} from "@/types/scope3-purchased";

import { useFacilities, useSaveFacilities } from "@/hooks/use-facilities";
import { useActivity, useSaveActivity } from "@/hooks/use-activity";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import type { HistoricalMonthly } from "@/components/scope1/validation-insights-card";
import { useEmployees } from "@/hooks/use-employees";
import { useWorksites } from "@/hooks/use-worksites";
import { calcEmployeeDailyEmission, getEmployeeCommuteFactorPerKm } from "@/lib/commute-factors";
import type { CommuteTransportType } from "@/types";
import { U7SourceInfoCard, type U7FacilityRow, getTransportLabel } from "@/components/scope3/u7-source-info-card";

const NOW = new Date();
const CURRENT_MONTH_IDX = NOW.getMonth(); // 0-indexed

const MONTH_LABELS = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];

const SCOPE3_CATEGORIES: Scope3CategoryConfig[] = [
  {
    id: "u1",
    label: "구입상품 및 서비스",
    group: "upstream",
    factorSource: "GHG Protocol Scope 3 Standard - Category 1 예시 계수",
  },
  {
    id: "u2",
    label: "자본재",
    group: "upstream",
    factorSource: "GHG Protocol Scope 3 Standard - Category 2 예시 계수",
  },
  {
    id: "u3",
    label: "연료·에너지 관련(기타)",
    group: "upstream",
    factorSource: "국가 배출계수 DB 또는 사내 기준 예시",
  },
  {
    id: "u4",
    label: "상류 수송 및 유통",
    group: "upstream",
    factorSource: "GHG Protocol Scope 3 Standard - Category 4 예시 계수",
  },
  {
    id: "u5",
    label: "사업장 폐기물",
    group: "upstream",
    factorSource: "GHG Protocol Scope 3 Standard - Category 5 예시 계수",
  },
  {
    id: "u6",
    label: "출장",
    group: "upstream",
    factorSource: "GHG Protocol Scope 3 Standard - Category 6 예시 계수",
  },
  {
    id: "u7",
    label: "직원 출퇴근",
    group: "upstream",
    factorSource: "GHG Protocol Scope 3 Standard - Category 7 예시 계수",
  },
  {
    id: "u8",
    label: "상류 임차자산",
    group: "upstream",
    factorSource: "GHG Protocol Scope 3 Standard - Category 8 예시 계수",
  },
  {
    id: "d1",
    label: "하류 수송 및 유통",
    group: "downstream",
    factorSource: "GHG Protocol Scope 3 Standard - Category 9 예시 계수",
  },
  {
    id: "d2",
    label: "판매제품 가공",
    group: "downstream",
    factorSource: "GHG Protocol Scope 3 Standard - Category 10 예시 계수",
  },
  {
    id: "d3",
    label: "판매제품 사용",
    group: "downstream",
    factorSource: "GHG Protocol Scope 3 Standard - Category 11 예시 계수",
  },
  {
    id: "d4",
    label: "판매제품 폐기",
    group: "downstream",
    factorSource: "GHG Protocol Scope 3 Standard - Category 12 예시 계수",
  },
  {
    id: "d5",
    label: "하류 임차자산",
    group: "downstream",
    factorSource: "GHG Protocol Scope 3 Standard - Category 13 예시 계수",
  },
  {
    id: "d6",
    label: "프랜차이즈",
    group: "downstream",
    factorSource: "GHG Protocol Scope 3 Standard - Category 14 예시 계수",
  },
  {
    id: "d7",
    label: "투자",
    group: "downstream",
    factorSource: "GHG Protocol Scope 3 Standard - Category 15 예시 계수",
  },
];

const INITIAL_ACTIVITIES: PurchasedGoodsActivity[] = [
  {
    id: "pg-1",
    categoryId: "u1",
    name: "강판 구매",
    supplier: "POSCO",
    method: "Activity Based",
    unit: "ton",
    emissionFactor: 2.1,
    status: "active",
  },
  {
    id: "pg-2",
    categoryId: "u1",
    name: "플라스틱 수지 구매",
    supplier: "LG Chem",
    method: "Spend Based",
    unit: "KRW",
    emissionFactor: 0.00045,
    status: "active",
  },
  {
    id: "pg-3",
    categoryId: "u1",
    name: "PCB 어셈블리 외주",
    supplier: "Supplier A",
    method: "Supplier Specific",
    unit: "kg",
    emissionFactor: 1.8,
    status: "active",
  },
  {
    id: "pg-4",
    categoryId: "u2",
    name: "CNC 가공 설비",
    supplier: "Machine Vendor A",
    method: "Activity Based",
    unit: "unit",
    emissionFactor: 35.5,
    status: "active",
  },
  {
    id: "pg-5",
    categoryId: "u2",
    name: "지게차 장비",
    supplier: "Logistics Provider",
    method: "Spend Based",
    unit: "KRW",
    emissionFactor: 0.00032,
    status: "active",
  },
  {
    id: "pg-6",
    categoryId: "u2",
    name: "건물 리트로핏",
    supplier: "Construction Co.",
    method: "Supplier Specific",
    unit: "m²",
    emissionFactor: 0.85,
    status: "active",
  },
  {
    id: "pg-7",
    categoryId: "u3",
    name: "연료 전처리 공정",
    supplier: "Energy Supplier A",
    method: "Activity Based",
    unit: "GJ",
    emissionFactor: 0.19,
    status: "active",
  },
  {
    id: "pg-8",
    categoryId: "u3",
    name: "송·배전 손실",
    supplier: "Grid Operator",
    method: "Spend Based",
    unit: "KRW",
    emissionFactor: 0.00012,
    status: "active",
  },
  {
    id: "pg-9",
    categoryId: "u3",
    name: "정제·수송 단계 배출",
    supplier: "Fuel Trader",
    method: "Supplier Specific",
    unit: "ton",
    emissionFactor: 0.35,
    status: "active",
  },
  {
    id: "pg-10",
    categoryId: "u4",
    name: "원자재 해상 운송",
    supplier: "Global Carrier",
    method: "Activity Based",
    unit: "ton·km",
    emissionFactor: 0.00023,
    status: "active",
  },
  {
    id: "pg-11",
    categoryId: "u4",
    name: "긴급 항공 운송",
    supplier: "Air Cargo Provider",
    method: "Spend Based",
    unit: "KRW",
    emissionFactor: 0.00018,
    status: "active",
  },
  {
    id: "pg-12",
    categoryId: "u4",
    name: "공장 간 내륙 운송",
    supplier: "Trucking Company",
    method: "Supplier Specific",
    unit: "pallet",
    emissionFactor: 0.42,
    status: "active",
  },
  {
    id: "pg-13",
    categoryId: "u5",
    name: "사무실 일반폐기물 수거",
    supplier: "Waste Contractor",
    method: "Activity Based",
    unit: "ton",
    emissionFactor: 0.85,
    status: "active",
  },
  {
    id: "pg-14",
    categoryId: "u5",
    name: "생산 스크랩 재활용",
    supplier: "Recycling Vendor",
    method: "Spend Based",
    unit: "KRW",
    emissionFactor: 0.00027,
    status: "active",
  },
  {
    id: "pg-15",
    categoryId: "u5",
    name: "위험 폐기물 소각",
    supplier: "Incineration Facility",
    method: "Supplier Specific",
    unit: "ton",
    emissionFactor: 1.95,
    status: "active",
  },
  {
    id: "pg-16",
    categoryId: "u6",
    name: "국내 출장 이동",
    supplier: "Travel Agency",
    method: "Activity Based",
    unit: "km",
    emissionFactor: 0.00018,
    status: "active",
  },
  {
    id: "pg-17",
    categoryId: "u6",
    name: "해외 항공 출장",
    supplier: "Airline",
    method: "Spend Based",
    unit: "KRW",
    emissionFactor: 0.00025,
    status: "active",
  },
  {
    id: "pg-18",
    categoryId: "u6",
    name: "출장 중 숙박",
    supplier: "Hotel Chain",
    method: "Supplier Specific",
    unit: "night",
    emissionFactor: 0.012,
    status: "active",
  },
  {
    id: "pg-19",
    categoryId: "u7",
    name: "자가용 출퇴근",
    supplier: "Employees",
    method: "Activity Based",
    unit: "km",
    emissionFactor: 0.00021,
    status: "active",
  },
  {
    id: "pg-20",
    categoryId: "u7",
    name: "대중교통 출퇴근",
    supplier: "Transit Operator",
    method: "Spend Based",
    unit: "KRW",
    emissionFactor: 0.00009,
    status: "active",
  },
  {
    id: "pg-21",
    categoryId: "u7",
    name: "회사 통근버스",
    supplier: "Shuttle Service",
    method: "Supplier Specific",
    unit: "km",
    emissionFactor: 0.00016,
    status: "active",
  },
  {
    id: "pg-22",
    categoryId: "u8",
    name: "임차 사무실",
    supplier: "Property Owner",
    method: "Activity Based",
    unit: "m²",
    emissionFactor: 0.055,
    status: "active",
  },
  {
    id: "pg-23",
    categoryId: "u8",
    name: "임차 물류창고",
    supplier: "Logistics Real Estate",
    method: "Spend Based",
    unit: "KRW",
    emissionFactor: 0.00014,
    status: "active",
  },
  {
    id: "pg-24",
    categoryId: "u8",
    name: "임차 설비·차량",
    supplier: "Leasing Company",
    method: "Supplier Specific",
    unit: "unit",
    emissionFactor: 0.62,
    status: "active",
  },
  {
    id: "pg-25",
    categoryId: "d1",
    name: "제품 해상 운송",
    supplier: "Global Carrier",
    method: "Activity Based",
    unit: "ton·km",
    emissionFactor: 0.00024,
    status: "active",
  },
  {
    id: "pg-26",
    categoryId: "d1",
    name: "리테일 유통",
    supplier: "Retail Logistics",
    method: "Spend Based",
    unit: "KRW",
    emissionFactor: 0.00019,
    status: "active",
  },
  {
    id: "pg-27",
    categoryId: "d1",
    name: "라스트마일 배송",
    supplier: "Courier Service",
    method: "Supplier Specific",
    unit: "stop",
    emissionFactor: 0.37,
    status: "active",
  },
  {
    id: "pg-28",
    categoryId: "d2",
    name: "부품 가공",
    supplier: "Tier-1 Supplier",
    method: "Activity Based",
    unit: "ton",
    emissionFactor: 1.25,
    status: "active",
  },
  {
    id: "pg-29",
    categoryId: "d2",
    name: "하도급 조립 생산",
    supplier: "Contract Manufacturer",
    method: "Spend Based",
    unit: "KRW",
    emissionFactor: 0.00031,
    status: "active",
  },
  {
    id: "pg-30",
    categoryId: "d2",
    name: "도장·코팅 공정",
    supplier: "Surface Treatment Vendor",
    method: "Supplier Specific",
    unit: "m²",
    emissionFactor: 0.73,
    status: "active",
  },
  {
    id: "pg-31",
    categoryId: "d3",
    name: "가전제품 전기사용",
    supplier: "End Customers",
    method: "Activity Based",
    unit: "kWh",
    emissionFactor: 0.00041,
    status: "active",
  },
  {
    id: "pg-32",
    categoryId: "d3",
    name: "산업설비 가동",
    supplier: "B2B Clients",
    method: "Spend Based",
    unit: "KRW",
    emissionFactor: 0.00029,
    status: "active",
  },
  {
    id: "pg-33",
    categoryId: "d3",
    name: "차량 연료 사용",
    supplier: "Fleet Customers",
    method: "Supplier Specific",
    unit: "km",
    emissionFactor: 0.00021,
    status: "active",
  },
  {
    id: "pg-34",
    categoryId: "d4",
    name: "지자체 폐기물 처리",
    supplier: "Local Waste Authority",
    method: "Activity Based",
    unit: "ton",
    emissionFactor: 0.92,
    status: "active",
  },
  {
    id: "pg-35",
    categoryId: "d4",
    name: "판매제품 재활용",
    supplier: "Recycling Partner",
    method: "Spend Based",
    unit: "KRW",
    emissionFactor: 0.00021,
    status: "active",
  },
  {
    id: "pg-36",
    categoryId: "d4",
    name: "폐제품 매립",
    supplier: "Landfill Operator",
    method: "Supplier Specific",
    unit: "ton",
    emissionFactor: 1.45,
    status: "active",
  },
  {
    id: "pg-37",
    categoryId: "d5",
    name: "임차 리테일 매장",
    supplier: "Retail Property Owner",
    method: "Activity Based",
    unit: "m²",
    emissionFactor: 0.047,
    status: "active",
  },
  {
    id: "pg-38",
    categoryId: "d5",
    name: "임차 물류센터",
    supplier: "Logistics Real Estate",
    method: "Spend Based",
    unit: "KRW",
    emissionFactor: 0.00016,
    status: "active",
  },
  {
    id: "pg-39",
    categoryId: "d5",
    name: "임차 배송 차량",
    supplier: "Leasing Company",
    method: "Supplier Specific",
    unit: "unit",
    emissionFactor: 0.58,
    status: "active",
  },
  {
    id: "pg-40",
    categoryId: "d6",
    name: "프랜차이즈 매장 전기사용",
    supplier: "Franchisees",
    method: "Activity Based",
    unit: "kWh",
    emissionFactor: 0.00039,
    status: "active",
  },
  {
    id: "pg-41",
    categoryId: "d6",
    name: "조리용 가스 사용",
    supplier: "Franchisees",
    method: "Spend Based",
    unit: "KRW",
    emissionFactor: 0.00027,
    status: "active",
  },
  {
    id: "pg-42",
    categoryId: "d6",
    name: "냉동·냉장 설비 부하",
    supplier: "Franchise Stores",
    method: "Supplier Specific",
    unit: "kWh",
    emissionFactor: 0.00044,
    status: "active",
  },
  {
    id: "pg-43",
    categoryId: "d7",
    name: "고배출 업종 지분투자",
    supplier: "Portfolio Companies",
    method: "Spend Based",
    unit: "KRW",
    emissionFactor: 0.00033,
    status: "active",
  },
  {
    id: "pg-44",
    categoryId: "d7",
    name: "인프라 프로젝트 파이낸싱",
    supplier: "Project SPVs",
    method: "Activity Based",
    unit: "ton",
    emissionFactor: 1.75,
    status: "active",
  },
  {
    id: "pg-45",
    categoryId: "d7",
    name: "기업채 투자",
    supplier: "Issuing Companies",
    method: "Supplier Specific",
    unit: "KRW",
    emissionFactor: 0.00027,
    status: "active",
  },
];


interface AddActivityModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (activity: PurchasedGoodsActivity) => void;
}

function AddActivityModal({ open, onClose, onSave }: AddActivityModalProps) {
  const [name, setName] = useState("");
  const [supplier, setSupplier] = useState("");
  const [method, setMethod] = useState<PurchasedGoodsActivity["method"]>(
    "Activity Based",
  );
  const [unit, setUnit] = useState("ton");
  const [factor, setFactor] = useState("0");
  const [source, setSource] = useState("");

  if (!open) return null;

  const handleSave = () => {
    const parsedFactor = parseFloat(factor || "0");
    const newActivity: PurchasedGoodsActivity = {
      id: `pg-${Date.now()}`,
      name: name || "New Activity",
      supplier: supplier || "-",
      method,
      unit: unit || "unit",
      emissionFactor: Number.isNaN(parsedFactor) ? 0 : parsedFactor,
      status: "active",
      source: source || undefined,
    };
    onSave(newActivity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-full max-w-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            활동 데이터 추가
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                활동명
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                공급사
              </label>
              <input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                산정방식
              </label>
              <select
                value={method}
                onChange={(e) =>
                  setMethod(e.target.value as PurchasedGoodsActivity["method"])
                }
                className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              >
                <option value="Activity Based">Activity Based</option>
                <option value="Spend Based">Spend Based</option>
                <option value="Supplier Specific">Supplier Specific</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                단위
              </label>
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                배출계수
              </label>
              <input
                type="number"
                min={0}
                step="any"
                value={factor}
                onChange={(e) => setFactor(e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <label className="text-xs font-medium text-muted-foreground">
                출처
              </label>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              />
            </div>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              취소
            </Button>
            <Button size="sm" onClick={handleSave}>
              저장
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Scope3Page() {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => String(currentYear - i));
  const [year, setYear] = useState(String(currentYear));
  const isCurrentYear = year === String(NOW.getFullYear());
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [mode, setMode] = useState<DataEntryMode>("manual");
  const [dataStatus, setDataStatus] = useState<DataStatus>("draft");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("u1");
  const [activities, setActivities] =
    useState<PurchasedGoodsActivity[]>(INITIAL_ACTIVITIES);
  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    INITIAL_ACTIVITIES[0]?.id ?? "",
  );
  const [monthlyActivityById, setMonthlyActivityById] = useState<
    Record<string, number[]>
  >(() =>
    Object.fromEntries(
      INITIAL_ACTIVITIES.map((a) => [a.id, Array(12).fill(0)]),
    ),
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 배출원 선택 상태 (u7 콤보 auto-sync에서 먼저 참조하므로 여기서 선언)
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("");

  // ─── 직원 출퇴근 (u7) 전용 상태 ────────────────────────────────────────────
  const isU7 = selectedCategoryId === "u7";
  const [u7WorkdaysMap, setU7WorkdaysMap] = useState<Record<string, number[]>>({});
  const [localU7Facilities, setLocalU7Facilities] = useState<U7FacilityRow[]>([]);

  // 사업장 목록 + 선택
  const { data: worksites = [] } = useWorksites();
  const [selectedWorksiteId, setSelectedWorksiteId] = useState<string>("");

  useEffect(() => {
    if (worksites.length > 0 && !selectedWorksiteId) {
      const defaultWs = worksites.find((w: any) => w.isDefault) ?? worksites[0];
      setSelectedWorksiteId(defaultWs.id);
    }
  }, [worksites, selectedWorksiteId]);

  // 직원 목록 전체 (u7 활성 시, 사업장·교통수단·연료 콤보를 행으로 표시하므로 전체 조회)
  const { data: employees = [], isLoading: employeesLoading } = useEmployees(
    undefined,
    isU7,
  );

  // 직원별 일일 통근 배출량 합계 (tCO₂e/day)
  // 자연키(사업장+사원번호 또는 사업장+이름) 기준 중복 제거 후 연결 직원 수
  const u7UniqueEmployeeCount = useMemo(() => {
    const seen = new Set<string>();
    for (const e of employees) {
      const key = e.employeeId
        ? `${e.worksiteId ?? ""}::id::${e.employeeId}`
        : `${e.worksiteId ?? ""}::name::${e.name}`;
      seen.add(key);
    }
    return seen.size;
  }, [employees]);

  // 한글 교통수단 → 영문 코드 변환
  const TRANSPORT_KO_TO_CODE: Record<string, string> = {
    "승용차": "car", "자가용": "car", "자동차": "car",
    "대중교통": "public", "버스": "public", "지하철": "public",
    "전기차": "ev", "전기·수소차": "ev", "수소차": "ev",
    "도보": "walk_bike", "자전거": "walk_bike", "도보·자전거": "walk_bike",
  };
  const VALID_TRANSPORTS = new Set(["car", "public", "ev", "walk_bike"]);
  const EV_FUELS = new Set(["전기차", "전기", "전기·수소", "수소"]);

  const normalizeTransport = (t: string | undefined, fuel?: string | undefined) => {
    // 연료가 전기/전기차/수소이면 교통수단을 ev로 분류
    if (fuel && EV_FUELS.has(fuel)) return "ev";
    if (!t) return "car";
    if (VALID_TRANSPORTS.has(t)) return t;
    return TRANSPORT_KO_TO_CODE[t] ?? "car";
  };

  // 연료 정규화 (ev/대중교통/도보는 연료 없음)
  const normalizeFuel = (fuel: string | undefined, transport: string) => {
    if (transport === "public" || transport === "ev" || transport === "walk_bike") return "";
    if (!fuel || EV_FUELS.has(fuel)) return "";
    return fuel; // 휘발유, 경유, LPG 등 그대로 유지
  };

  // 사업장+교통수단+연료 조합별 자동 행 생성 (직원명부 연동)
  const u7ComboRows = useMemo(() => {
    const map = new Map<string, { worksiteName: string; transport: string; fuel: string }>();
    for (const emp of employees) {
      const wsId = emp.worksiteId ?? "";
      const wsName = worksites.find((w) => w.id === wsId)?.name ?? (wsId || "미지정");
      const transport = normalizeTransport(emp.commuteTransport, emp.fuel);
      const fuel = normalizeFuel(emp.fuel, transport);
      const key = `${wsId}::${transport}::${fuel}`;
      if (!map.has(key)) map.set(key, { worksiteName: wsName, transport, fuel });
    }
    return Array.from(map.entries()).map(([key, g]) => ({
      id: key,
      worksiteName: g.worksiteName,
      commuteTransport: g.transport,
      fuel: g.fuel,
    })) as U7FacilityRow[];
  }, [employees, worksites]);

  // 선택된 배출원 행과 매핑되는 직원 (사업장+교통수단+연료 일치)
  const u7SelectedEmployees = useMemo(() => {
    if (!isU7) return [];
    const selectedRow =
      localU7Facilities.find((r) => r.id === selectedFacilityId) ??
      u7ComboRows.find((r) => r.id === selectedFacilityId);
    if (!selectedRow) return employees.filter((e) => (e.commuteDistanceKm ?? 0) > 0);
    return employees.filter((e) => {
      const empWsName =
        worksites.find((w) => w.id === e.worksiteId)?.name ??
        (e.worksiteId || "미지정");
      const empTransport = normalizeTransport(e.commuteTransport, e.fuel);
      const empFuel = normalizeFuel(e.fuel, empTransport);
      return (
        empWsName === selectedRow.worksiteName &&
        empTransport === selectedRow.commuteTransport &&
        empFuel === selectedRow.fuel
      );
    });
  }, [isU7, selectedFacilityId, localU7Facilities, u7ComboRows, employees, worksites]);

  // 거리 데이터 보유 직원 수 (선택된 배출원 기준)
  const u7EmployeesWithDistance = useMemo(
    () => u7SelectedEmployees.filter((e) => (e.commuteDistanceKm ?? 0) > 0),
    [u7SelectedEmployees],
  );

  // 선택된 배출원 행의 일별 배출량 합계 (매핑된 직원들의 편도거리×2×배출계수 합산)
  const u7SelectedDailyEmission = useMemo(() => {
    if (!isU7) return 0;
    return u7SelectedEmployees.reduce(
      (sum, emp) => {
        const t = normalizeTransport(emp.commuteTransport, emp.fuel) as CommuteTransportType;
        const f = normalizeFuel(emp.fuel, t);
        return sum + calcEmployeeDailyEmission(emp.commuteDistanceKm, t, f || undefined);
      },
      0,
    );
  }, [isU7, u7SelectedEmployees]);

  // 현재 선택된 배출원의 출근일 수 (없으면 기본값 22일)
  const u7Workdays = u7WorkdaysMap[selectedFacilityId] ?? Array(12).fill(0);
  const setU7Workdays = (updater: (prev: number[]) => number[]) => {
    if (!selectedFacilityId) return;
    setU7WorkdaysMap((prev) => ({
      ...prev,
      [selectedFacilityId]: updater(prev[selectedFacilityId] ?? Array(12).fill(0)),
    }));
  };

  // 월별 배출량 = 선택된 행의 일별 배출량 × 출근일 수
  const u7MonthlyEmissions = useMemo(
    () => u7Workdays.map((days) => u7SelectedDailyEmission * days),
    [u7SelectedDailyEmission, u7Workdays],
  );
  const u7TotalEmission = u7MonthlyEmissions.reduce((s, v) => s + v, 0);

  // 선택된 배출원의 km당 배출계수 (계산 근거 표시용)
  // localU7Facilities → u7ComboRows 순서로 행을 찾아 교통수단·연료 기반 계수 반환
  const u7SelectedFactorPerKm = useMemo(() => {
    const selectedRow =
      localU7Facilities.find((r) => r.id === selectedFacilityId) ??
      u7ComboRows.find((r) => r.id === selectedFacilityId);
    return getEmployeeCommuteFactorPerKm(
      (selectedRow?.commuteTransport || undefined) as CommuteTransportType | undefined,
      selectedRow?.fuel || undefined,
    );
  }, [localU7Facilities, selectedFacilityId, u7ComboRows]);

  // ─────────────────────────────────────────────────────────────────────────────

  // 배출원 정보 상태 (DB 연동 - 카테고리별)
  const { data: dbScope3Facilities } = useFacilities(3, selectedCategoryId, selectedWorksiteId || undefined);
  const saveFacilitiesMutation = useSaveFacilities(3, selectedCategoryId, selectedWorksiteId || undefined);
  const saveActivityMutation = useSaveActivity();

  // 선택된 배출원의 활동량 DB 로드 (시설 저장 후 재방문 시 복원)
  const { data: dbActivityValues } = useActivity(selectedFacilityId, year);
  const { data: auditLogs = [] } = useAuditLogs(selectedFacilityId, year);

  // 시설 전환 시 활동량 쿼리 강제 갱신
  useEffect(() => {
    if (selectedFacilityId) {
      queryClient.invalidateQueries({ queryKey: ["activity", selectedFacilityId, year] });
    }
  }, [selectedFacilityId, year, queryClient]);

  // 전년도 데이터 로드 (동월 비교용)
  const prevYear1 = String(parseInt(year) - 1);
  const prevYear2 = String(parseInt(year) - 2);
  const { data: prevYear1Activity } = useActivity(selectedFacilityId, prevYear1);
  const { data: prevYear2Activity } = useActivity(selectedFacilityId, prevYear2);

  const historicalMonthly = useMemo<HistoricalMonthly[]>(() => {
    const entries: HistoricalMonthly[] = [
      { year: prevYear1, values: prevYear1Activity ?? Array(12).fill(0) },
      { year: prevYear2, values: prevYear2Activity ?? Array(12).fill(0) },
    ];
    return entries.filter((h) => h.values.some((v) => v > 0));
  }, [prevYear1, prevYear2, prevYear1Activity, prevYear2Activity]);

  // DB 활동량을 로컬 상태에 반영 (u7=출근일 수, 일반=활동량)
  useEffect(() => {
    if (!selectedFacilityId || !dbActivityValues) return;
    if (isU7) {
      setU7WorkdaysMap((prev) => {
        // 로컬에 해당 시설 데이터가 없으면 DB에서 복원
        if (prev[selectedFacilityId] && prev[selectedFacilityId].some((v) => v !== 0)) return prev;
        return { ...prev, [selectedFacilityId]: dbActivityValues };
      });
    } else {
      setScope3LocalActivity((prev) => {
        if (prev[selectedFacilityId] && prev[selectedFacilityId].some((v) => v !== 0)) return prev;
        return { ...prev, [selectedFacilityId]: dbActivityValues };
      });
    }
  }, [isU7, selectedFacilityId, dbActivityValues]);
  const [localScope3Facilities, setLocalScope3Facilities] = useState<Scope3FacilityRow[]>([]);
  // 일반 카테고리 활동량 로컬 상태 (시설 ID 기반)
  const [scope3LocalActivity, setScope3LocalActivity] = useState<Record<string, number[]>>({});

  // 카테고리 또는 사업장 변경 시 로컬 상태 초기화
  useEffect(() => {
    setLocalScope3Facilities([]);
    setLocalU7Facilities([]);
    setSelectedFacilityId("");
    setU7WorkdaysMap({});
    setScope3LocalActivity({});
  }, [selectedCategoryId, selectedWorksiteId]);

  // 연도 변경 시 로컬 활동량 초기화
  useEffect(() => {
    setScope3LocalActivity({});
    setU7WorkdaysMap({});
  }, [year]);

  // u7: 직원명부 콤보 행이 로드되면 로컬 상태에 항상 반영 (직원명부 연동)
  useEffect(() => {
    if (!isU7 || u7ComboRows.length === 0) return;
    setLocalU7Facilities(u7ComboRows);
    setSelectedFacilityId((prev) => {
      const exists = u7ComboRows.some((r) => r.id === prev);
      return exists ? prev : (u7ComboRows[0]?.id ?? "");
    });
  }, [isU7, u7ComboRows]);

  // DB 데이터 로드 시 로컬 상태 동기화 (페이지 재방문 대응)
  useEffect(() => {
    if (!dbScope3Facilities) return;
    if (isU7) {
      // u7: facility_name=사업장명, activity_type=교통수단, fuel_type=연료
      if (dbScope3Facilities.length > 0) {
        const u7Rows: U7FacilityRow[] = dbScope3Facilities.map((r) => {
          const transport = normalizeTransport(r.activity_type ?? undefined);
          return {
            id: r.id,
            worksiteName: r.facility_name,
            commuteTransport: transport,
            fuel: normalizeFuel(r.fuel_type ?? undefined, transport),
          };
        });
        setLocalU7Facilities(u7Rows);
        setSelectedFacilityId((prev) => {
          const exists = u7Rows.some((r) => r.id === prev);
          return exists ? prev : (u7Rows[0]?.id ?? "");
        });
      }
      // DB가 비어있으면 u7ComboRows useEffect가 처리
    } else {
      const mapped: Scope3FacilityRow[] = dbScope3Facilities.map((r) => ({
        id: r.id,
        facilityName: r.facility_name,
        activityType: r.activity_type ?? "구입상품·서비스",
        unit: r.unit,
        dataMethod: r.data_method,
      }));
      setLocalScope3Facilities(mapped);
      setSelectedFacilityId((prev) => {
        const exists = mapped.some((r) => r.id === prev);
        return exists ? prev : (mapped[0]?.id ?? "");
      });
    }
  }, [dbScope3Facilities, isU7]);

  const scope3Facilities = localScope3Facilities;
  const selectedFacility = scope3Facilities.find((f) => f.id === selectedFacilityId);

  const handleSaveScope3Facilities = (rows: Scope3FacilityRow[]) => {
    saveFacilitiesMutation.mutate(rows.map((r, i) => ({
      id: r.id,
      scope: 3,
      category_id: selectedCategoryId,
      facility_name: r.facilityName,
      fuel_type: null,
      energy_type: null,
      activity_type: r.activityType,
      unit: r.unit,
      data_method: r.dataMethod,
      status: "active",
      sort_order: i,
    })));
    setLocalScope3Facilities(rows);
  };

  // u7 전용 저장: facility_name=사업장명, activity_type=교통수단, fuel_type=연료
  const handleSaveU7Facilities = (rows: U7FacilityRow[]) => {
    saveFacilitiesMutation.mutate(rows.map((r, i) => ({
      id: r.id,
      scope: 3,
      category_id: "u7",
      facility_name: r.worksiteName,
      fuel_type: r.fuel || null,
      energy_type: null,
      activity_type: r.commuteTransport,
      unit: "km",
      data_method: "계산값",
      status: "active",
      sort_order: i,
    })));
    setLocalU7Facilities(rows);
  };

  const filteredByCategory = activities.filter(
    (a) => (a.categoryId ?? "u1") === selectedCategoryId,
  );

  // 카테고리별로 최대 3개의 예시만 노출
  const visibleActivities =
    filteredByCategory.length > 0
      ? filteredByCategory.slice(0, 3)
      : activities.slice(0, 3);

  const selectedActivity =
    visibleActivities.find((a) => a.id === selectedActivityId) ??
    visibleActivities[0] ??
    activities[0];

  useEffect(() => {
    if (!selectedActivity && visibleActivities[0]) {
      setSelectedActivityId(visibleActivities[0].id);
    }
  }, [selectedActivity, visibleActivities]);

  // 시설 ID 기반으로 활동량 조회 (DB → 로컬 편집 → 기본값)
  const activityValues = useMemo(() => {
    if (!isU7 && selectedFacilityId && scope3LocalActivity[selectedFacilityId]) {
      return scope3LocalActivity[selectedFacilityId];
    }
    // fallback: 목업 활동 기반 (이전 호환용)
    return (selectedActivity &&
      monthlyActivityById[selectedActivity.id]) ||
      Array(12).fill(0);
  }, [isU7, selectedFacilityId, scope3LocalActivity, selectedActivity, monthlyActivityById]);

  const emissionFactor = selectedActivity?.emissionFactor ?? 0;

  const emissions = useMemo(
    () =>
      activityValues.map((v) => {
        const safe = Number.isNaN(v) ? 0 : v;
        return safe * emissionFactor;
      }),
    [activityValues, emissionFactor],
  );

  const totalEmission = emissions.reduce((sum, v) => sum + v, 0);

  // CO₂ 95%, CH₄ 3%, N₂O 2% 비율로 가스별 배출량 산출
  const gasEmissions = useMemo(() => ({
    co2: emissions.map((v) => v * 0.95),
    ch4: emissions.map((v) => v * 0.03),
    n2o: emissions.map((v) => v * 0.02),
  }), [emissions]);

  // 현재 활동량 (검증용)
  const currentInputValues = isU7 ? u7Workdays : activityValues;
  const hasErrors = currentInputValues.some((v) => v < 0);

  // 활동량 저장: u7 = 출근일 수, 일반 = 활동량 입력값
  const handleSaveActivity = () => {
    if (!selectedFacilityId) return;
    const values = isU7 ? u7Workdays : activityValues;
    const fid = selectedFacilityId;
    saveActivityMutation.mutate(
      { facilityId: fid, year, values },
      {
        onSuccess: () => {
          // 로컬 상태를 삭제하여 DB에서 다시 로드되도록 함
          if (isU7) {
            setU7WorkdaysMap((prev) => { const next = { ...prev }; delete next[fid]; return next; });
          } else {
            setScope3LocalActivity((prev) => { const next = { ...prev }; delete next[fid]; return next; });
          }
          toast.success("저장되었습니다.");
        },
        onError: () => {
          toast.error("저장에 실패했습니다.");
        },
      }
    );
  };

  // 검증 요청
  const handleRequestValidation = async () => {
    const catLabel = SCOPE3_CATEGORIES.find((c) => c.id === selectedCategoryId)?.label ?? selectedCategoryId;
    await fetch("/api/validations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save-validation",
        item: {
          id: crypto.randomUUID(),
          scope: "Scope 3",
          category: catLabel,
          emissionSource: isU7 ? "직원 출퇴근" : (selectedFacility?.facilityName ?? "미선택"),
          site: isU7 ? "직원 출퇴근" : (selectedFacility?.facilityName ?? "미선택"),
          period: year,
          activityAmount: String(currentInputValues.reduce((s, v) => s + v, 0).toFixed(3)),
          emissions: String(totalEmission.toFixed(4)),
          status: "submitted",
        },
      }),
    });
    setDataStatus("reviewing");
  };

  // 저장 (ActionFooter용)
  const handleSaveFromFooter = async () => {
    if (!selectedFacilityId) return;
    const values = isU7 ? u7Workdays : activityValues;
    await new Promise<void>((resolve, reject) => {
      saveActivityMutation.mutate(
        { facilityId: selectedFacilityId, year, values },
        { onSuccess: () => resolve(), onError: () => reject() },
      );
    });
  };

  const handleActivityValueChange = (index: number, raw: string) => {
    const v = raw === "" ? 0 : parseFloat(raw);
    const rounded = Number.isNaN(v) ? 0 : Math.round(v * 1000) / 1000;

    // 시설 ID 기반 로컬 상태에 저장 (DB 연동)
    if (selectedFacilityId) {
      setScope3LocalActivity((prev) => {
        const current = prev[selectedFacilityId] ?? activityValues;
        const next = [...current];
        next[index] = rounded;
        return { ...prev, [selectedFacilityId]: next };
      });
    }

    // 이전 호환: 목업 활동 기반 상태에도 반영
    setMonthlyActivityById((prev) => {
      const current = prev[selectedActivity.id] ?? Array(12).fill(0);
      const next = [...current];
      next[index] = rounded;
      return { ...prev, [selectedActivity.id]: next };
    });
  };

  const handleAddActivity = (activity: PurchasedGoodsActivity) => {
    const withCategory: PurchasedGoodsActivity = {
      ...activity,
      categoryId: selectedCategoryId,
    };
    setActivities((prev) => [...prev, withCategory]);
    setMonthlyActivityById((prev) => ({
      ...prev,
      [withCategory.id]: Array(12).fill(0),
    }));
    setSelectedActivityId(withCategory.id);
  };

  return (
    <div className="space-y-4">
      {/* 상단 헤더 */}
      <div className="space-y-1">
        <PageHeader
          title="Scope 3"
          description="구매한 원재료, 부품, 소모품 및 외주 서비스 데이터를 월별로 관리합니다."
          className="border-b-0 pb-2"
        >
          <div className="flex flex-col items-end gap-2">
            <ScopeTabs />
          </div>
        </PageHeader>
      </div>

      {/* 사업장 선택 */}
      {worksites.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">사업장:</span>
          <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-0.5">
            {worksites.map((ws) => (
              <button
                key={ws.id}
                type="button"
                onClick={() => { setSelectedWorksiteId(ws.id); setLocalScope3Facilities([]); setLocalU7Facilities([]); setScope3LocalActivity({}); setU7WorkdaysMap({}); }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedWorksiteId === ws.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {ws.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[200px,1fr]">
        {/* 좌측 Scope 3 카테고리 트리 (Scope 2와 유사한 위치/형태) */}
        <Scope3CategorySidebar
          categories={SCOPE3_CATEGORIES}
          selectedId={selectedCategoryId as any}
          onSelect={(id) => setSelectedCategoryId(id)}
        />

        {/* 우측 메인 콘텐츠 */}
        <Tabs defaultValue="input" className="space-y-5">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="input" className="gap-1.5 text-xs">
              <PenLine className="h-3.5 w-3.5" />
              데이터 입력
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-1.5 text-xs">
              <Plug className="h-3.5 w-3.5" />
              API 연동
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-1.5 text-xs">
              <BarChart3 className="h-3.5 w-3.5" />
              분석 &amp; 비교
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-1.5 text-xs">
              <ShieldCheck className="h-3.5 w-3.5" />
              검증 &amp; 이력
            </TabsTrigger>
          </TabsList>

          {/* ═══ Tab 1: 데이터 입력 ═══ */}
          <TabsContent value="input" className="space-y-6">
          {/* 배출원 정보 + 가이드 */}
          <div className="grid gap-3 lg:grid-cols-[1fr,484px] items-start">
            {isU7 ? (
              <U7SourceInfoCard
                rows={localU7Facilities}
                onRowsChange={setLocalU7Facilities}
                selectedId={selectedFacilityId}
                onSelect={setSelectedFacilityId}
                onSave={handleSaveU7Facilities}
                isSaving={saveFacilitiesMutation.isPending}
                worksites={worksites}
                savedFromDb={!!dbScope3Facilities && dbScope3Facilities.length > 0}
              />
            ) : (
              <Scope3SourceInfoCard
                rows={scope3Facilities}
                onRowsChange={setLocalScope3Facilities}
                selectedId={selectedFacilityId}
                onSelect={setSelectedFacilityId}
                onSave={handleSaveScope3Facilities}
                isSaving={saveFacilitiesMutation.isPending}
                savedFromDb={!!dbScope3Facilities && dbScope3Facilities.length > 0}
                worksiteName={worksites.find((w) => w.id === selectedWorksiteId)?.name}
              />
            )}
            <Scope3SourceReference
              activeCategoryId={selectedCategoryId}
              facilities={isU7
                ? localU7Facilities.map((f) => ({
                    id: f.id,
                    name: f.worksiteName,
                    activityType: `${getTransportLabel(f.commuteTransport)}${f.fuel ? ` · ${f.fuel}` : ""}`,
                    unit: "km",
                  }))
                : scope3Facilities.map((f) => ({
                    id: f.id,
                    name: f.facilityName,
                    activityType: f.activityType,
                    unit: f.unit,
                  }))
              }
            />
          </div>

          {/* 월별 입력 영역 */}
          <section className="space-y-3">
            {/* 공통 헤더 */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <h2 className="text-sm font-medium text-foreground">
                  {isU7 ? "월별 출근일 수 입력" : "월별 활동량 입력"}
                </h2>
                {!isU7 && selectedFacility?.facilityName && (
                  <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary">
                    {selectedFacility.facilityName}
                  </span>
                )}
                <div className="flex items-center gap-3 text-xs whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">연도</span>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="h-8 w-[110px] rounded-md border border-input bg-transparent px-3 py-1 text-xs"
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">데이터 상태</span>
                    <span className="inline-flex items-center rounded-full border border-border bg-taupe-50 px-2 py-0.5 text-[11px] font-medium text-carbon-warning">
                      Draft
                    </span>
                  </div>
                </div>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-3 text-xs">
                <div className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-1.5 py-0.5">
                  <button type="button" className={cn("rounded-full px-3 py-1 text-xs font-medium", mode === "manual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")} onClick={() => setMode("manual")}>직접 입력</button>
                  <button type="button" className={cn("rounded-full px-3 py-1 text-xs font-medium", mode === "excel" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")} onClick={() => setMode("excel")}>Excel 업로드</button>
                  <button type="button" className={cn("rounded-full px-3 py-1 text-xs font-medium", mode === "api" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")} onClick={() => setMode("api")}>API 연동</button>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="cursor-pointer border-border/70 bg-background text-[11px] text-muted-foreground hover:bg-muted">Excel 템플릿 다운로드</Badge>
                  <Badge variant="secondary" className="cursor-pointer text-[11px]">Excel 업로드</Badge>
                </div>
                <Button
                  size="sm"
                  onClick={handleSaveActivity}
                  disabled={!selectedFacilityId || saveActivityMutation.isPending}
                >
                  {saveActivityMutation.isPending ? "저장 중..." : "활동량 저장"}
                </Button>
              </div>
            </div>

            {/* u7: 직원 출퇴근 연동 안내 */}
            {isU7 && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-green-200 bg-green-50/60 px-3 py-2 text-xs dark:border-green-900/50">
                <span className="shrink-0 font-semibold text-green-700 dark:text-carbon-success">직원명부 연동</span>
                <span className="text-muted-foreground">
                  연결 직원: <span className="font-medium text-foreground">{u7UniqueEmployeeCount}명</span>
                </span>
                <span className="text-muted-foreground">
                  배출원 해당: <span className="font-medium text-foreground">{u7SelectedEmployees.length}명</span>
                </span>
                <span className="text-muted-foreground">
                  거리 등록: <span className="font-medium text-foreground">{u7EmployeesWithDistance.length}명</span>
                </span>
                <span className="text-muted-foreground">
                  선택 배출원 일 배출량: <span className="font-medium text-foreground">{(u7SelectedDailyEmission * 1000).toFixed(3)} kgCO₂e/일</span>
                </span>
                <span className="h-3 w-px shrink-0 bg-green-200" />
                <span className="text-muted-foreground">산식: 편도거리(km) × 2 × 배출계수(tCO₂e/km) × 출근일 수</span>
                {employeesLoading && <span className="text-muted-foreground italic">직원 데이터 로딩 중…</span>}
              </div>
            )}

            {/* 계산 근거 (u7) */}
            {isU7 && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs">
                <span className="shrink-0 font-semibold text-primary">계산 근거</span>
                <span className="shrink-0 text-muted-foreground">
                  편도거리(km)
                  <span className="mx-1.5 text-foreground">×</span>
                  2(왕복)
                  <span className="mx-1.5 text-foreground">×</span>
                  배출계수
                  <span className="mx-1 rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
                    {(u7SelectedFactorPerKm ?? 0).toExponential(4)} tCO₂e/km
                  </span>
                  <span className="mx-1.5 text-foreground">×</span>
                  출근일 수
                  <span className="mx-1.5 text-foreground">=</span>
                  배출량
                  <span className="ml-1 text-muted-foreground/60">(tCO₂e)</span>
                </span>
                <span className="h-3 w-px shrink-0 bg-primary/10" />
                <span className="text-muted-foreground">CO₂: <span className="ml-1 font-medium text-foreground">95%</span></span>
                <span className="text-muted-foreground">CH₄: <span className="ml-1 font-medium text-foreground">3%</span></span>
                <span className="text-muted-foreground">N₂O: <span className="ml-1 font-medium text-foreground">2%</span></span>
                <span className="h-3 w-px shrink-0 bg-primary/10" />
                <span className="text-muted-foreground">
                  출처: <span className="ml-1 text-foreground">국립환경과학원 국가 온실가스 배출·흡수계수 (NIER-2023)</span>
                </span>
              </div>
            )}

            {/* 계산 근거 (u7 제외) */}
            {!isU7 && selectedActivity && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs">
                <span className="shrink-0 font-semibold text-primary">계산 근거</span>
                <span className="shrink-0 text-muted-foreground">
                  활동량
                  <span className="mx-1 text-muted-foreground/60">({selectedActivity.unit})</span>
                  <span className="mx-1.5 text-foreground">×</span>
                  배출계수
                  <span className="mx-1 rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
                    {emissionFactor.toFixed(5)} tCO₂e/{selectedActivity.unit}
                  </span>
                  <span className="mx-1.5 text-foreground">=</span>
                  배출량
                  <span className="ml-1 text-muted-foreground/60">(tCO₂e)</span>
                </span>
                <span className="h-3 w-px shrink-0 bg-primary/10" />
                <span className="text-muted-foreground">CO₂: <span className="ml-1 font-medium text-foreground">95%</span></span>
                <span className="text-muted-foreground">CH₄: <span className="ml-1 font-medium text-foreground">3%</span></span>
                <span className="text-muted-foreground">N₂O: <span className="ml-1 font-medium text-foreground">2%</span></span>
                <span className="h-3 w-px shrink-0 bg-primary/10" />
                <span className="text-muted-foreground">
                  출처: <span className="ml-1 text-foreground">{selectedActivity.source ?? SCOPE3_CATEGORIES.find((c) => c.id === selectedCategoryId)?.factorSource ?? "-"}</span>
                </span>
              </div>
            )}

            {/* ─── u7: 출근일 수 입력 테이블 ─── */}
            {isU7 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                  <table className="w-full min-w-[1100px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                        <th className="w-28 px-3 py-2 text-left font-medium">구분</th>
                        {MONTH_LABELS.map((label, idx) => {
                          const isCurrent = isCurrentYear && idx === CURRENT_MONTH_IDX;
                          return (
                            <th key={label} className={cn("px-1 py-2 text-right font-medium", isCurrent && "bg-taupe-100/60 text-foreground")}>{label}</th>
                          );
                        })}
                        <th className="w-24 px-3 py-2 text-right font-medium">합계</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* 출근일 수 입력 */}
                      <tr className="border-b border-border/60">
                        <td className="px-3 py-2 text-xs font-medium">출근일 수 (일)</td>
                        {u7Workdays.map((days, idx) => (
                          <td key={idx} className={cn("px-1 py-2 text-right", isCurrentYear && idx === CURRENT_MONTH_IDX && "bg-taupe-50/60")}>
                            <input
                              type="number"
                              min={0}
                              max={31}
                              step={1}
                              value={days}
                              onChange={(e) => {
                                const v = parseInt(e.target.value) || 0;
                                setU7Workdays((prev) => { const next = [...prev]; next[idx] = v; return next; });
                              }}
                              className={cn(
                                "h-8 w-full min-w-0 rounded-md border border-input bg-transparent px-1 py-1 text-right text-xs ring-offset-background",
                                "focus:outline-none focus:ring-1 focus:ring-ring",
                                "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                              )}
                            />
                          </td>
                        ))}
                        <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                          {u7Workdays.reduce((s, v) => s + v, 0)}일
                        </td>
                      </tr>
                      {/* 배출량 (자동계산) */}
                      <tr className="border-b border-border/60">
                        <td className="px-3 py-2 text-xs font-medium">배출량 (tCO₂e)</td>
                        {u7MonthlyEmissions.map((v, idx) => (
                          <td key={idx} className={cn("px-2 py-2 text-right text-xs", isCurrentYear && idx === CURRENT_MONTH_IDX && "bg-taupe-50/60")}>{formatNumber(v, 4)}</td>
                        ))}
                        <td className="px-3 py-2 text-right text-xs font-semibold">
                          {formatNumber(u7TotalEmission, 4)} tCO₂e
                        </td>
                      </tr>
                      {/* 가스별 */}
                      <tr className="border-b border-border/60 bg-muted/20">
                        <td className="px-3 py-2 text-xs text-muted-foreground pl-5">CO₂ (tCO₂)</td>
                        {u7MonthlyEmissions.map((v, idx) => (
                          <td key={idx} className={cn("px-2 py-2 text-right text-xs text-muted-foreground", isCurrentYear && idx === CURRENT_MONTH_IDX && "bg-taupe-50/60")}>{formatNumber(v * 0.95, 4)}</td>
                        ))}
                        <td className="px-3 py-2 text-right text-xs text-muted-foreground">{formatNumber(u7TotalEmission * 0.95, 4)}</td>
                      </tr>
                      <tr className="border-b border-border/60 bg-muted/20">
                        <td className="px-3 py-2 text-xs text-muted-foreground pl-5">CH₄ (tCH₄)</td>
                        {u7MonthlyEmissions.map((v, idx) => (
                          <td key={idx} className={cn("px-2 py-2 text-right text-xs text-muted-foreground", isCurrentYear && idx === CURRENT_MONTH_IDX && "bg-taupe-50/60")}>{formatNumber(v * 0.03, 4)}</td>
                        ))}
                        <td className="px-3 py-2 text-right text-xs text-muted-foreground">{formatNumber(u7TotalEmission * 0.03, 4)}</td>
                      </tr>
                      <tr className="bg-muted/20">
                        <td className="px-3 py-2 text-xs text-muted-foreground pl-5">N₂O (tN₂O)</td>
                        {u7MonthlyEmissions.map((v, idx) => (
                          <td key={idx} className={cn("px-2 py-2 text-right text-xs text-muted-foreground", isCurrentYear && idx === CURRENT_MONTH_IDX && "bg-taupe-50/60")}>{formatNumber(v * 0.02, 4)}</td>
                        ))}
                        <td className="px-3 py-2 text-right text-xs text-muted-foreground">{formatNumber(u7TotalEmission * 0.02, 4)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 직원별 상세 (선택 배출원 매핑 직원) */}
                {u7SelectedEmployees.length > 0 && (
                  <div className="rounded-xl border border-border bg-card">
                    <div className="border-b border-border px-4 py-2.5">
                      <h3 className="text-xs font-medium text-foreground">직원별 통근 배출량 (일 기준)</h3>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-muted/40">
                          <tr className="border-b border-border text-muted-foreground">
                            <th className="px-3 py-2 text-left font-medium">이름</th>
                            <th className="px-3 py-2 text-left font-medium">부서</th>
                            <th className="px-3 py-2 text-left font-medium">교통수단</th>
                            <th className="px-3 py-2 text-right font-medium">편도 거리 (km)</th>
                            <th className="px-3 py-2 text-right font-medium">일 배출량 (kgCO₂e)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {u7SelectedEmployees.map((emp) => {
                            const empT = normalizeTransport(emp.commuteTransport, emp.fuel) as CommuteTransportType;
                            const empF = normalizeFuel(emp.fuel, empT);
                            const daily = calcEmployeeDailyEmission(
                              emp.commuteDistanceKm,
                              empT,
                              empF || undefined,
                            );
                            return (
                              <tr key={emp.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                                <td className="px-3 py-1.5">{emp.name}</td>
                                <td className="px-3 py-1.5 text-muted-foreground">{emp.department ?? "-"}</td>
                                <td className="px-3 py-1.5 text-muted-foreground">
                                  {getTransportLabel(empT)}{empF ? ` (${empF})` : ""}
                                </td>
                                <td className="px-3 py-1.5 text-right">{emp.commuteDistanceKm?.toFixed(1)}</td>
                                <td className="px-3 py-1.5 text-right font-medium">{(daily * 1000).toFixed(3)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {u7EmployeesWithDistance.length === 0 && !employeesLoading && (
                  <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center space-y-3">
                    <p className="text-xs text-muted-foreground">
                      출퇴근 거리가 등록된 직원이 없습니다.
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        if (isCalculatingDistance) return;
                        setIsCalculatingDistance(true);
                        try {
                          const res = await fetch("/api/distance", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ worksiteId: selectedWorksiteId || undefined }),
                          });
                          const data = await res.json();
                          if (!res.ok) {
                            alert(data.error);
                            return;
                          }
                          alert(`거리 계산 완료: ${data.updated}명 성공, ${data.failed}명 실패`);
                          queryClient.invalidateQueries({ queryKey: ["employees"] });
                        } finally {
                          setIsCalculatingDistance(false);
                        }
                      }}
                      disabled={isCalculatingDistance}
                      className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      {isCalculatingDistance ? "거리 계산 중..." : "카카오 API로 거리 일괄 계산"}
                    </button>
                    <p className="text-[10px] text-muted-foreground">
                      설정 &gt; API 키 관리에서 카카오 API 키를 먼저 등록하세요.
                    </p>
                  </div>
                )}
              </div>
            ) : (
            /* ─── 일반 카테고리: 기존 활동량 입력 테이블 ─── */
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full min-w-[1100px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                    <th className="w-24 px-3 py-2 text-left font-medium">구분</th>
                    {MONTH_LABELS.map((label, idx) => {
                      const isCurrent = isCurrentYear && idx === CURRENT_MONTH_IDX;
                      return (
                        <th key={label} className={cn("px-1 py-2 text-right font-medium", isCurrent && "bg-taupe-100/60 text-foreground")}>{label}</th>
                      );
                    })}
                    <th className="w-24 px-3 py-2 text-right font-medium">합계</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/60">
                    <td className="px-3 py-2 text-xs font-medium">
                      활동량{selectedActivity ? ` (${selectedActivity.unit})` : ""}
                    </td>
                    {MONTH_LABELS.map((_, idx) => (
                      <td key={idx} className={cn("px-1 py-2 text-right", isCurrentYear && idx === CURRENT_MONTH_IDX && "bg-taupe-50/60")}>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={activityValues[idx] ?? 0}
                          onChange={(e) => handleActivityValueChange(idx, e.target.value)}
                          className={cn(
                            "h-8 w-full min-w-0 rounded-md border border-input bg-transparent px-1 py-1 text-right text-xs ring-offset-background",
                            "focus:outline-none focus:ring-1 focus:ring-ring",
                            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                          )}
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                      {formatNumber(activityValues.reduce((sum, v) => sum + (Number.isNaN(v) ? 0 : v), 0), 2)}
                    </td>
                  </tr>
                  <tr className="border-b border-border/60">
                    <td className="px-3 py-2 text-xs font-medium">배출량 (tCO₂e)</td>
                    {emissions.map((v, idx) => (
                      <td key={idx} className={cn("px-2 py-2 text-right text-xs", isCurrentYear && idx === CURRENT_MONTH_IDX && "bg-taupe-50/60")}>{formatNumber(v, 2)}</td>
                    ))}
                    <td className="px-3 py-2 text-right text-xs font-semibold">{formatNumber(totalEmission, 2)} tCO₂e</td>
                  </tr>
                  <tr className="border-b border-border/60 bg-muted/20">
                    <td className="px-3 py-2 text-xs text-muted-foreground pl-5">CO₂ (tCO₂)</td>
                    {gasEmissions.co2.map((v, idx) => (
                      <td key={idx} className={cn("px-2 py-2 text-right text-xs text-muted-foreground", isCurrentYear && idx === CURRENT_MONTH_IDX && "bg-taupe-50/60")}>{formatNumber(v, 3)}</td>
                    ))}
                    <td className="px-3 py-2 text-right text-xs text-muted-foreground">{formatNumber(gasEmissions.co2.reduce((s, v) => s + v, 0), 3)}</td>
                  </tr>
                  <tr className="border-b border-border/60 bg-muted/20">
                    <td className="px-3 py-2 text-xs text-muted-foreground pl-5">CH₄ (tCH₄)</td>
                    {gasEmissions.ch4.map((v, idx) => (
                      <td key={idx} className={cn("px-2 py-2 text-right text-xs text-muted-foreground", isCurrentYear && idx === CURRENT_MONTH_IDX && "bg-taupe-50/60")}>{formatNumber(v, 3)}</td>
                    ))}
                    <td className="px-3 py-2 text-right text-xs text-muted-foreground">{formatNumber(gasEmissions.ch4.reduce((s, v) => s + v, 0), 3)}</td>
                  </tr>
                  <tr className="bg-muted/20">
                    <td className="px-3 py-2 text-xs text-muted-foreground pl-5">N₂O (tN₂O)</td>
                    {gasEmissions.n2o.map((v, idx) => (
                      <td key={idx} className={cn("px-2 py-2 text-right text-xs text-muted-foreground", isCurrentYear && idx === CURRENT_MONTH_IDX && "bg-taupe-50/60")}>{formatNumber(v, 3)}</td>
                    ))}
                    <td className="px-3 py-2 text-right text-xs text-muted-foreground">{formatNumber(gasEmissions.n2o.reduce((s, v) => s + v, 0), 3)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            )}
          </section>

          {/* 상태 문구 + 액션 버튼 */}
          <ActionFooter
            year={year}
            status={dataStatus}
            hasErrors={hasErrors}
            onRequestValidation={handleRequestValidation}
            onSave={handleSaveFromFooter}
          />
          </TabsContent>

          {/* ═══ Tab 2: API 연동 ═══ */}
          <TabsContent value="api">
            <ApiIntegrationPanel
              scope={3}
              facilities={scope3Facilities.map((f) => ({ id: f.id, name: f.facilityName, fuel: f.activityType, unit: f.unit }))}
              selectedFacilityId={selectedFacilityId}
              onSelectFacility={setSelectedFacilityId}
              year={year}
            />
          </TabsContent>

          {/* ═══ Tab 3: 분석 & 비교 ═══ */}
          <TabsContent value="analysis">
            <EmissionTrendCard
              monthlyTotals={isU7 ? u7MonthlyEmissions : emissions}
              label="Scope 3"
            />
          </TabsContent>

          {/* ═══ Tab 3: 검증 & 이력 ═══ */}
          <TabsContent value="audit" className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2 items-stretch">
              <ValidationInsightsCard activityByMonth={currentInputValues} year={year} historicalMonthly={historicalMonthly} />
              <div className="h-full">
                <AuditLogTable items={auditLogs} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AddActivityModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddActivity}
      />
    </div>
  );
}

