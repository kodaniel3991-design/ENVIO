import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit-log";

// GET /api/admin/organizations — 전체 기업 목록
export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status");
    const search = req.nextUrl.searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (status && status !== "all") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { organizationName: { contains: search, mode: "insensitive" } },
        { businessNumber: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const orgs = await prisma.organization.findMany({
      where: where as any,
      include: {
        _count: { select: { worksites: true, users: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      orgs.map((o) => ({
        id: o.id,
        organizationName: o.organizationName,
        status: o.status,
        industry: o.industry,
        country: o.country,
        businessNumber: o.businessNumber,
        contactName: o.contactName,
        contactEmail: o.contactEmail,
        contactPhone: o.contactPhone,
        contractStartDate: o.contractStartDate,
        contractEndDate: o.contractEndDate,
        memo: o.memo,
        employeeCount: o.employeeCount,
        revenue: o.revenue,
        worksiteCount: o._count.worksites,
        userCount: o._count.users,
        createdAt: o.createdAt,
      }))
    );
  } catch (err: any) {
    console.error("[GET /api/admin/organizations]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/organizations — 기업 상태 변경, 정보 수정
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "create-org") {
      const { data } = body;
      const org = await prisma.organization.create({
        data: {
          organizationName: data.organizationName,
          industry: data.industry ?? null,
          country: data.country ?? "KR",
          businessNumber: data.businessNumber ?? null,
          contactName: data.contactName ?? null,
          contactEmail: data.contactEmail ?? null,
          contactPhone: data.contactPhone ?? null,
          memo: data.memo ?? null,
          status: "active",
        },
      });
      await writeAuditLog({
        action: "org.create",
        targetType: "organization",
        targetId: String(org.id),
        targetName: data.organizationName,
      });
      return NextResponse.json({ ok: true, id: org.id });
    }

    if (action === "update-status") {
      const { id, status } = body;
      const org = await prisma.organization.update({
        where: { id },
        data: { status },
      });
      await writeAuditLog({
        action: `org.${status}`,
        targetType: "organization",
        targetId: String(id),
        targetName: org.organizationName,
        detail: `상태 변경: ${status}`,
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "update-org") {
      const { id, data } = body;
      const org = await prisma.organization.update({
        where: { id },
        data: {
          organizationName: data.organizationName,
          businessNumber: data.businessNumber ?? null,
          contactName: data.contactName ?? null,
          contactEmail: data.contactEmail ?? null,
          contactPhone: data.contactPhone ?? null,
          contractStartDate: data.contractStartDate ? new Date(data.contractStartDate) : null,
          contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : null,
          memo: data.memo ?? null,
        },
      });
      await writeAuditLog({
        action: "org.update",
        targetType: "organization",
        targetId: String(id),
        targetName: org.organizationName,
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[POST /api/admin/organizations]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
