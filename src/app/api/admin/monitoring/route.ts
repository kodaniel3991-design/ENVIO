import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [
      // 동기화 로그 (최근 20건)
      syncLogs,
      // 동기화 소스 현황
      integrationSources,
      // DB 테이블별 레코드 수
      orgCount,
      userCount,
      worksiteCount,
      facilityCount,
      activityDataCount,
      emissionFactorCount,
      kpiCount,
      vendorCount,
      reportCount,
      auditLogCount,
    ] = await Promise.all([
      prisma.integrationSyncLog.findMany({
        orderBy: { startedAt: "desc" },
        take: 20,
        include: { source: { select: { name: true, sourceType: true } } },
      }),
      prisma.integrationSource.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { syncLogs: true } } },
      }),
      prisma.organization.count(),
      prisma.user.count(),
      prisma.worksite.count(),
      prisma.emissionFacility.count(),
      prisma.activityData.count(),
      prisma.emissionFactorMaster.count(),
      prisma.kpiMaster.count(),
      prisma.vendor.count(),
      prisma.esgReport.count(),
      prisma.platformAuditLog.count(),
    ]);

    return NextResponse.json({
      syncLogs: syncLogs.map((l) => ({
        id: l.id,
        sourceName: l.source.name,
        sourceType: l.source.sourceType,
        status: l.status,
        recordsTotal: l.recordsTotal,
        recordsSaved: l.recordsSaved,
        recordsFailed: l.recordsFailed,
        errorMessage: l.errorMessage,
        durationMs: l.durationMs,
        startedAt: l.startedAt,
        completedAt: l.completedAt,
      })),
      integrationSources: integrationSources.map((s) => ({
        id: s.id,
        name: s.name,
        sourceType: s.sourceType,
        isActive: s.isActive,
        lastSyncAt: s.lastSyncAt,
        lastSyncStatus: s.lastSyncStatus,
        syncCount: s._count.syncLogs,
      })),
      dbStats: {
        organizations: orgCount,
        users: userCount,
        worksites: worksiteCount,
        emissionFacilities: facilityCount,
        activityData: activityDataCount,
        emissionFactors: emissionFactorCount,
        kpiMasters: kpiCount,
        vendors: vendorCount,
        reports: reportCount,
        auditLogs: auditLogCount,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/admin/monitoring]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
