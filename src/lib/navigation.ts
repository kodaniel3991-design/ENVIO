/**
 * CarbonOS 메뉴 설정 (한글 UI, 영문 route)
 * 1depth: 8개 (대시보드, 데이터 관리, 공급망 포털, ESG 관리, 분석, 감축 전략, 보고서, 설정)
 */

export type NavLinkItem = {
  href: string;
  label: string;
};

export type NavGroupItem = {
  label: string;
  children: NavLinkItem[];
};

/** 3depth: label + children only */
export type NavGroupWithChildren = {
  label: string;
  children: NavLinkItem[];
};

/** 2depth 그룹 (자식이 링크 배열) */
export type NavSectionItem = {
  label: string;
  href?: string;
  children: (NavLinkItem | NavGroupWithChildren)[];
};

/** 1depth 메뉴 아이템: 단일 링크 또는 섹션(2depth 그룹) */
export type NavItem =
  | { type: "link"; href: string; label: string }
  | { type: "section"; label: string; children: NavSectionItem[] };

function link(href: string, label: string): NavLinkItem {
  return { href, label };
}

function group(label: string, children: NavLinkItem[]): NavGroupWithChildren {
  return { label, children };
}

/** 최종 메뉴 트리 (한글 UI, 영문 path) */
export const NAV_ITEMS: NavItem[] = [
  {
    type: "link",
    href: "/dashboard",
    label: "대시보드",
  },
  {
    type: "section",
    label: "시작하기",
    children: [
      {
        label: "",
        children: [
          link("/getting-started", "진행 현황"),
          link("/getting-started/organization", "① 조직 설정"),
          link("/getting-started/facility", "② 사업장 설정"),
          link("/getting-started/scope", "③ Scope 설정"),
          link("/getting-started/kpi", "④ KPI 선택"),
          link("/getting-started/framework", "⑤ 공시 기준 선택"),
        ],
      },
    ],
  },
  {
    type: "section",
    label: "데이터 관리",
    children: [
      {
        label: "ESG 데이터",
        children: [
          link("/data/esg/environment", "(E)환경 데이터"),
          link("/data/esg/social", "(S)사회 데이터"),
          link("/data/esg/governance", "(G)거버넌스 데이터"),
        ],
      },
      {
        label: "배출량 관리",
        children: [
          link("/data/emissions/scope1", "Scope 1"),
          link("/data/emissions/scope2", "Scope 2"),
          link("/data/emissions/scope3", "Scope 3"),
          link("/data/emissions/factors", "배출계수 마스터"),
        ],
      },
      {
        label: "데이터 검증·승인",
        children: [
          link("/data/verification", "데이터 검증"),
          link("/data/approval", "데이터 승인 / 확정"),
        ],
      },
    ],
  },
  {
    type: "section",
    label: "공급망 포털",
    children: [
      {
        label: "",
        children: [
          link("/data/supply-chain/vendors", "협력사 포털"),
          link("/data/supply-chain/submissions", "공급망 데이터 수집"),
          link("/data/supply-chain/categories", "Scope 3 카테고리 관리"),
          link("/data/supply-chain/assessment", "공급망 ESG 평가"),
          link("/data/supply-chain/risk", "공급사 리스크 관리"),
          link("/data/supply-chain/invitations", "설문 / 요청 / 회신 관리"),
          link("/data/supply-chain/coverage", "공급망 통계 / 커버리지 분석"),
        ],
      },
    ],
  },
  {
    type: "section",
    label: "ESG 관리",
    children: [
      {
        label: "",
        children: [
          link("/materiality", "중대성 평가"),
          link("/materiality/issues", "ESG 이슈 관리"),
          link("/kpi/dashboard", "KPI 관리"),
          link("/kpi/targets", "목표 관리 (Targets)"),
          link("/reports/mapping", "공시 기준 관리"),
          link("/settings/organization", "ESG 정책 및 조직"),
          link("/esg/tasks", "과제 / 실행과제 관리"),
          link("/esg/calendar", "평가 주기 / 운영 캘린더"),
        ],
      },
    ],
  },
  {
    type: "section",
    label: "분석",
    children: [
      {
        label: "",
        children: [
          link("/insights", "ESG 대시보드"),
          link("/kpi/performance", "KPI 분석"),
          link("/analytics/emissions", "배출량 분석"),
          link("/analytics/anomalies", "AI 인사이트"),
          link("/analytics/scenarios", "시나리오 분석"),
          link("/analytics/carbon-flow", "벤치마킹 분석"),
        ],
      },
    ],
  },
  {
    type: "section",
    label: "감축 전략",
    children: [
      {
        label: "",
        children: [
          link("/action/targets", "감축 목표 관리"),
          link("/analytics/scenarios", "감축 시나리오"),
          link("/action/projects", "감축 프로젝트"),
          link("/action/progress", "감축 성과 관리"),
          link("/action/credits", "탄소 크레딧"),
          link("/action/roadmap", "감축 로드맵"),
        ],
      },
    ],
  },
  {
    type: "section",
    label: "보고서",
    children: [
      {
        label: "",
        children: [
          link("/reports/esg", "보고서 생성"),
          link("/reports/generated", "생성된 보고서"),
          link("/reports/frameworks/k-esg", "공시 프레임워크 관리"),
          link("/reports/mapping", "데이터 매핑 관리"),
          link("/reports/framework", "공시 제출 관리"),
          link("/reports/templates", "보고서 템플릿 관리"),
          link("/reports/audit-trail", "감사 추적"),
          link("/reports/attachments", "증빙자료 / 첨부파일 관리"),
        ],
      },
    ],
  },
  {
    type: "section",
    label: "설정",
    children: [
      {
        label: "",
        children: [
          link("/settings/organization", "조직 관리"),
          link("/settings/users", "사용자 관리"),
          link("/settings/roles", "권한 관리"),
          link("/settings/integrations", "데이터 연동 설정"),
          link("/settings/employee-roster", "임/직원 관리"),
          link("/settings/api-keys", "API 키 관리"),
          link("/settings/system", "시스템 설정"),
        ],
      },
    ],
  },
];

/** pathname → breadcrumb labels (경로별 한글 메뉴명) */
export const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "대시보드",
  "/dashboard/data-management": "데이터 관리",
  "/dashboard/data-management/validation": "데이터 검증",
  "/dashboard/data-management/approval-confirmation": "데이터 승인 / 확정",
  "/dashboard/supply-chain": "공급망 포털",
  "/dashboard/supply-chain/suppliers": "협력사 포털",
  "/": "대시보드",
  "/data": "데이터 관리",
  "/data/esg": "ESG 데이터",
  "/data/esg/environment": "환경 데이터",
  "/data/esg/social": "사회 데이터",
  "/data/esg/governance": "거버넌스 데이터",
  "/data/emissions/scope1": "Scope 1",
  "/data/emissions/scope2": "Scope 2",
  "/data/emissions/scope3": "Scope 3",
  "/data/emissions/factors": "배출계수 마스터",
  "/data/verification": "데이터 검증",
  "/data/approval": "데이터 승인 / 확정",
  "/data/supply-chain/vendors": "협력사 포털",
  "/data/supply-chain/submissions": "공급망 데이터 수집",
  "/data/supply-chain/categories": "Scope 3 카테고리 관리",
  "/data/supply-chain/assessment": "공급망 ESG 평가",
  "/data/supply-chain/risk": "공급사 리스크 관리",
  "/data/supply-chain/invitations": "설문 / 요청 / 회신 관리",
  "/data/supply-chain/coverage": "공급망 통계 / 커버리지 분석",
  "/data/supply-chain/verification": "데이터 검증",
  "/kpi": "ESG 관리",
  "/kpi/dashboard": "KPI 관리",
  "/kpi/categories": "KPI 카테고리",
  "/kpi/targets": "목표 관리 (Targets)",
  "/esg/tasks": "과제 / 실행과제 관리",
  "/esg/calendar": "평가 주기 / 운영 캘린더",
  "/kpi/history": "KPI 이력 관리",
  "/materiality": "중대성 평가",
  "/materiality/issues": "ESG 이슈 관리",
  "/settings/organization": "ESG 정책 및 조직",
  "/analytics": "분석",
  "/analytics/emissions": "배출량 분석",
  "/analytics/anomalies": "AI 인사이트",
  "/analytics/scenarios": "시나리오 분석",
  "/analytics/carbon-flow": "벤치마킹 분석",
  "/insights": "ESG 대시보드",
  "/kpi/performance": "KPI 분석",
  "/action": "감축 전략",
  "/action/targets": "감축 목표 관리",
  "/action/projects": "감축 프로젝트",
  "/action/progress": "감축 성과 관리",
  "/action/credits": "탄소 크레딧",
  "/action/roadmap": "감축 로드맵",
  "/reports": "보고서",
  "/reports/frameworks": "공시 프레임워크",
  "/reports/esg": "보고서 생성",
  "/reports/generated": "생성된 보고서",
  "/reports/frameworks/k-esg": "공시 프레임워크 관리",
  "/reports/mapping": "데이터 매핑 관리",
  "/reports/framework": "공시 제출 관리",
  "/reports/templates": "보고서 템플릿 관리",
  "/reports/audit-trail": "감사 추적",
  "/reports/attachments": "증빙자료 / 첨부파일 관리",
  "/reports/frameworks/gri": "GRI",
  "/reports/frameworks/issb": "ISSB",
  "/reports/frameworks/csrd": "CSRD",
  "/settings": "설정",
  "/settings/users": "사용자 관리",
  "/settings/roles": "권한 관리",
  "/settings/integrations": "데이터 연동 설정",
  "/settings/employee-roster": "임/직원 관리",
  "/settings/api-keys": "API 키 관리",
  "/settings/system": "시스템 설정",
};

/** pathname이 href와 일치하거나 해당 하위 경로인지 */
export function isActivePath(pathname: string | null | undefined, href: string): boolean {
  if (pathname == null || typeof pathname !== "string") return false;
  if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
  if (pathname === href) return true;
  if (href !== "/" && pathname.startsWith(href + "/")) return true;
  return false;
}

/** pathname에 해당하는 breadcrumb 배열 반환 (한글 메뉴명). pathname이 없으면 빈 배열 반환 */
export function getBreadcrumbs(pathname: string | null | undefined): { href: string; label: string }[] {
  if (pathname == null || typeof pathname !== "string") return [];
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { href: string; label: string }[] = [];
  let acc = "";
  for (let i = 0; i < segments.length; i++) {
    acc += (acc ? "/" : "") + segments[i];
    const fullPath = "/" + acc;
    const label = ROUTE_LABELS[fullPath] ?? segmentToLabel(segments[i]);
    crumbs.push({ href: fullPath, label });
  }
  if (crumbs.length > 0 && crumbs[0].label === "dashboard") {
    crumbs[0].label = "대시보드";
  }
  return crumbs;
}

function segmentToLabel(segment: string): string {
  const map: Record<string, string> = {
    data: "데이터 관리",
    kpi: "ESG 관리",
    materiality: "중대성 평가",
    analytics: "분석",
    insights: "ESG 대시보드",
    action: "감축 전략",
    reports: "보고서",
    settings: "설정",
    esg: "ESG 데이터",
    emissions: "배출량 관리",
    "supply-chain": "공급망 포털",
    frameworks: "공시 프레임워크",
  };
  return map[segment] ?? segment;
}
