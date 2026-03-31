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

    if (type === "table") {
      // Scope별 연간 배출량을 테이블 행으로 반환
      const emRows = await prisma.$queryRaw<{ scope: number; total: number; facility_count: number }[]>`
        SELECT ef.scope,
               SUM(ad.activity_value * COALESCE(em.co2_factor, 0)) AS total,
               COUNT(DISTINCT ef.id) AS facility_count
        FROM activity_data ad
        JOIN emission_facilities ef ON ad.facility_id = ef.id
        LEFT JOIN LATERAL (
          SELECT co2_factor FROM emission_factor_master
          WHERE fuel_code = COALESCE(ef.fuel_type, ef.energy_type) LIMIT 1
        ) em ON true
        WHERE ad.year = ${year} AND ef.category_id != 'u7'
        GROUP BY ef.scope
      `;

      // 총 활동량 (에너지 사용량 추정)
      const activityRows = await prisma.$queryRaw<{ scope: number; total_activity: number }[]>`
        SELECT ef.scope, SUM(ad.activity_value) AS total_activity
        FROM activity_data ad
        JOIN emission_facilities ef ON ad.facility_id = ef.id
        WHERE ad.year = ${year} AND ef.category_id != 'u7'
        GROUP BY ef.scope
      `;

      const scopeMap: Record<number, { emission: number; activity: number; facilities: number }> = {};
      for (const r of emRows) {
        scopeMap[r.scope] = {
          emission: parseFloat(String(r.total)) || 0,
          activity: 0,
          facilities: parseInt(String(r.facility_count)) || 0,
        };
      }
      for (const r of activityRows) {
        if (scopeMap[r.scope]) scopeMap[r.scope].activity = parseFloat(String(r.total_activity)) || 0;
      }

      // U7 배출량
      let u7Emission = 0;
      const u7Facs = await prisma.emissionFacility.findMany({ where: { scope: 3, categoryId: "u7" } });
      if (u7Facs.length > 0) {
        const u7Act = await prisma.activityData.findMany({ where: { facilityId: { in: u7Facs.map((f) => f.id) }, year } });
        const emps = await prisma.employee.findMany({ where: { commuteDistanceKm: { not: null } } });
        for (const fac of u7Facs) {
          const facT = fac.activityType ? (TRANSPORT_MAP[fac.activityType] ?? fac.activityType) : "car";
          const facFuel = fac.fuelType === "전기차" ? null : fac.fuelType;
          const matched = emps.filter((e) => {
            const eT = e.commuteTransport ? (TRANSPORT_MAP[e.commuteTransport] ?? e.commuteTransport) : "car";
            const eF = e.fuel === "전기차" ? null : e.fuel;
            return e.worksiteId === fac.worksiteId && eT === facT && (eF ?? "") === (facFuel ?? "");
          });
          const daily = matched.reduce((s, e) => s + (Number(e.commuteDistanceKm) || 0) * 2 * getKmFactor(e.commuteTransport, e.fuel), 0);
          u7Emission += u7Act.filter((a) => a.facilityId === fac.id).reduce((s, a) => s + daily * (Number(a.activityValue) || 0), 0);
        }
      }

      const rows = [];
      const s1 = scopeMap[1];
      const s2 = scopeMap[2];
      const s3 = scopeMap[3];

      if (s1 && s1.emission > 0) {
        rows.push({
          id: `scope1-${year}`, category: "온실가스", indicatorName: "Scope 1 배출량",
          value: Math.round(s1.emission * 100) / 100, unit: "tCO2e", period: String(year),
          source: "Scope 1 > 고정연소", sourceLink: "/analytics/scope1",
          evidenceCount: s1.facilities, status: "verified",
        });
      }
      if (s2 && s2.emission > 0) {
        rows.push({
          id: `scope2-${year}`, category: "온실가스", indicatorName: "Scope 2 배출량",
          value: Math.round(s2.emission * 100) / 100, unit: "tCO2e", period: String(year),
          source: "Scope 2 > 구입전력", sourceLink: "/analytics/scope2",
          evidenceCount: s2.facilities, status: "verified",
        });
      }

      const scope3Total = (s3 ? s3.emission : 0) + u7Emission;
      if (scope3Total > 0) {
        rows.push({
          id: `scope3-${year}`, category: "온실가스", indicatorName: "Scope 3 배출량",
          value: Math.round(scope3Total * 100) / 100, unit: "tCO2e", period: String(year),
          source: "Scope 3 > 직원 출퇴근 외", sourceLink: "/analytics/scope3",
          evidenceCount: (s3?.facilities ?? 0) + u7Facs.length, status: "verified",
        });
      }

      // 총 에너지 사용량
      const totalActivity = Object.values(scopeMap).reduce((s, v) => s + v.activity, 0);
      if (totalActivity > 0) {
        rows.push({
          id: `energy-${year}`, category: "에너지", indicatorName: "총 에너지 사용량 (활동량 합계)",
          value: Math.round(totalActivity * 100) / 100, unit: "활동량 단위",
          period: String(year), source: "Scope 1+2 활동량", sourceLink: "/analytics/scope1",
          evidenceCount: Object.values(scopeMap).reduce((s, v) => s + v.facilities, 0), status: "verified",
        });
      }

      // 총 GHG
      const ghgTotal = Object.values(scopeMap).reduce((s, v) => s + v.emission, 0) + u7Emission;
      if (ghgTotal > 0) {
        rows.unshift({
          id: `ghg-total-${year}`, category: "온실가스", indicatorName: "총 GHG 배출량",
          value: Math.round(ghgTotal * 100) / 100, unit: "tCO2e", period: String(year),
          source: "Scope 1+2+3 합산", sourceLink: "/analytics/scope1",
          evidenceCount: 0, status: "verified",
        });
      }

      return NextResponse.json(rows);
    }

    if (type === "ai-insight") {
      const facilities = await prisma.emissionFacility.findMany({
        where: { status: "active", categoryId: { not: "u7" } },
        select: { id: true, facilityName: true, scope: true, categoryId: true, fuelType: true, energyType: true },
      });

      const monthlyData = await prisma.$queryRaw<{ facility_id: string; month: number; val: number }[]>`
        SELECT facility_id, month, activity_value AS val
        FROM activity_data
        WHERE year = ${year}
          AND facility_id = ANY(${facilities.map((f) => f.id)}::text[])
        ORDER BY facility_id, month
      `;

      // 시설별 그룹화
      const byFac = new Map<string, { month: number; val: number }[]>();
      for (const r of monthlyData) {
        const arr = byFac.get(r.facility_id) ?? [];
        arr.push({ month: r.month, val: parseFloat(String(r.val)) || 0 });
        byFac.set(r.facility_id, arr);
      }

      const alerts: string[] = [];
      const causes: string[] = [];
      const actions: string[] = [];
      const anomalyFacilities: string[] = [];

      // 배출계수 매칭 확인
      const allFactorCodes = await prisma.emissionFactorMaster.findMany({ select: { fuelCode: true } });
      const factorSet = new Set(allFactorCodes.map((f) => f.fuelCode).filter(Boolean));
      const unmatchedFacs = facilities.filter((f) => {
        const code = f.fuelType ?? f.energyType;
        return !code || !factorSet.has(code);
      });
      if (unmatchedFacs.length > 0) {
        alerts.push(`배출계수 미매칭 시설 ${unmatchedFacs.length}개 감지`);
        causes.push("배출계수 마스터에 해당 연료 코드 미등록");
        actions.push("설정 > 배출계수 마스터에서 연료별 배출계수 등록");
      }

      // 전월 대비 ±20% 초과 변동 감지
      for (const [facId, rows] of Array.from(byFac.entries())) {
        const fac = facilities.find((f) => f.id === facId);
        if (!fac) continue;
        const sorted = [...rows].sort((a, b) => a.month - b.month);
        for (let i = 1; i < sorted.length; i++) {
          const prev = sorted[i - 1].val;
          const curr = sorted[i].val;
          if (prev === 0) continue;
          const changeRate = (curr - prev) / prev;
          if (Math.abs(changeRate) > 0.20 && curr > 0) {
            const dir = changeRate > 0 ? "증가" : "감소";
            const pct = Math.round(Math.abs(changeRate) * 100);
            anomalyFacilities.push(`${fac.facilityName} (S${fac.scope}) ${sorted[i - 1].month}→${sorted[i].month}월 ${pct}% ${dir}`);
          }
        }
      }

      if (anomalyFacilities.length > 0) {
        const top3 = anomalyFacilities.slice(0, 3);
        for (const a of top3) alerts.push(a);
        if (anomalyFacilities.length > 3) alerts.push(`외 ${anomalyFacilities.length - 3}건 이상 변동`);
        causes.push("계절적 사용량 변동");
        causes.push("신규 설비 가동 또는 가동 중단");
        causes.push("데이터 입력 오류 가능성");
        actions.push("해당 시설 활동량 데이터 재확인");
        actions.push("전월 대비 변동 사유 기록");
      }

      // 미입력 월 감지
      const currentMonth = new Date().getMonth() + 1;
      const missingFacs: string[] = [];
      for (const fac of facilities) {
        const rows = byFac.get(fac.id) ?? [];
        const enteredMonths = new Set(rows.filter((r) => r.val > 0).map((r) => r.month));
        const missingMonths: number[] = [];
        for (let m = 1; m < currentMonth; m++) {
          if (!enteredMonths.has(m)) missingMonths.push(m);
        }
        if (missingMonths.length > 0) {
          missingFacs.push(`${fac.facilityName} (${missingMonths.map((m) => m + "월").join(", ")} 미입력)`);
        }
      }
      if (missingFacs.length > 0) {
        alerts.push(`활동량 미입력 시설 ${missingFacs.length}개`);
        causes.push("데이터 수집 지연 또는 누락");
        actions.push("미입력 시설의 월별 활동량 데이터 입력");
      }

      const hasAnomaly = alerts.length > 0;
      // 이상 없을 때 기본 메시지
      if (!hasAnomaly) {
        alerts.push("감지된 이상 항목이 없습니다");
        causes.push("정상 범위 내 데이터");
        actions.push("현재 데이터 품질 수준 유지");
      }

      return NextResponse.json({
        hasAnomaly,
        alerts: Array.from(new Set(alerts)),
        possibleCauses: Array.from(new Set(causes)),
        recommendedActions: Array.from(new Set(actions)),
      });
    }

    if (type === "data-quality") {
      // 모든 활성 시설 조회 (U7 제외)
      const facilities = await prisma.emissionFacility.findMany({
        where: { status: "active", categoryId: { not: "u7" } },
        select: { id: true, fuelType: true, energyType: true },
      });
      const totalFacilities = facilities.length;
      if (totalFacilities === 0) {
        return NextResponse.json([
          { id: "completeness", label: "Completeness", value: 0, description: "데이터 완전성" },
          { id: "accuracy", label: "Accuracy", value: 0, description: "정확도" },
          { id: "consistency", label: "Consistency", value: 0, description: "일관성" },
          { id: "overall", label: "전체 Data Quality Score", value: 0, description: "" },
        ]);
      }

      // 1) Completeness: 12개월 모두 입력된 시설 비율
      const activityCounts = await prisma.$queryRaw<{ facility_id: string; months: number }[]>`
        SELECT facility_id, COUNT(DISTINCT month) AS months
        FROM activity_data
        WHERE year = ${year}
          AND facility_id = ANY(${facilities.map((f) => f.id)}::text[])
        GROUP BY facility_id
      `;
      const countMap = new Map(activityCounts.map((r) => [r.facility_id, parseInt(String(r.months))]));
      // 부분 입력도 반영 (월 수/12 평균)
      const avgMonthRatio = facilities.reduce((sum, f) => sum + Math.min((countMap.get(f.id) ?? 0) / 12, 1), 0) / totalFacilities;
      const completeness = Math.round(avgMonthRatio * 100);

      // 2) Accuracy: 배출계수가 매칭된 시설 비율
      const allFactorCodes = await prisma.emissionFactorMaster.findMany({ select: { fuelCode: true } });
      const factorSet = new Set(allFactorCodes.map((f) => f.fuelCode).filter(Boolean));
      const matchedFacilities = facilities.filter((f) => {
        const code = f.fuelType ?? f.energyType;
        return code && factorSet.has(code);
      }).length;
      const accuracy = totalFacilities > 0 ? Math.round((matchedFacilities / totalFacilities) * 100) : 0;

      // 3) Consistency: 전월 대비 ±20% 이내인 월 비율
      const monthlyData = await prisma.$queryRaw<{ facility_id: string; month: number; val: number }[]>`
        SELECT facility_id, month, activity_value AS val
        FROM activity_data
        WHERE year = ${year}
          AND facility_id = ANY(${facilities.map((f) => f.id)}::text[])
        ORDER BY facility_id, month
      `;
      // 시설별 그룹화
      const byFacility = new Map<string, { month: number; val: number }[]>();
      for (const r of monthlyData) {
        const arr = byFacility.get(r.facility_id) ?? [];
        arr.push({ month: r.month, val: parseFloat(String(r.val)) || 0 });
        byFacility.set(r.facility_id, arr);
      }
      let consistentPairs = 0;
      let totalPairs = 0;
      for (const rows of Array.from(byFacility.values())) {
        rows.sort((a: { month: number; val: number }, b: { month: number; val: number }) => a.month - b.month);
        for (let i = 1; i < rows.length; i++) {
          const prev = rows[i - 1].val;
          const curr = rows[i].val;
          if (prev === 0 && curr === 0) { consistentPairs++; totalPairs++; continue; }
          if (prev === 0) { totalPairs++; continue; } // 0→값은 불일치로 처리
          const changeRate = Math.abs((curr - prev) / prev);
          totalPairs++;
          if (changeRate <= 0.20) consistentPairs++;
        }
      }
      const consistency = totalPairs > 0 ? Math.round((consistentPairs / totalPairs) * 100) : 100;

      // Overall: 가중 평균 (완전성 40%, 정확도 30%, 일관성 30%)
      const overall = Math.round(completeness * 0.4 + accuracy * 0.3 + consistency * 0.3);

      return NextResponse.json([
        { id: "completeness", label: "Completeness", value: completeness, description: "데이터 완전성" },
        { id: "accuracy", label: "Accuracy", value: accuracy, description: "정확도" },
        { id: "consistency", label: "Consistency", value: consistency, description: "일관성" },
        { id: "overall", label: "전체 Data Quality Score", value: overall, description: "" },
      ]);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: any) {
    console.error("[GET /api/environment]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
