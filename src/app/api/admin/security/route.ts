import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit-log";

export async function GET() {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [activeSessions, recentLogins, disabledUsers, totalUsers] = await Promise.all([
      // 최근 24시간 로그인한 사용자
      prisma.user.findMany({
        where: { lastLoginAt: { gte: oneDayAgo } },
        orderBy: { lastLoginAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          lastLoginAt: true,
          isPlatformAdmin: true,
        },
      }),
      // 최근 7일 로그인 감사 로그
      prisma.platformAuditLog.findMany({
        where: {
          action: "auth.login",
          createdAt: { gte: sevenDaysAgo },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { id: true, actorName: true, createdAt: true },
      }),
      prisma.user.count({ where: { status: "disabled" } }),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      activeSessions: activeSessions.map((u) => ({
        userId: u.id,
        userName: u.name,
        email: u.email,
        lastLoginAt: u.lastLoginAt,
        isPlatformAdmin: u.isPlatformAdmin,
      })),
      recentLogins: recentLogins.map((l) => ({
        id: l.id,
        actorName: l.actorName,
        createdAt: l.createdAt,
      })),
      disabledUsers,
      totalUsers,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "force-disable") {
      const user = await prisma.user.update({
        where: { id: body.userId },
        data: { status: "disabled" },
      });
      await writeAuditLog({
        action: "security.force-disable",
        targetType: "user",
        targetId: body.userId,
        targetName: user.name,
        detail: "관리자에 의한 강제 비활성화",
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
