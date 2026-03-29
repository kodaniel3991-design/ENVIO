import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getConnector } from "@/lib/connectors";
import type { ConnectorConfig } from "@/lib/connectors";

/** POST /api/integrations/[id]/sync — 동기화 실행 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const sourceId = parseInt(params.id);
    if (isNaN(sourceId)) {
      return NextResponse.json({ error: "유효하지 않은 소스 ID" }, { status: 400 });
    }

    const source = await prisma.integrationSource.findUnique({
      where: { id: sourceId },
    });
    if (!source) {
      return NextResponse.json({ error: "소스를 찾을 수 없습니다" }, { status: 404 });
    }

    const connector = getConnector(source.sourceType);
    if (!connector) {
      return NextResponse.json({ error: `지원하지 않는 소스 타입: ${source.sourceType}` }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const year = body.year ?? new Date().getFullYear();
    const facilityId = body.facilityId ?? undefined;

    // 커넥터 설정 구성
    const config: ConnectorConfig = {
      endpoint: source.endpoint ?? "",
      authType: source.authType as ConnectorConfig["authType"],
      authConfig: source.authConfig ? JSON.parse(source.authConfig) : {},
      fieldMapping: source.fieldMapping ? JSON.parse(source.fieldMapping) : undefined,
    };

    // 동기화 실행
    const result = await connector.sync(config, year, facilityId);

    // 동기화 로그 저장
    await prisma.integrationSyncLog.create({
      data: {
        sourceId,
        status: result.status,
        recordsTotal: result.recordsTotal,
        recordsSaved: result.recordsSaved,
        recordsFailed: result.recordsFailed,
        errorMessage: result.errorMessage ?? null,
        detail: result.detail ? JSON.stringify(result.detail) : null,
        durationMs: result.durationMs,
        completedAt: new Date(),
      },
    });

    // 소스 마지막 동기화 상태 업데이트
    await prisma.integrationSource.update({
      where: { id: sourceId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: result.status,
      },
    });

    // 데이터를 activity_data에 저장 (성공 시)
    if (result.status !== "error" && facilityId) {
      const previews = await connector.preview(config, year);
      for (const preview of previews) {
        const targetFacilityId = facilityId || preview.facilityId;
        if (!targetFacilityId) continue;

        for (let month = 1; month <= 12; month++) {
          const value = preview.values[month - 1];
          if (value > 0) {
            await prisma.activityData.upsert({
              where: {
                uq_activity_data: {
                  facilityId: targetFacilityId,
                  year,
                  month,
                },
              },
              update: { activityValue: value },
              create: {
                facilityId: targetFacilityId,
                year,
                month,
                activityValue: value,
              },
            });
          }
        }

        // 감사 로그
        await prisma.activityAuditLog.create({
          data: {
            facilityId: targetFacilityId,
            year,
            actor: `API 연동 (${source.name})`,
            action: `${year}년 ${result.recordsSaved}건 동기화`,
            detail: JSON.stringify({ sourceId, sourceType: source.sourceType }),
          },
        });
      }
    }

    return NextResponse.json({
      status: result.status,
      records_total: result.recordsTotal,
      records_saved: result.recordsSaved,
      records_failed: result.recordsFailed,
      error_message: result.errorMessage,
      duration_ms: result.durationMs,
    });
  } catch (err) {
    console.error("[POST /api/integrations/[id]/sync]", err);
    return NextResponse.json({ error: "동기화 실행 실패" }, { status: 500 });
  }
}

/** GET /api/integrations/[id]/sync — 동기화 로그 조회 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const sourceId = parseInt(params.id);
    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "10");

    const logs = await prisma.integrationSyncLog.findMany({
      where: { sourceId },
      orderBy: { startedAt: "desc" },
      take: limit,
    });

    return NextResponse.json(
      logs.map((l) => ({
        id: l.id,
        status: l.status,
        records_total: l.recordsTotal,
        records_saved: l.recordsSaved,
        records_failed: l.recordsFailed,
        error_message: l.errorMessage,
        duration_ms: l.durationMs,
        started_at: l.startedAt,
        completed_at: l.completedAt,
      })),
    );
  } catch (err) {
    console.error("[GET /api/integrations/[id]/sync]", err);
    return NextResponse.json({ error: "로그 조회 실패" }, { status: 500 });
  }
}
