"use client";

import { useState, useEffect, useCallback } from "react";

export type Industry =
  | "자동차"
  | "제조"
  | "건설"
  | "IT/소프트웨어"
  | "금융"
  | "유통"
  | "에너지"
  | "화학"
  | "식품"
  | "기타"
  | "";

export interface OrganizationData {
  companyName: string;
  industry: Industry;
  country: string;
  employeeCount: string;
  revenue: string;
}

export interface FacilityData {
  id: string;
  name: string;
  location: string;
  types: string[];
  energySources: string[];
  typeOptions?: Record<string, string[]>;
}

export interface ScopeData {
  scope1: boolean;
  scope2: boolean;
  scope3: boolean;
  scope3Categories: string[];
}

export interface KpiData {
  environmental: string[];
  social: string[];
  governance: string[];
}

export interface FrameworkData {
  selected: string[];
}

export interface WizardState {
  organization: OrganizationData;
  facilities: FacilityData[];
  scope: ScopeData;
  kpi: KpiData;
  framework: FrameworkData;
  completedSteps: number[];
}

const DEFAULT_STATE: WizardState = {
  organization: { companyName: "", industry: "", country: "대한민국", employeeCount: "", revenue: "" },
  facilities: [{ id: "1", name: "", location: "", types: [], energySources: [] }],
  scope: { scope1: true, scope2: true, scope3: true, scope3Categories: [] },
  kpi: { environmental: [], social: [], governance: [] },
  framework: { selected: [] },
  completedSteps: [],
};

export const DUMMY_STATE: WizardState = {
  organization: {
    companyName: "진양오토모티브",
    industry: "자동차",
    country: "대한민국",
    employeeCount: "1,000~5,000명",
    revenue: "300억~1조",
  },
  facilities: [
    { id: "1", name: "인천 본사", location: "인천광역시 남동구 인하로 100", types: ["사무실"], energySources: ["전기", "도시가스"] },
    { id: "2", name: "군산공장", location: "전라북도 군산시 산단로 200", types: ["공장"], energySources: ["전기", "도시가스", "경유"] },
    { id: "3", name: "김해공장", location: "경상남도 김해시 산업단지로 300", types: ["공장", "연구소"], energySources: ["전기", "LPG"] },
    { id: "4", name: "부산공장", location: "부산광역시 강서구 신호산단로 400", types: ["공장"], energySources: ["전기", "도시가스"] },
  ],
  scope: {
    scope1: true,
    scope2: true,
    scope3: true,
    scope3Categories: ["구매 제품 및 서비스", "상류 운송·물류", "출장", "통근", "사업장 폐기물"],
  },
  kpi: {
    environmental: ["온실가스 배출량(Scope 1+2)", "총 에너지 사용량", "공급망 탄소(Scope 3)", "용수 사용량", "폐기물 발생량", "재생에너지 비율"],
    social: ["산업재해율", "여성 관리자 비율", "교육훈련 시간", "이직률", "공급망 인권 실사"],
    governance: ["ESG 위원회 존재 여부", "공급망 리스크 평가율", "반부패 정책 존재 여부", "여성 이사 비율"],
  },
  framework: {
    selected: ["GRI", "K-ESG"],
  },
  completedSteps: [1, 2, 3, 4, 5], // 1:조직, 2:사업장, 3:Scope, 4:공시기준, 5:KPI
};

const STORAGE_KEY = "esg_setup_wizard";

// 모듈 레벨 구독 목록 — 같은 탭 내 모든 훅 인스턴스를 동기화
const listeners = new Set<() => void>();
function notifyAll() {
  queueMicrotask(() => listeners.forEach((fn) => fn()));
}

function loadFromStorage(): WizardState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.facilities) {
        parsed.facilities = parsed.facility
          ? [{ id: "1", types: parsed.facility.type ? [parsed.facility.type] : [], ...parsed.facility }]
          : DEFAULT_STATE.facilities;
        delete parsed.facility;
      }
      return parsed;
    }
  } catch {}
  return DEFAULT_STATE;
}

export function useWizardStore() {
  const [state, setState] = useState<WizardState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadFromStorage());
    setHydrated(true);

    const sync = () => setState(loadFromStorage());
    listeners.add(sync);
    return () => { listeners.delete(sync); };
  }, []);

  const save = useCallback((next: WizardState) => {
    setState(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); notifyAll(); } catch {}
  }, []);

  const loadDummy = useCallback(() => {
    setState(DUMMY_STATE);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(DUMMY_STATE)); notifyAll(); } catch {}
  }, []);

  const updateOrganization = useCallback((data: Partial<OrganizationData>) => {
    setState((prev) => {
      const next = { ...prev, organization: { ...prev.organization, ...data } };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); notifyAll(); } catch {}
      return next;
    });
  }, []);

  const addFacility = useCallback(() => {
    setState((prev) => {
      const newId = String(Date.now());
      const next = {
        ...prev,
        facilities: [...prev.facilities, { id: newId, name: "", location: "", types: [], energySources: [] }],
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); notifyAll(); } catch {}
      return next;
    });
  }, []);

  const updateFacilityById = useCallback((id: string, data: Partial<FacilityData>) => {
    setState((prev) => {
      const next = {
        ...prev,
        facilities: prev.facilities.map((f) => f.id === id ? { ...f, ...data } : f),
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); notifyAll(); } catch {}
      return next;
    });
  }, []);

  const removeFacility = useCallback((id: string) => {
    setState((prev) => {
      if (prev.facilities.length <= 1) return prev;
      const next = { ...prev, facilities: prev.facilities.filter((f) => f.id !== id) };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); notifyAll(); } catch {}
      return next;
    });
  }, []);

  const updateScope = useCallback((data: Partial<ScopeData>) => {
    setState((prev) => {
      const next = { ...prev, scope: { ...prev.scope, ...data } };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); notifyAll(); } catch {}
      return next;
    });
  }, []);

  const updateKpi = useCallback((data: Partial<KpiData>) => {
    setState((prev) => {
      const next = { ...prev, kpi: { ...prev.kpi, ...data } };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); notifyAll(); } catch {}
      return next;
    });
  }, []);

  const updateFramework = useCallback((data: Partial<FrameworkData>) => {
    setState((prev) => {
      const next = { ...prev, framework: { ...prev.framework, ...data } };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); notifyAll(); } catch {}
      return next;
    });
  }, []);

  const markStepComplete = useCallback((step: number) => {
    setState((prev) => {
      if (prev.completedSteps.includes(step)) return prev;
      const next = { ...prev, completedSteps: [...prev.completedSteps, step] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); notifyAll(); } catch {}
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT_STATE);
    try { localStorage.removeItem(STORAGE_KEY); notifyAll(); } catch {}
  }, []);

  const completionPct = Math.round((state.completedSteps.length / 5) * 100);

  return {
    state,
    hydrated,
    completionPct,
    updateOrganization,
    addFacility,
    updateFacilityById,
    removeFacility,
    updateScope,
    updateKpi,
    updateFramework,
    markStepComplete,
    save,
    reset,
    loadDummy,
  };
}

export const WIZARD_STEPS = [
  { step: 1, title: "조직 설정", subtitle: "Organization Setup", href: "/getting-started/organization" },
  { step: 2, title: "사업장 설정", subtitle: "Facility Setup", href: "/getting-started/facility" },
  { step: 3, title: "Scope 설정", subtitle: "Scope Setup", href: "/getting-started/scope" },
  { step: 4, title: "공시 기준 선택", subtitle: "Framework Setup", href: "/getting-started/framework" },
  { step: 5, title: "KPI 선택", subtitle: "KPI Setup", href: "/getting-started/kpi" },
];
