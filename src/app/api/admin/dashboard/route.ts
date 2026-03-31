import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      orgCounts,
      pendingUsers,
      totalUsers,
      mauCount,
      openTickets,
      noticeCount,
      planCount,
      activeSubscriptions,
      recentOrgs,
      recentPendingUsers,
      monthlyOrgTrend,
      recentAuditLogs,
      recentTickets,
    ] = await Promise.all([
      // 기업 상태별 카운트
      prisma.organization.groupBy({ by: ["status"], _count: true }),
      // 승인 대기 사용자
      prisma.user.count({ where: { approvalStatus: "pending" } }),
      // 전체 사용자
      prisma.user.count(),
      // MAU
      prisma.user.count({ where: { lastLoginAt: { gte: thirtyDaysAgo } } }),
      // 미처리 문의
      prisma.supportTicket.count({ where: { status: { in: ["open", "in_progress"] } } }),
      // 게시된 공지
      prisma.notice.count({ where: { isPublished: true } }),
      // 활성 플랜
      prisma.subscriptionPlan.count({ where: { isActive: true } }),
      // 활성 구독
      prisma.orgSubscription.count({ where: { status: "active" } }),
      // 최근 등록 기업 5개
      prisma.organization.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { _count: { select: { users: true, worksites: true } } },
      }),
      // 승인 대기 사용자 5명
      prisma.user.findMany({
        where: { approvalStatus: "pending" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { organization: { select: { organizationName: true } } },
      }),
      // 월별 기업 등록 추이
      prisma.$queryRawUnsafe<{ month: string; count: bigint }[]>(
        `SELECT to_char(created_at, 'YYYY-MM') as month, count(*)::bigint as count
         FROM organizations
         WHERE created_at >= now() - interval '6 months'
         GROUP BY month ORDER BY month`
      ),
      // 최근 감사 로그 8건
      prisma.platformAuditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      // 최근 미처리 문의 5건
      prisma.supportTicket.findMany({
        where: { status: { in: ["open", "in_progress"] } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const orgStatusMap: Record<string, number> = {};
    let totalOrgs = 0;
    for (const g of orgCounts) {
      orgStatusMap[g.status] = g._count;
      totalOrgs += g._count;
    }

    return NextResponse.json({
      // 핵심 KPI
      kpi: {
        totalOrgs,
        activeOrgs: orgStatusMap["active"] ?? 0,
        suspendedOrgs: orgStatusMap["suspended"] ?? 0,
        terminatedOrgs: orgStatusMap["terminated"] ?? 0,
        totalUsers,
        pendingApproval: pendingUsers,
        mau: mauCount,
        openTickets,
        noticeCount,
        planCount,
        activeSubscriptions,
      },
      // 최근 등록 기업
      recentOrgs: recentOrgs.map((o) => ({
        id: o.id,
        organizationName: o.organizationName,
        status: o.status,
        industry: o.industry,
        userCount: o._count.users,
        worksiteCount: o._count.worksites,
        createdAt: o.createdAt,
      })),
      // 승인 대기 사용자
      recentPendingUsers: recentPendingUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        organizationName: u.organization?.organizationName ?? null,
        createdAt: u.createdAt,
      })),
      // 월별 추이
      monthlyOrgTrend: monthlyOrgTrend.map((r) => ({
        month: r.month,
        count: Number(r.count),
      })),
      // 감사 로그
      recentAuditLogs: recentAuditLogs.map((l) => ({
        id: l.id,
        actorName: l.actorName,
        action: l.action,
        targetName: l.targetName,
        createdAt: l.createdAt,
      })),
      // 미처리 문의
      recentTickets: recentTickets.map((t) => ({
        id: t.id,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        requesterName: t.requesterName,
        createdAt: t.createdAt,
      })),
    });
  } catch (err: any) {
    console.error("[GET /api/admin/dashboard]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
