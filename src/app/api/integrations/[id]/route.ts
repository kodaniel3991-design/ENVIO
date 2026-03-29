import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getConnector } from "@/lib/connectors";
import type { ConnectorConfig } from "@/lib/connectors";

/** GET /api/integrations/[id] — 소스 상세 + 연결 테스트 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const sourceId = parseInt(params.id);
    const action = req.nextUrl.searchParams.get("action"); // "test" | "preview"
    const year = parseInt(req.nextUrl.searchParams.get("year") ?? String(new Date().getFullYear()));

    const source = await prisma.integrationSource.findUnique({
      where: { id: sourceId },
      include: { syncLogs: { orderBy: { startedAt: "desc" }, take: 5 } },
    });

    if (!source) {
      return NextResponse.json({ error: "소스를 찾을 수 없습니다" }, { status: 404 });
    }

    const config: ConnectorConfig = {
      endpoint: source.endpoint ?? "",
      authType: source.authType as ConnectorConfig["authType"],
      authConfig: source.authConfig ? JSON.parse(source.authConfig) : {},
      fieldMapping: source.fieldMapping ? JSON.parse(source.fieldMapping) : undefined,
    };

    // 연결 테스트
    if (action === "test") {
      const connector = getConnector(source.sourceType);
      if (!connector) {
        return NextResponse.json({ ok: false, message: "지원하지 않는 소스 타입" });
      }
      const result = await connector.testConnection(config);
      return NextResponse.json(result);
    }

    // 데이터 미리보기
    if (action === "preview") {
      const connector = getConnector(source.sourceType);
      if (!connector) {
        return NextResponse.json({ error: "지원하지 않는 소스 타입" }, { status: 400 });
      }
      const previews = await connector.preview(config, year);
      return NextResponse.json(previews);
    }

    // 기본: 상세 정보
    return NextResponse.json({
      id: source.id,
      name: source.name,
      source_type: source.sourceType,
      scope: source.scope,
      endpoint: source.endpoint,
      auth_type: source.authType,
      field_mapping: source.fieldMapping ? JSON.parse(source.fieldMapping) : null,
      sync_interval: source.syncInterval,
      is_active: source.isActive,
      last_sync_at: source.lastSyncAt,
      last_sync_status: source.lastSyncStatus,
      sync_logs: source.syncLogs.map((l) => ({
        id: l.id,
        status: l.status,
        records_saved: l.recordsSaved,
        duration_ms: l.durationMs,
        started_at: l.startedAt,
      })),
    });
  } catch (err) {
    console.error("[GET /api/integrations/[id]]", err);
    return NextResponse.json({ error: "소스 조회 실패" }, { status: 500 });
  }
}

/** DELETE /api/integrations/[id] — 소스 삭제 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const sourceId = parseInt(params.id);
    await prisma.integrationSource.delete({ where: { id: sourceId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/integrations/[id]]", err);
    return NextResponse.json({ error: "소스 삭제 실패" }, { status: 500 });
  }
}
