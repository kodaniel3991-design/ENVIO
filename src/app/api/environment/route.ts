import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// 교통수단 매핑 (dashboard route.ts와 동일)
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

// GET /api/environment?type=kpi|monthly|scope3-breakdown
export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type") ?? "kpi";
    const year = parseInt(req.nextUrl.searchParams.get("year") ?? String(new Date().getFullYear()));

    if (type === "kpi") {
      // Scope 1/2 일반 배출량
      const emRows = await prisma.$queryRaw<{ scope: number; total: number }[]>`
        SELECT ef.scope, SUM(ad.activity_value * COALESCE(em.co2_factor, 0)) AS total
        FROM activity_data ad
        JOIN emission_facilities ef ON ad.facility_id = ef.id
        LEFT JOIN LATERAL (
          SELECT co2_factor FROM emission_factor_master
          WHERE fuel_code = COALESCE(ef.fuel_type, ef.energy_type)
          LIMIT 1
        ) em ON true
        WHERE ad.year = ${year} AND ef.category_id != 'u7'
        GROUP BY ef.scope
      `;

      let scope1 = 0, scope2 = 0, scope3 = 0;
      for (const r of emRows) {
        const v = parseFloat(String(r.total)) || 0;
        if (r.scope === 1) scope1 = v;
        else if (r.scope === 2) scope2 = v;
        else if (r.scope === 3) scope3 += v;
      }

      // Scope 3 U7 배출량 추가
      const u7Facilities = await prisma.emissionFacility.findMany({ where: { scope: 3, categoryId: "u7" } });
      if (u7Facilities.length > 0) {
        const u7Activity = await prisma.activityData.findMany({
          where: { facilityId: { in: u7Facilities.map((f) => f.id) }, year },
        });
        const employees = await prisma.employee.findMany({ where: { commuteDistanceKm: { not: null } } });

        for (const fac of u7Facilities) {
          const facT = fac.activityType ? (TRANSPORT_MAP[fac.activityType] ?? fac.activityType) : "car";
          const facFuel = fac.fuelType === "전기차" ? null : fac.fuelType;
          const matched = employees.filter((e) => {
            const eT = e.commuteTransport ? (TRANSPORT_MAP[e.commuteTransport] ?? e.commuteTransport) : "car";
            const eF = e.fuel === "전기차" ? null : e.fuel;
            return e.worksiteId === fac.worksiteId && eT === facT && (eF ?? "") === (facFuel ?? "");
          });
          const daily = matched.reduce((s, e) => s + (Number(e.commuteDistanceKm) || 0) * 2 * getKmFactor(e.commuteTransport, e.fuel), 0);
          const workdays = u7Activity.filter((a) => a.facilityId === fac.id).reduce((s, a) => s + (Number(a.activityValue) || 0), 0);
          scope3 += daily * workdays;
        }
      }

      const total = scope1 + scope2 + scope3;

      return NextResponse.json([
        { id: "ghg-total", label: "총 GHG 배출량", value: Math.round(total * 100) / 100, subValue: "tCO2e" },
        { id: "scope1", label: "Scope 1", value: Math.round(scope1 * 100) / 100, subValue: "tCO2e" },
        { id: "scope2", label: "Scope 2", value: Math.round(scope2 * 100) / 100, subValue: "tCO2e" },
        { id: "scope3", label: "Scope 3", value: Math.round(scope3 * 100) / 100, subValue: "tCO2e" },
      ]);
    }

    if (type === "monthly") {
      // 월별 Scope 배출량
      const rows = await prisma.$queryRaw<{ scope: number; month: number; total: number }[]>`
        SELECT ef.scope, ad.month, SUM(ad.activity_value * COALESCE(em.co2_factor, 0)) AS total
        FROM activity_data ad
        JOIN emission_facilities ef ON ad.facility_id = ef.id
        LEFT JOIN LATERAL (
          SELECT co2_factor FROM emission_factor_master
          WHERE fuel_code = COALESCE(ef.fuel_type, ef.energy_type) LIMIT 1
        ) em ON true
        WHERE ad.year = ${year} AND ef.category_id != 'u7'
        GROUP BY ef.scope, ad.month
      `;

      const months: Record<number, { scope1: number; scope2: number; scope3: number }> = {};
      for (let m = 1; m <= 12; m++) months[m] = { scope1: 0, scope2: 0, scope3: 0 };
      for (const r of rows) {
        const key = `scope${r.scope}` as "scope1" | "scope2" | "scope3";
        if (months[r.month]) months[r.month][key] = parseFloat(String(r.total)) || 0;
      }

      // U7 월별 추가
      const u7Facilities = await prisma.emissionFacility.findMany({ where: { scope: 3, categoryId: "u7" } });
      if (u7Facilities.length > 0) {
        const u7Activity = await prisma.activityData.findMany({
          where: { facilityId: { in: u7Facilities.map((f) => f.id) }, year },
        });
        const employees = await prisma.employee.findMany({ where: { commuteDistanceKm: { not: null } } });

        for (const fac of u7Facilities) {
          const facT = fac.activityType ? (TRANSPORT_MAP[fac.activityType] ?? fac.activityType) : "car";
          const facFuel = fac.fuelType === "전기차" ? null : fac.fuelType;
          const matched = employees.filter((e) => {
            const eT = e.commuteTransport ? (TRANSPORT_MAP[e.commuteTransport] ?? e.commuteTransport) : "car";
            const eF = e.fuel === "전기차" ? null : e.fuel;
            return e.worksiteId === fac.worksiteId && eT === facT && (eF ?? "") === (facFuel ?? "");
          });
          const daily = matched.reduce((s, e) => s + (Number(e.commuteDistanceKm) || 0) * 2 * getKmFactor(e.commuteTransport, e.fuel), 0);
          for (const act of u7Activity.filter((a) => a.facilityId === fac.id)) {
            months[act.month].scope3 += daily * (Number(act.activityValue) || 0);
          }
        }
      }

      const monthNames = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
      return NextResponse.json(
        Object.entries(months).map(([m, v]) => ({
          month: `${year}-${String(m).padStart(2, "0")}`,
          name: monthNames[parseInt(m) - 1],
          scope1: Math.round(v.scope1 * 1000) / 1000,
          scope2: Math.round(v.scope2 * 1000) / 1000,
          scope3: Math.round(v.scope3 * 1000) / 1000,
        }))
      );
    }

    if (type === "scope3-breakdown") {
      // Scope 3 카테고리별 배출량
      const rows = await prisma.$queryRaw<{ category_id: string; total: number }[]>`
        SELECT ef.category_id, SUM(ad.activity_value * COALESCE(em.co2_factor, 0)) AS total
        FROM activity_data ad
        JOIN emission_facilities ef ON ad.facility_id = ef.id
        LEFT JOIN LATERAL (
          SELECT co2_factor FROM emission_factor_master
          WHERE fuel_code = COALESCE(ef.fuel_type, ef.energy_type) LIMIT 1
        ) em ON true
        WHERE ad.year = ${year} AND ef.scope = 3 AND ef.category_id != 'u7'
        GROUP BY ef.category_id
      `;

      const LABELS: Record<string, string> = {
        u1: "구입상품 및 서비스", u2: "자본재", u3: "연료·에너지 관련(기타)",
        u4: "상류 수송 및 유통", u5: "사업장 폐기물", u6: "출장",
        u7: "직원 통근", u8: "상류 임차자산",
      };

      const items = rows.map((r) => ({
        id: r.category_id,
        name: LABELS[r.category_id] ?? r.category_id,
        value: Math.round((parseFloat(String(r.total)) || 0) * 100) / 100,
        code: r.category_id.toUpperCase(),
      }));

      return NextResponse.json(items);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: any) {
    console.error("[GET /api/environment]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
