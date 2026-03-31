import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthOrg, AuthError } from "@/lib/auth";
import { autoMapUnlinkedKpis } from "@/lib/kpi-auto-mapping";

/** 로그인 사용자 조직의 사업장 ID 목록 */
async function getOrgWorksiteIds(organizationId: number): Promise<string[]> {
  const ws = await prisma.worksite.findMany({
    where: { organizationId },
    select: { id: true },
  });
  return ws.map((w) => w.id);
}

// GET /api/facilities?scope=1&category=fixed&worksiteId=ws-1
export async function GET(req: NextRequest) {
  const scope = req.nextUrl.searchParams.get("scope");
  const category = req.nextUrl.searchParams.get("category");
  const worksiteId = req.nextUrl.searchParams.get("worksiteId");
  try {
    const { organizationId } = await getAuthOrg();
    const orgWorksiteIds = await getOrgWorksiteIds(organizationId);

    const where: any = {};
    if (scope) {
      where.scope = parseInt(scope);
      if (category) where.categoryId = category;
    }
    // worksiteId가 지정되면 자기 조직 소속인지 검증
    if (worksiteId) {
      if (!orgWorksiteIds.includes(worksiteId)) {
        return NextResponse.json({ error: "접근 권한이 없는 사업장입니다." }, { status: 403 });
      }
      where.worksiteId = worksiteId;
    } else {
      // worksiteId 미지정 시 자기 조직 사업장만 필터
      where.worksiteId = { in: orgWorksiteIds };
    }

    const facilities = await prisma.emissionFacility.findMany({
      where,
      orderBy: scope
        ? [{ sortOrder: "asc" }, { createdAt: "asc" }]
        : [{ scope: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(
      facilities.map((f) => ({
        id: f.id,
        scope: f.scope,
        worksite_id: f.worksiteId,
        facility_name: f.facilityName,
        fuel_type: f.fuelType,
        energy_type: f.energyType,
        activity_type: f.activityType,
        unit: f.unit,
        data_method: f.dataMethod,
        status: f.status,
        category_id: f.categoryId,
        sort_order: f.sortOrder,
        created_at: f.createdAt,
        updated_at: f.updatedAt,
      }))
    );
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[GET /api/facilities]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/facilities — 전체 목록을 통째로 저장 (upsert)
export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await getAuthOrg();
    const orgWorksiteIds = await getOrgWorksiteIds(organizationId);

    const body: {
      scope: number;
      categoryId?: string;
      worksiteId?: string;
      rows: Array<{
        id: string;
        facilityName: string;
        fuelType?: string;
        energyType?: string;
        activityType?: string;
        unit: string;
        dataMethod: string;
        status?: string;
        sortOrder?: number;
        categoryId?: string;
      }>;
    } = await req.json();

    const categoryId = body.categoryId ?? "fixed";
    const worksiteId = body.worksiteId ?? null;

    // 사업장 소유권 검증
    if (worksiteId && !orgWorksiteIds.includes(worksiteId)) {
      return NextResponse.json({ error: "접근 권한이 없는 사업장입니다." }, { status: 403 });
    }

    const newIds = body.rows.map((r) => r.id);

    const deleteWhere: any = { scope: body.scope, categoryId };
    if (worksiteId) deleteWhere.worksiteId = worksiteId;
    // 자기 조직 사업장 범위 내에서만 삭제
    deleteWhere.worksiteId = worksiteId ? worksiteId : { in: orgWorksiteIds };

    if (newIds.length > 0) {
      await prisma.emissionFacility.deleteMany({
        where: { ...deleteWhere, id: { notIn: newIds } },
      });
    } else {
      await prisma.emissionFacility.deleteMany({ where: deleteWhere });
    }

    for (let i = 0; i < body.rows.length; i++) {
      const row = body.rows[i];
      await prisma.emissionFacility.upsert({
        where: { id: row.id },
        update: {
          scope: body.scope,
          worksiteId,
          categoryId: row.categoryId ?? categoryId,
          facilityName: row.facilityName,
          fuelType: row.fuelType ?? null,
          energyType: row.energyType ?? null,
          activityType: row.activityType ?? null,
          unit: row.unit,
          dataMethod: row.dataMethod,
          status: row.status ?? "active",
          sortOrder: row.sortOrder ?? i,
        },
        create: {
          id: row.id,
          scope: body.scope,
          worksiteId,
          categoryId: row.categoryId ?? categoryId,
          facilityName: row.facilityName,
          status: row.status ?? "active",
          fuelType: row.fuelType ?? null,
          energyType: row.energyType ?? null,
          activityType: row.activityType ?? null,
          unit: row.unit,
          dataMethod: row.dataMethod,
          sortOrder: row.sortOrder ?? i,
        },
      });
    }

    const autoMapped = await autoMapUnlinkedKpis();

    return NextResponse.json({ ok: true, autoMapped });
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[POST /api/facilities]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
