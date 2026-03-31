import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/admin/audit-logs?targetType=&action=&limit=50&offset=0
export async function GET(req: NextRequest) {
  try {
    const targetType = req.nextUrl.searchParams.get("targetType");
    const action = req.nextUrl.searchParams.get("action");
    const search = req.nextUrl.searchParams.get("search");
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 50), 200);
    const offset = Number(req.nextUrl.searchParams.get("offset") ?? 0);

    const where: Record<string, unknown> = {};
    if (targetType) where.targetType = targetType;
    if (action) where.action = { contains: action, mode: "insensitive" };
    if (search) {
      where.OR = [
        { actorName: { contains: search, mode: "insensitive" } },
        { targetName: { contains: search, mode: "insensitive" } },
        { detail: { contains: search, mode: "insensitive" } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.platformAuditLog.findMany({
        where: where as any,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.platformAuditLog.count({ where: where as any }),
    ]);

    return NextResponse.json({
      items: logs.map((l) => ({
        id: l.id,
        actorId: l.actorId,
        actorName: l.actorName,
        action: l.action,
        targetType: l.targetType,
        targetId: l.targetId,
        targetName: l.targetName,
        detail: l.detail,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt,
      })),
      total,
    });
  } catch (err: any) {
    console.error("[GET /api/admin/audit-logs]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
