import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// 교통수단 매핑
const TRANSPORT_MAP: Record<string, string> = {
  "승용차": "car", "자가용": "car", "대중교통": "public",
  "전기차": "ev", "도보": "walk_bike", "자전거": "walk_bike",
};
const COMMUTE_FACTOR_PER_KM: Record<string, number> = {
  car: 0.000210, public: 0.0000899, ev: 0.0000404, walk_bike: 0,
};
const FUEL_FACTOR_PER_KM: Record<string, number> = {
  "휘발유": 0.000210, "경유": 0.000174, "LPG": 0.000152,
};

function getKmFactor(transport: string | null, fuel: string | null): number {
  const t = transport ? (TRANSPORT_MAP[transport] ?? transport) : "car";
  if (fuel === "전기차") return COMMUTE_FACTOR_PER_KM.ev ?? 0;
  if (t === "car" && fuel) return FUEL_FACTOR_PER_KM[fuel] ?? COMMUTE_FACTOR_PER_KM.car;
  return COMMUTE_FACTOR_PER_KM[t] ?? 0;
}

const SCOPE_LABELS: Record<string, string> = {
  "1": "Scope 1 (직접 배출)", "2": "Scope 2 (간접 배출)", "3": "Scope 3 (기타 간접)",
};
const CAT_LABELS: Record<string, string> = {
  fixed: "고정연소", mobile: "이동연소", fugitive: "비산배출",
  electricity: "구입전력", heat: "증기·난방",
  u1: "구입상품 및 서비스", u2: "자본재", u3: "연료·에너지 관련(기타)",
  u4: "상류 수송 및 유통", u5: "사업장 폐기물", u6: "출장",
  u7: "직원 통근", u8: "상류 임차자산",
};

// GET /api/environment/report?year=2026&scope=all|1|2|3
export async function GET(req: NextRequest) {
  try {
    const year = parseInt(req.nextUrl.searchParams.get("year") ?? String(new Date().getFullYear()));
    const scopeFilter = req.nextUrl.searchParams.get("scope") ?? "all";
    const scopes = scopeFilter === "all" ? [1, 2, 3] : [parseInt(scopeFilter)];

    // 1) 시설별 연간 배출량
    const facilityRows = await prisma.$queryRaw<{
      id: string; scope: number; facility_name: string; category_id: string;
      fuel_type: string | null; energy_type: string | null; unit: string;
      total_activity: number; co2_factor: number | null;
    }[]>`
      SELECT ef.id, ef.scope, ef.facility_name, ef.category_id,
             ef.fuel_type, ef.energy_type, ef.unit,
             SUM(ad.activity_value) AS total_activity,
             em.co2_factor
      FROM emission_facilities ef
      JOIN activity_data ad ON ad.facility_id = ef.id AND ad.year = ${year}
      LEFT JOIN LATERAL (
        SELECT co2_factor FROM emission_factor_master
        WHERE fuel_code = COALESCE(ef.fuel_type, ef.energy_type) LIMIT 1
      ) em ON true
      WHERE ef.scope = ANY(${scopes}::int[])
        AND ef.category_id != 'u7'
      GROUP BY ef.id, ef.scope, ef.facility_name, ef.category_id,
               ef.fuel_type, ef.energy_type, ef.unit, em.co2_factor
      ORDER BY ef.scope, ef.category_id, ef.facility_name
    `;

    const facilityDetails = facilityRows.map((r) => {
      const activity = parseFloat(String(r.total_activity)) || 0;
      const factor = parseFloat(String(r.co2_factor)) || 0;
      return {
        id: r.id,
        facilityName: r.facility_name,
        scope: r.scope,
        scopeLabel: SCOPE_LABELS[String(r.scope)] ?? `Scope ${r.scope}`,
        categoryId: r.category_id,
        categoryName: CAT_LABELS[r.category_id] ?? r.category_id,
        fuelType: r.fuel_type ?? r.energy_type ?? "-",
        activityValue: Math.round(activity * 100) / 100,
        activityUnit: r.unit,
        emissionFactor: factor,
        totalEmissions: Math.round(activity * factor * 10000) / 10000,
      };
    });

    // 2) U7 직원 출퇴근 (Scope 3에 포함된 경우)
    let u7Details: typeof facilityDetails = [];
    if (scopes.includes(3)) {
      const u7Facs = await prisma.emissionFacility.findMany({ where: { scope: 3, categoryId: "u7" } });
      if (u7Facs.length > 0) {
        const u7Activity = await prisma.activityData.findMany({
          where: { facilityId: { in: u7Facs.map((f) => f.id) }, year },
        });
        const emps = await prisma.employee.findMany({ where: { commuteDistanceKm: { not: null } } });

        for (const fac of u7Facs) {
          const facT = fac.activityType ? (TRANSPORT_MAP[fac.activityType] ?? fac.activityType) : "car";
          const facFuel = fac.fuelType === "전기차" ? null : fac.fuelType;
          const matched = emps.filter((e) => {
            const eT = e.commuteTransport ? (TRANSPORT_MAP[e.commuteTransport] ?? e.commuteTransport) : "car";
            const eF = e.fuel === "전기차" ? null : e.fuel;
            return e.worksiteId === fac.worksiteId && eT === facT && (eF ?? "") === (facFuel ?? "");
          });
          const daily = matched.reduce((s, e) =>
            s + (Number(e.commuteDistanceKm) || 0) * 2 * getKmFactor(e.commuteTransport, e.fuel), 0);
          const totalWorkdays = u7Activity.filter((a) => a.facilityId === fac.id)
            .reduce((s, a) => s + (Number(a.activityValue) || 0), 0);
          const emission = daily * totalWorkdays;
          if (emission > 0 || totalWorkdays > 0) {
            const transportLabel = facT === "car" ? "자가용" : facT === "public" ? "대중교통" : facT === "ev" ? "전기·수소차" : "도보·자전거";
            u7Details.push({
              id: fac.id,
              facilityName: `${fac.facilityName ?? "사업장"} (${transportLabel}${facFuel ? ` · ${facFuel}` : ""})`,
              scope: 3,
              scopeLabel: SCOPE_LABELS["3"],
              categoryId: "u7",
              categoryName: "직원 통근",
              fuelType: facFuel ?? "-",
              activityValue: totalWorkdays,
              activityUnit: "출근일수",
              emissionFactor: daily > 0 ? Math.round((daily) * 10000000) / 10000000 : 0,
              totalEmissions: Math.round(emission * 10000) / 10000,
            });
          }
        }
      }
    }

    const allDetails = [...facilityDetails, ...u7Details];

    // 3) Scope별 합계
    const scopeBreakdown = { scope1: 0, scope2: 0, scope3: 0, total: 0 };
    for (const d of allDetails) {
      const key = `scope${d.scope}` as "scope1" | "scope2" | "scope3";
      scopeBreakdown[key] += d.totalEmissions;
    }
    scopeBreakdown.total = scopeBreakdown.scope1 + scopeBreakdown.scope2 + scopeBreakdown.scope3;

    // 4) 월별 추이
    const monthlyRows = await prisma.$queryRaw<{ scope: number; month: number; total: number }[]>`
      SELECT ef.scope, ad.month, SUM(ad.activity_value * COALESCE(em.co2_factor, 0)) AS total
      FROM activity_data ad
      JOIN emission_facilities ef ON ad.facility_id = ef.id
      LEFT JOIN LATERAL (
        SELECT co2_factor FROM emission_factor_master
        WHERE fuel_code = COALESCE(ef.fuel_type, ef.energy_type) LIMIT 1
      ) em ON true
      WHERE ad.year = ${year} AND ef.scope = ANY(${scopes}::int[]) AND ef.category_id != 'u7'
      GROUP BY ef.scope, ad.month
    `;

    const monthNames = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
    const monthly: Record<number, { scope1: number; scope2: number; scope3: number }> = {};
    for (let m = 1; m <= 12; m++) monthly[m] = { scope1: 0, scope2: 0, scope3: 0 };
    for (const r of monthlyRows) {
      const key = `scope${r.scope}` as "scope1" | "scope2" | "scope3";
      monthly[r.month][key] = parseFloat(String(r.total)) || 0;
    }

    const monthlyTrend = Object.entries(monthly).map(([m, v]) => ({
      name: monthNames[parseInt(m) - 1],
      scope1: Math.round(v.scope1 * 1000) / 1000,
      scope2: Math.round(v.scope2 * 1000) / 1000,
      scope3: Math.round(v.scope3 * 1000) / 1000,
      total: Math.round((v.scope1 + v.scope2 + v.scope3) * 1000) / 1000,
    }));

    return NextResponse.json({
      year,
      scopeFilter,
      scopeBreakdown,
      monthlyTrend,
      facilityDetails: allDetails,
    });
  } catch (err: any) {
    console.error("[GET /api/environment/report]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
