import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthOrg, AuthError } from "@/lib/auth";

/**
 * CalcRule JSON 형태:
 * {
 *   scope: number | number[],        // 1, 2, 3 또는 [1,2,3]
 *   categories?: string[],           // ["fixed","mobile"] 등, 없으면 전체
 *   aggregation: "sum" | "avg",      // 집계 방식
 *   formula?: "emission" | "activity" // emission=활동량×배출계수, activity=활동량 합산
 * }
 */
interface CalcRule {
  scope: number | number[];
  categories?: string[];
  aggregation?: "sum" | "avg";
  formula?: "emission" | "activity";
}

/**
 * GET /api/kpi/[id]/value?period=2026
 * - calcType=auto → activity_data + emission_factor에서 자동 집계
 * - calcType=manual → kpi_performance 테이블에서 값 반환
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { organizationId } = await getAuthOrg();
    const kpiId = params.id;
    const period = req.nextUrl.searchParams.get("period") ?? String(new Date().getFullYear());

    const kpi = await prisma.kpiMaster.findUnique({
      where: { id: kpiId },
      include: {
        performance: { where: { period } },
        targets: { where: { period } },
      },
    });

    if (!kpi || kpi.organizationId !== organizationId) {
      return NextResponse.json({ error: "KPI를 찾을 수 없습니다" }, { status: 404 });
    }

    const targetValue = kpi.targets[0] ? Number(kpi.targets[0].targetValue) : null;

    // ── Manual: kpi_performance에서 값 반환 ──
    if (kpi.calcType === "manual") {
      const actualValue = kpi.performance[0] ? Number(kpi.performance[0].actualValue) : null;
      const achievementPercent = targetValue && actualValue
        ? Math.round((actualValue / targetValue) * 1000) / 10
        : null;

      return NextResponse.json({
        kpiId: kpi.id,
        code: kpi.code,
        name: kpi.name,
        calcType: "manual",
        period,
        actualValue,
        targetValue,
        achievementPercent,
        unit: kpi.unit,
        source: "수동 입력",
        monthlyBreakdown: null,
      });
    }

    // ── Auto: activity_data에서 자동 집계 ──
    const rule: CalcRule = kpi.calcRule ? JSON.parse(kpi.calcRule) : { scope: 1, aggregation: "sum" };
    const scopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope];

    // 해당 scope/category의 시설 목록 조회
    const whereClause: Record<string, unknown> = {
      scope: { in: scopes },
    };
    if (rule.categories && rule.categories.length > 0) {
      whereClause.categoryId = { in: rule.categories };
    }

    // 자기 조직 사업장의 시설만 조회
    const orgWorksiteIds = (await prisma.worksite.findMany({
      where: { organizationId },
      select: { id: true },
    })).map((w) => w.id);
    whereClause.worksiteId = { in: orgWorksiteIds };

    const facilities = await prisma.emissionFacility.findMany({
      where: whereClause,
      select: { id: true, fuelType: true, energyType: true },
    });

    const facilityIds = facilities.map((f) => f.id);

    if (facilityIds.length === 0) {
      return NextResponse.json({
        kpiId: kpi.id,
        code: kpi.code,
        name: kpi.name,
        calcType: "auto",
        period,
        actualValue: 0,
        targetValue,
        achievementPercent: null,
        unit: kpi.unit,
        source: `자동 집계 (Scope ${scopes.join("+")} · 시설 0개)`,
        monthlyBreakdown: Array(12).fill(0),
      });
    }

    // 활동량 데이터 로드
    const yearNum = parseInt(period);
    const activityData = await prisma.activityData.findMany({
      where: {
        facilityId: { in: facilityIds },
        year: yearNum,
      },
    });

    // 배출계수 로드
    const factors = await prisma.emissionFactorMaster.findMany({
      where: { scope: { in: scopes }, active: true },
    });

    // 시설별 배출계수 매핑 함수
    const getFactorForFacility = (facility: { fuelType: string | null; energyType: string | null }): number => {
      const code = facility.fuelType ?? facility.energyType ?? "";
      const f = factors.find((ef) => ef.fuelCode === code);
      if (f) {
        const co2 = Number(f.co2Factor ?? 0);
        const ch4 = Number(f.ch4Factor ?? 0);
        const n2o = Number(f.n2oFactor ?? 0);
        const gwpCh4 = Number(f.gwpCh4 ?? 28);
        const gwpN2o = Number(f.gwpN2o ?? 265);
        return co2 + ch4 * gwpCh4 + n2o * gwpN2o;
      }
      // 하드코딩 fallback
      const FALLBACK: Record<string, number> = {
        LNG: 2.23, Diesel: 2.71, Gasoline: 2.31, LPG: 1.89,
        Electricity: 0.4747, Steam: 0.20,
      };
      return FALLBACK[code] ?? 1;
    };

    // 월별 집계
    const monthlyBreakdown = Array(12).fill(0);
    const facilityMap = new Map(facilities.map((f) => [f.id, f]));

    activityData.forEach((ad) => {
      const facility = facilityMap.get(ad.facilityId);
      if (!facility) return;
      const activity = Number(ad.activityValue);
      const isEmission = rule.formula !== "activity";
      const value = isEmission ? activity * getFactorForFacility(facility) : activity;
      if (ad.month >= 1 && ad.month <= 12) {
        monthlyBreakdown[ad.month - 1] += value;
      }
    });

    const totalValue = monthlyBreakdown.reduce((s: number, v: number) => s + v, 0);
    const actualValue = rule.aggregation === "avg" && facilityIds.length > 0
      ? totalValue / facilityIds.length
      : totalValue;

    const achievementPercent = targetValue && actualValue
      ? Math.round((actualValue / targetValue) * 1000) / 10
      : null;

    return NextResponse.json({
      kpiId: kpi.id,
      code: kpi.code,
      name: kpi.name,
      calcType: "auto",
      period,
      actualValue: Math.round(actualValue * 100) / 100,
      targetValue,
      achievementPercent,
      unit: kpi.unit,
      source: `자동 집계 (Scope ${scopes.join("+")} · ${facilityIds.length}개 시설)`,
      monthlyBreakdown: monthlyBreakdown.map((v: number) => Math.round(v * 100) / 100),
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: (err as AuthError).message }, { status: (err as AuthError).status });
    console.error("[GET /api/kpi/[id]/value]", err);
    return NextResponse.json({ error: "KPI 값 조회 실패" }, { status: 500 });
  }
}

/**
 * PUT /api/kpi/[id]/value — KPI calcType/calcRule 업데이트
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { organizationId } = await getAuthOrg();
    const kpiId = params.id;

    // 소유권 검증
    const kpi = await prisma.kpiMaster.findUnique({ where: { id: kpiId }, select: { organizationId: true } });
    if (!kpi || kpi.organizationId !== organizationId) {
      return NextResponse.json({ error: "KPI를 찾을 수 없습니다" }, { status: 404 });
    }

    const body = await req.json();
    const { calcType, calcRule } = body;

    const updateData: Record<string, unknown> = {};
    if (calcType) updateData.calcType = calcType;
    if (calcRule !== undefined) updateData.calcRule = calcRule ? JSON.stringify(calcRule) : null;

    await prisma.kpiMaster.update({
      where: { id: kpiId },
      data: updateData,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: (err as AuthError).message }, { status: (err as AuthError).status });
    console.error("[PUT /api/kpi/[id]/value]", err);
    return NextResponse.json({ error: "KPI 업데이트 실패" }, { status: 500 });
  }
}
