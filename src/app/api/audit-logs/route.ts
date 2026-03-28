import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/audit-logs?facilityId=xxx&year=2024&limit=20
export async function GET(req: NextRequest) {
  try {
    const facilityId = req.nextUrl.searchParams.get("facilityId");
    const year = req.nextUrl.searchParams.get("year");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "20");

    const where: any = {};
    if (facilityId) where.facilityId = facilityId;
    if (year) where.year = parseInt(year);

    const logs = await prisma.activityAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        facility: { select: { facilityName: true, scope: true } },
      },
    });

    return NextResponse.json(
      logs.map((l) => ({
        id: String(l.id),
        actor: l.actor,
        action: l.action,
        detail: l.detail,
        facilityName: l.facility.facilityName,
        scope: l.facility.scope,
        year: l.year,
        timestamp: l.createdAt.toISOString().replace("T", " ").slice(0, 16),
      }))
    );
  } catch (err: any) {
    console.error("[GET /api/audit-logs]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
