import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthOrg, AuthError } from "@/lib/auth";

// GET /api/employees?worksiteId=xxx  (worksiteId 생략 시 자기 조직 전체)
export async function GET(req: NextRequest) {
  try {
    const { organizationId } = await getAuthOrg();
    const orgWorksiteIds = (await prisma.worksite.findMany({
      where: { organizationId },
      select: { id: true },
    })).map((w) => w.id);

    const { searchParams } = new URL(req.url);
    const worksiteId = searchParams.get("worksiteId");

    // worksiteId 소유권 검증
    if (worksiteId && !orgWorksiteIds.includes(worksiteId)) {
      return NextResponse.json({ error: "접근 권한이 없는 사업장입니다." }, { status: 403 });
    }

    const employees = await prisma.employee.findMany({
      where: worksiteId ? { worksiteId } : { worksiteId: { in: orgWorksiteIds } },
      include: { worksite: { select: { name: true } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(
      employees.map((e) => ({
        id: e.id,
        worksiteId: e.worksiteId ?? undefined,
        workplaceName: e.worksite?.name ?? undefined,
        department: e.department ?? undefined,
        subTeam: e.subTeam ?? undefined,
        team: e.team ?? undefined,
        isManager: e.isManager != null ? Boolean(e.isManager) : undefined,
        name: e.name,
        employeeId: e.employeeId ?? undefined,
        position: e.position ?? undefined,
        jobPosition: e.jobPosition ?? undefined,
        jobTitle: e.jobTitle ?? undefined,
        employmentStatus: e.employmentStatus ?? undefined,
        employmentType: e.employmentType ?? undefined,
        referenceDate: e.referenceDate ? new Date(e.referenceDate).toISOString().split("T")[0] : undefined,
        hireDate: e.hireDate ? new Date(e.hireDate).toISOString().split("T")[0] : undefined,
        terminationDate: e.terminationDate ? new Date(e.terminationDate).toISOString().split("T")[0] : undefined,
        leaveStartDate: e.leaveStartDate ? new Date(e.leaveStartDate).toISOString().split("T")[0] : undefined,
        leaveEndDate: e.leaveEndDate ? new Date(e.leaveEndDate).toISOString().split("T")[0] : undefined,
        gender: e.gender ?? undefined,
        birthYear: e.birthYear ?? undefined,
        nationality: e.nationality ?? undefined,
        isForeigner: e.isForeigner != null ? Boolean(e.isForeigner) : undefined,
        isDisabled: e.isDisabled != null ? Boolean(e.isDisabled) : undefined,
        disabilityType: e.disabilityType ?? undefined,
        address: e.address ?? undefined,
        addressDetail: e.addressDetail ?? undefined,
        workAddress: e.workAddress ?? undefined,
        commuteTransport: e.commuteTransport ?? undefined,
        fuel: e.fuel ?? undefined,
        commuteDistanceKm: e.commuteDistanceKm != null ? Number(e.commuteDistanceKm) : undefined,
        roundTripDistanceKm: e.roundTripDistanceKm != null ? Number(e.roundTripDistanceKm) : undefined,
        workDaysPerMonth: e.workDaysPerMonth ?? undefined,
        monthlyCommuteEmission: e.monthlyCommuteEmission != null ? Number(e.monthlyCommuteEmission) : undefined,
        dataSource: e.dataSource ?? undefined,
        evidenceFileId: e.evidenceFileId ?? undefined,
        memo: e.memo ?? undefined,
        createdAt: e.createdAt ? new Date(e.createdAt).toLocaleDateString("ko-KR") : undefined,
        updatedAt: e.updatedAt ? new Date(e.updatedAt).toLocaleDateString("ko-KR") : undefined,
        createdBy: e.createdBy ?? undefined,
        updatedBy: e.updatedBy ?? undefined,
      }))
    );
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[GET /api/employees]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/employees  — 전체 직원 삭제
export async function DELETE() {
  try {
    await prisma.employee.deleteMany({});
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[DELETE /api/employees]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/employees  — 사업장별 직원 목록 일괄 저장
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { worksiteId, employees } = body as {
      worksiteId: string | null;
      employees: {
        id: string;
        worksiteId?: string;
        department?: string;
        subTeam?: string;
        team?: string;
        isManager?: boolean;
        name: string;
        employeeId?: string;
        position?: string;
        jobPosition?: string;
        jobTitle?: string;
        employmentStatus?: string;
        employmentType?: string;
        referenceDate?: string;
        hireDate?: string;
        terminationDate?: string;
        leaveStartDate?: string;
        leaveEndDate?: string;
        gender?: string;
        birthYear?: number;
        nationality?: string;
        isForeigner?: boolean;
        isDisabled?: boolean;
        disabilityType?: string;
        address?: string;
        addressDetail?: string;
        workAddress?: string;
        commuteTransport?: string;
        fuel?: string;
        commuteDistanceKm?: number;
        roundTripDistanceKm?: number;
        workDaysPerMonth?: number;
        monthlyCommuteEmission?: number;
        dataSource?: string;
        evidenceFileId?: string;
        memo?: string;
      }[];
    };

    // 기존 해당 사업장 직원 ID 목록 조회 후 없어진 항목 삭제
    if (worksiteId) {
      const existingEmployees = await prisma.employee.findMany({
        where: { worksiteId },
        select: { id: true },
      });
      const existingIds = new Set(existingEmployees.map((e) => e.id));
      const incomingIds = new Set(employees.map((e) => e.id));

      for (const eid of Array.from(existingIds)) {
        if (!incomingIds.has(eid)) {
          await prisma.employee.delete({ where: { id: eid } });
        }
      }
    }

    for (let i = 0; i < employees.length; i++) {
      const e = employees[i];

      // ID 해석: employeeId나 name 기준으로 기존 레코드 검색
      let resolvedId = e.id;
      if (e.employeeId) {
        const found = await prisma.employee.findFirst({
          where: worksiteId
            ? { worksiteId, employeeId: e.employeeId }
            : { worksiteId: null, employeeId: e.employeeId },
          select: { id: true },
        });
        if (found) {
          resolvedId = found.id;
        } else if (worksiteId) {
          const nullFound = await prisma.employee.findFirst({
            where: { worksiteId: null, employeeId: e.employeeId },
            select: { id: true },
          });
          if (nullFound) resolvedId = nullFound.id;
        }
      } else {
        const found = await prisma.employee.findFirst({
          where: worksiteId
            ? { worksiteId, name: e.name }
            : { worksiteId: null, name: e.name },
          select: { id: true },
        });
        if (found) {
          resolvedId = found.id;
        } else if (worksiteId) {
          const nullFound = await prisma.employee.findFirst({
            where: { worksiteId: null, name: e.name },
            select: { id: true },
          });
          if (nullFound) resolvedId = nullFound.id;
        }
      }

      const data = {
        worksiteId: worksiteId ?? null,
        department: e.department ?? null,
        subTeam: e.subTeam ?? null,
        team: e.team ?? null,
        isManager: e.isManager != null ? e.isManager : null,
        name: e.name,
        employeeId: e.employeeId ?? null,
        position: e.position ?? null,
        jobPosition: e.jobPosition ?? null,
        jobTitle: e.jobTitle ?? null,
        employmentStatus: e.employmentStatus ?? null,
        employmentType: e.employmentType ?? null,
        referenceDate: e.referenceDate ? new Date(e.referenceDate) : null,
        hireDate: e.hireDate ? new Date(e.hireDate) : null,
        terminationDate: e.terminationDate ? new Date(e.terminationDate) : null,
        leaveStartDate: e.leaveStartDate ? new Date(e.leaveStartDate) : null,
        leaveEndDate: e.leaveEndDate ? new Date(e.leaveEndDate) : null,
        gender: e.gender ?? null,
        birthYear: e.birthYear ?? null,
        nationality: e.nationality ?? null,
        isForeigner: e.isForeigner != null ? e.isForeigner : null,
        isDisabled: e.isDisabled != null ? e.isDisabled : null,
        disabilityType: e.disabilityType ?? null,
        address: e.address ?? null,
        addressDetail: e.addressDetail ?? null,
        workAddress: e.workAddress ?? null,
        commuteTransport: e.commuteTransport ?? null,
        fuel: e.fuel ?? null,
        commuteDistanceKm: e.commuteDistanceKm ?? null,
        roundTripDistanceKm: e.roundTripDistanceKm ?? null,
        workDaysPerMonth: e.workDaysPerMonth ?? null,
        monthlyCommuteEmission: e.monthlyCommuteEmission ?? null,
        dataSource: e.dataSource ?? null,
        evidenceFileId: e.evidenceFileId ?? null,
        memo: e.memo ?? null,
        sortOrder: i,
      };

      await prisma.employee.upsert({
        where: { id: resolvedId },
        update: data,
        create: { id: resolvedId, ...data },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[POST /api/employees]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
