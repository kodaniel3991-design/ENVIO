import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/admin/organizations/[id] — 기업 상세 (사업장, 사용자, 배출원 현황)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);

    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        worksites: {
          orderBy: { sortOrder: "asc" },
          include: {
            _count: { select: { facilities: true, employees: true } },
          },
        },
        users: {
          orderBy: { name: "asc" },
          include: { role: { select: { name: true } } },
        },
      },
    });

    if (!org) {
      return NextResponse.json({ error: "기업을 찾을 수 없습니다." }, { status: 404 });
    }

    // 배출원 통계: 사업장별 scope별 카운트
    const facilities = await prisma.emissionFacility.groupBy({
      by: ["worksiteId", "scope"],
      where: { worksiteId: { in: org.worksites.map((w) => w.id) } },
      _count: true,
    });

    const facilityStats: Record<string, Record<number, number>> = {};
    for (const f of facilities) {
      if (!f.worksiteId) continue;
      if (!facilityStats[f.worksiteId]) facilityStats[f.worksiteId] = {};
      facilityStats[f.worksiteId][f.scope] = f._count;
    }

    return NextResponse.json({
      id: org.id,
      organizationName: org.organizationName,
      address: org.address,
      addressDetail: org.addressDetail,
      industry: org.industry,
      country: org.country,
      employeeCount: org.employeeCount,
      revenue: org.revenue,
      status: org.status,
      businessNumber: org.businessNumber,
      contactName: org.contactName,
      contactEmail: org.contactEmail,
      contactPhone: org.contactPhone,
      contractStartDate: org.contractStartDate,
      contractEndDate: org.contractEndDate,
      memo: org.memo,
      scope1Enabled: org.scope1Enabled,
      scope2Enabled: org.scope2Enabled,
      scope3Enabled: org.scope3Enabled,
      createdAt: org.createdAt,
      worksites: org.worksites.map((w) => ({
        id: w.id,
        name: w.name,
        address: w.address,
        isDefault: w.isDefault,
        facilityCount: w._count.facilities,
        employeeCount: w._count.employees,
        facilitiesByScope: facilityStats[w.id] ?? {},
      })),
      users: org.users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        department: u.department,
        jobTitle: u.jobTitle,
        roleName: u.role?.name ?? null,
        status: u.status,
        approvalStatus: u.approvalStatus,
        lastLoginAt: u.lastLoginAt,
      })),
    });
  } catch (err: any) {
    console.error("[GET /api/admin/organizations/[id]]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
