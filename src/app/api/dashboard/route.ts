import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthOrg, AuthError } from "@/lib/auth";

// 교통수단별 km당 배출계수 (tCO₂e/km) — commute-factors.ts와 동기화
const COMMUTE_FACTOR_PER_KM: Record<string, number> = {
  car: 0.000210, public: 0.0000899, ev: 0.0000404, walk_bike: 0,
};
const FUEL_FACTOR_PER_KM: Record<string, number> = {
  "휘발유": 0.000210, "경유": 0.000174, "LPG": 0.000152,
};
// 한글 교통수단 → 영문 코드
const TRANSPORT_MAP: Record<string, string> = {
  "승용차": "car", "자가용": "car", "대중교통": "public",
  "전기차": "ev", "도보": "walk_bike", "자전거": "walk_bike",
};

function getKmFactor(transport: string | null, fuel: string | null): number {
  const t = transport ? (TRANSPORT_MAP[transport] ?? transport) : "car";
  if (fuel === "전기차") return COMMUTE_FACTOR_PER_KM.ev ?? 0;
  if (t === "car" && fuel) return FUEL_FACTOR_PER_KM[fuel] ?? COMMUTE_FACTOR_PER_KM.car;
  return COMMUTE_FACTOR_PER_KM[t] ?? 0;
}

// 공통: 스코프별 배출량 집계 헬퍼
async function calcScopeEmissions(year: number, organizationId: number) {
  // 1) 일반 배출량 (activity × emission_factor) — 자기 조직만
  const rows = await prisma.$queryRaw<{ scope: number; month: number; total: number }[]>`
    SELECT ef.scope, ad.month,
           SUM(ad.activity_value * COALESCE(em.co2_factor, 0)) AS total
    FROM activity_data ad
    JOIN emission_facilities ef ON ad.facility_id = ef.id
    JOIN worksites ws ON ef.worksite_id = ws.id AND ws.organization_id = ${organizationId}
    LEFT JOIN LATERAL (
      SELECT co2_factor FROM emission_factor_master
      WHERE fuel_code = COALESCE(ef.fuel_type, ef.energy_type)
      LIMIT 1
    ) em ON true
    WHERE ad.year = ${year}
      AND ef.category_id != 'u7'
    GROUP BY ef.scope, ad.month
  `;

  // 자기 조직 사업장 ID 목록
  const orgWorksiteIds = (await prisma.worksite.findMany({
    where: { organizationId },
    select: { id: true },
  })).map((w) => w.id);

  // 2) Scope 3 U7 (직원 출퇴근)
  const u7Facilities = await prisma.emissionFacility.findMany({
    where: { scope: 3, categoryId: "u7", worksiteId: { in: orgWorksiteIds } },
  });
  if (u7Facilities.length > 0) {
    const u7Activity = await prisma.activityData.findMany({
      where: {
        facilityId: { in: u7Facilities.map((f) => f.id) },
        year,
      },
    });
    // 시설별 교통수단+연료로 매핑된 직원 찾기
    const employees = await prisma.employee.findMany({
      where: { commuteDistanceKm: { not: null } },
    });

    for (const fac of u7Facilities) {
      const facTransport = fac.activityType ? (TRANSPORT_MAP[fac.activityType] ?? fac.activityType) : "car";
      const facFuel = fac.fuelType === "전기차" ? null : fac.fuelType;
      const matchedEmps = employees.filter((e) => {
        const eTransport = e.commuteTransport ? (TRANSPORT_MAP[e.commuteTransport] ?? e.commuteTransport) : "car";
        const eFuel = e.fuel === "전기차" ? null : e.fuel;
        return (
          e.worksiteId === fac.worksiteId &&
          eTransport === facTransport &&
          (eFuel ?? "") === (facFuel ?? "")
        );
      });
      // 일일 배출량 합계 = Σ(편도km × 2 × 배출계수)
      const dailyTotal = matchedEmps.reduce((sum, emp) => {
        const km = Number(emp.commuteDistanceKm) || 0;
        const factor = getKmFactor(emp.commuteTransport, emp.fuel);
        return sum + km * 2 * factor;
      }, 0);

      // 월별: 출근일수 × dailyTotal
      const facActivity = u7Activity.filter((a) => a.facilityId === fac.id);
      for (const act of facActivity) {
        const workdays = Number(act.activityValue) || 0;
        const monthlyEmission = dailyTotal * workdays;
        if (monthlyEmission > 0) {
          rows.push({ scope: 3, month: act.month, total: monthlyEmission });
        }
      }
    }
  }

  return rows;
}

// GET /api/dashboard?type=summary|scope-breakdown|trends|kpis|trend-data|scope-donut|offset-summary|top-vendors|insights|notifications
export async function GET(req: NextRequest) {
  try {
    const { organizationId } = await getAuthOrg();
    const orgFilter = { organizationId };
    const type = req.nextUrl.searchParams.get("type") ?? "summary";
    const year = parseInt(req.nextUrl.searchParams.get("year") ?? String(new Date().getFullYear()));

    if (type === "summary") {
      const emRows = await prisma.$queryRaw<{ scope: number; total: number }[]>`
        SELECT ef.scope,
               SUM(ad.activity_value * COALESCE(em.co2_factor, 0)) AS total
        FROM activity_data ad
        JOIN emission_facilities ef ON ad.facility_id = ef.id
        JOIN worksites ws ON ef.worksite_id = ws.id AND ws.organization_id = ${organizationId}
        LEFT JOIN LATERAL (
          SELECT co2_factor FROM emission_factor_master
          WHERE fuel_code = COALESCE(ef.fuel_type, ef.energy_type)
          LIMIT 1
        ) em ON true
        WHERE ad.year = ${year}
        GROUP BY ef.scope
      `;

      const scopeMap: Record<number, number> = {};
      for (const row of emRows) {
        scopeMap[row.scope] = parseFloat(String(row.total)) || 0;
      }

      // KPI 달성률
      const kpiTotal = await prisma.kpiMaster.count({ where: orgFilter });
      const kpiEntered = await prisma.kpiPerformance.count({ where: orgFilter });

      // ESG 데이터 입력율
      const esgTotal = await prisma.esgMetric.count({ where: orgFilter });
      const esgFilled = await prisma.esgMetric.count({ where: { ...orgFilter, value: { not: null } } });

      // 협력사 현황
      const vendorTotal = await prisma.vendor.count({ where: orgFilter });
      const vendorActive = await prisma.vendor.count({ where: { ...orgFilter, status: "active" } });

      const scope1 = scopeMap[1] ?? 0;
      const scope2 = scopeMap[2] ?? 0;
      const scope3 = scopeMap[3] ?? 0;

      return NextResponse.json({
        emissions: {
          totalMtCO2e: scope1 + scope2 + scope3,
          scope1,
          scope2,
          scope3,
        },
        kpi: {
          total: kpiTotal,
          entered: kpiEntered,
        },
        esg: {
          total: esgTotal,
          filled: esgFilled,
        },
        vendors: {
          total: vendorTotal,
          active: vendorActive,
        },
      });
    }

    if (type === "scope-breakdown") {
      const rows = await prisma.$queryRaw<{ scope: number; total: number }[]>`
        SELECT ef.scope,
               SUM(ad.activity_value * COALESCE(em.co2_factor, 0)) AS total
        FROM activity_data ad
        JOIN emission_facilities ef ON ad.facility_id = ef.id
        JOIN worksites ws ON ef.worksite_id = ws.id AND ws.organization_id = ${organizationId}
        LEFT JOIN LATERAL (
          SELECT co2_factor FROM emission_factor_master
          WHERE fuel_code = COALESCE(ef.fuel_type, ef.energy_type)
          LIMIT 1
        ) em ON true
        WHERE ad.year = ${year}
        GROUP BY ef.scope
      `;
      return NextResponse.json(
        rows.map((r) => ({
          scope: `Scope ${r.scope}`,
          value: parseFloat(String(r.total)) || 0,
        }))
      );
    }

    if (type === "trends") {
      const rows = await prisma.$queryRaw<{ month: number; total: number }[]>`
        SELECT ad.month,
               SUM(ad.activity_value * COALESCE(em.co2_factor, 0)) AS total
        FROM activity_data ad
        JOIN emission_facilities ef ON ad.facility_id = ef.id
        JOIN worksites ws ON ef.worksite_id = ws.id AND ws.organization_id = ${organizationId}
        LEFT JOIN LATERAL (
          SELECT co2_factor FROM emission_factor_master
          WHERE fuel_code = COALESCE(ef.fuel_type, ef.energy_type)
          LIMIT 1
        ) em ON true
        WHERE ad.year = ${year}
        GROUP BY ad.month
        ORDER BY ad.month
      `;

      const months = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        value: 0,
      }));
      for (const row of rows) {
        months[row.month - 1].value = parseFloat(String(row.total)) || 0;
      }
      return NextResponse.json(months);
    }

    if (type === "kpis") {
      const masters = await prisma.kpiMaster.findMany({
        where: { ...orgFilter, reportIncluded: true },
        include: {
          targets: true,
          performance: true,
        },
        orderBy: { code: "asc" },
      });

      const kpis = masters.map((m) => {
        const target = m.targets[0] ? parseFloat(String(m.targets[0].targetValue)) : 0;
        const actual = m.performance[0] ? parseFloat(String(m.performance[0].actualValue)) : 0;
        const ratio = target > 0 ? actual / target : 0;
        const isLowerBetter = ["tCO2e", "tCO2e/억원", "%", "건"].includes(m.unit) && m.category !== "social";
        const onTrack = isLowerBetter ? actual <= target : actual >= target;
        const status = onTrack ? "on_track" : ratio > 0.9 ? "attention" : "anomaly";
        const trendDir = actual <= target ? "down" : "up";

        return {
          id: String(m.id),
          label: m.name,
          value: `${actual.toLocaleString()} ${m.unit}`,
          subLabel: `목표: ${target.toLocaleString()} ${m.unit}`,
          status,
          trendDirection: trendDir,
        };
      });
      return NextResponse.json(kpis);
    }

    if (type === "trend-data") {
      const rows = await calcScopeEmissions(year, organizationId);
      const monthNames = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
      const months: Record<number, any> = {};
      for (let m = 1; m <= 12; m++) {
        months[m] = { name: monthNames[m - 1], scope1: 0, scope2: 0, scope3: 0 };
      }
      for (const r of rows) {
        const key = `scope${r.scope}`;
        if (months[r.month]) months[r.month][key] = parseFloat(String(r.total)) || 0;
      }
      return NextResponse.json(Object.values(months));
    }

    if (type === "scope-donut") {
      const rows = await calcScopeEmissions(year, organizationId);
      const scopeTotals: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
      for (const r of rows) {
        scopeTotals[r.scope] = (scopeTotals[r.scope] || 0) + (parseFloat(String(r.total)) || 0);
      }
      const total = scopeTotals[1] + scopeTotals[2] + scopeTotals[3];
      const colors = { 1: "hsl(142, 76%, 36%)", 2: "hsl(221, 83%, 53%)", 3: "hsl(25, 95%, 53%)" };
      return NextResponse.json([
        { name: "Scope 1", value: total > 0 ? Math.round(scopeTotals[1] / total * 100) : 0, tCO2e: Math.round(scopeTotals[1] * 100) / 100, fill: colors[1] },
        { name: "Scope 2", value: total > 0 ? Math.round(scopeTotals[2] / total * 100) : 0, tCO2e: Math.round(scopeTotals[2] * 100) / 100, fill: colors[2] },
        { name: "Scope 3", value: total > 0 ? Math.round(scopeTotals[3] / total * 100) : 0, tCO2e: Math.round(scopeTotals[3] * 100) / 100, fill: colors[3] },
      ]);
    }

    if (type === "offset-summary") {
      const rows = await calcScopeEmissions(year, organizationId);
      let totalEmissions = 0;
      for (const r of rows) totalEmissions += parseFloat(String(r.total)) || 0;

      const redProjects = await prisma.reductionProject.findMany({
        where: { ...orgFilter, status: { in: ["in_progress", "completed"] } },
        select: { actualReductionMt: true },
      });
      const offsetT = redProjects.reduce((s, p) => s + (p.actualReductionMt ? parseFloat(String(p.actualReductionMt)) : 0), 0);

      return NextResponse.json({
        totalEmissionsT: Math.round(totalEmissions * 100) / 100,
        offsetT: Math.round(offsetT * 100) / 100,
      });
    }

    if (type === "top-vendors") {
      const vendors = await prisma.vendor.findMany({
        where: { ...orgFilter, status: "active" },
        include: {
          submissions: { orderBy: { createdAt: "desc" }, take: 1 },
          esgScores: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { esgScore: "desc" },
        take: 5,
      });

      return NextResponse.json(
        vendors.map((v) => ({
          id: String(v.id),
          vendorName: v.name,
          scope: "scope3" as const,
          emissionsKg: v.submissions[0]?.emissionsTco2e ? parseFloat(String(v.submissions[0].emissionsTco2e)) : 0,
          trendDirection: v.esgScores[0]?.trend === "up" ? "up" : "down",
        }))
      );
    }

    if (type === "insights") {
      const insights: any[] = [];

      const rows = await calcScopeEmissions(year, organizationId);
      let totalNow = 0;
      for (const r of rows) totalNow += parseFloat(String(r.total)) || 0;

      if (totalNow > 0) {
        insights.push({
          id: "ins-emission",
          type: "emission",
          title: `${year}년 총 배출량 ${Math.round(totalNow).toLocaleString()} tCO2e`,
          detail: "Scope 1+2+3 합산 기준입니다. 감축 프로젝트 성과를 확인하세요.",
          actionLabel: "배출 현황 보기",
          actionHref: "/emissions",
        });
      }

      // KPI 미달 항목
      const kpiAlerts = await prisma.kpiMaster.findMany({
        where: { ...orgFilter, category: { in: ["carbon", "environment"] } },
        include: {
          targets: { take: 1 },
          performance: { take: 1 },
        },
        take: 3,
      });
      for (const k of kpiAlerts) {
        const targetVal = k.targets[0]?.targetValue ? parseFloat(String(k.targets[0].targetValue)) : null;
        const actualVal = k.performance[0]?.actualValue ? parseFloat(String(k.performance[0].actualValue)) : null;
        if (targetVal !== null && actualVal !== null && actualVal > targetVal) {
          insights.push({
            id: `ins-kpi-${k.name}`,
            type: "kpi",
            title: `${k.name} 목표 미달`,
            detail: `목표 ${targetVal} 대비 실적 ${actualVal} (초과)`,
            actionLabel: "KPI 상세 보기",
            actionHref: "/kpi",
          });
        }
      }

      // 감축 프로젝트
      const redProjects = await prisma.reductionProject.findMany({
        where: { ...orgFilter, status: "in_progress" },
        select: { name: true, expectedReductionMt: true, actualReductionMt: true },
      });
      if (redProjects.length > 0) {
        const totalExp = redProjects.reduce((s, r) => s + (r.expectedReductionMt ? parseFloat(String(r.expectedReductionMt)) : 0), 0);
        const totalAct = redProjects.reduce((s, r) => s + (r.actualReductionMt ? parseFloat(String(r.actualReductionMt)) : 0), 0);
        insights.push({
          id: "ins-reduction",
          type: "reduction",
          title: `감축 프로젝트 진행률 ${totalExp > 0 ? Math.round(totalAct / totalExp * 100) : 0}%`,
          detail: `${redProjects.length}개 진행 중, 목표 ${totalExp}t 중 ${totalAct}t 달성`,
          actionLabel: "감축 프로젝트 보기",
          actionHref: "/reduction",
        });
      }

      return NextResponse.json(insights);
    }

    if (type === "notifications") {
      const notifications: any[] = [];

      // 마감 임박 컴플라이언스
      const compItems = await prisma.complianceItem.findMany({
        where: { ...orgFilter, status: { not: "compliant" } },
        orderBy: { dueDate: "asc" },
        take: 3,
      });
      for (const c of compItems) {
        notifications.push({
          id: `notif-comp-${c.framework}`,
          type: "report",
          title: `${c.framework} - ${c.requirement}`,
          body: `마감일: ${c.dueDate ? new Date(c.dueDate).toLocaleDateString("ko-KR") : "미정"}`,
          actionLabel: "확인하기",
          actionHref: "/compliance",
        });
      }

      // ESG 미검증 항목
      const pendingCnt = await prisma.esgMetric.count({
        where: { ...orgFilter, status: { in: ["pending", "estimated"] } },
      });
      if (pendingCnt > 0) {
        notifications.push({
          id: "notif-esg-pending",
          type: "data",
          title: `ESG 데이터 검증 필요`,
          body: `${pendingCnt}개 지표가 검증 대기 중입니다.`,
          actionLabel: "데이터 검증",
          actionHref: "/data-management/validation",
        });
      }

      // 초대 대기 협력사
      const vpCnt = await prisma.vendor.count({
        where: { ...orgFilter, status: { in: ["invited", "pending"] } },
      });
      if (vpCnt > 0) {
        notifications.push({
          id: "notif-vendor-pending",
          type: "system",
          title: `협력사 응답 대기`,
          body: `${vpCnt}개 협력사가 초대에 미응답 상태입니다.`,
          actionLabel: "협력사 관리",
          actionHref: "/supply-chain",
        });
      }

      return NextResponse.json(notifications);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[GET /api/dashboard]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
