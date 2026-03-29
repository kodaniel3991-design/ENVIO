import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getConnector } from "@/lib/connectors";

/** GET /api/integrations — 전체 소스 목록 조회 */
export async function GET(req: NextRequest) {
  try {
    const scope = req.nextUrl.searchParams.get("scope");

    const where: Record<string, unknown> = {};
    if (scope) where.scope = parseInt(scope);

    const sources = await prisma.integrationSource.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        syncLogs: {
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
    });

    const result = sources.map((s) => ({
      id: s.id,
      name: s.name,
      source_type: s.sourceType,
      scope: s.scope,
      endpoint: s.endpoint,
      auth_type: s.authType,
      sync_interval: s.syncInterval,
      is_active: s.isActive,
      last_sync_at: s.lastSyncAt,
      last_sync_status: s.lastSyncStatus,
      last_sync: s.syncLogs[0]
        ? {
            status: s.syncLogs[0].status,
            records_saved: s.syncLogs[0].recordsSaved,
            started_at: s.syncLogs[0].startedAt,
          }
        : null,
      created_at: s.createdAt,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/integrations]", err);
    return NextResponse.json({ error: "소스 목록 조회 실패" }, { status: 500 });
  }
}

/** POST /api/integrations — 새 소스 등록 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      sourceType,
      scope,
      endpoint,
      authType = "api_key",
      authConfig,
      fieldMapping,
      syncInterval,
    } = body;

    if (!name || !sourceType) {
      return NextResponse.json({ error: "name, sourceType 필수" }, { status: 400 });
    }

    const source = await prisma.integrationSource.create({
      data: {
        name,
        sourceType,
        scope: scope ?? null,
        endpoint: endpoint ?? null,
        authType,
        authConfig: authConfig ? JSON.stringify(authConfig) : null,
        fieldMapping: fieldMapping ? JSON.stringify(fieldMapping) : null,
        syncInterval: syncInterval ?? null,
      },
    });

    return NextResponse.json({ id: source.id, name: source.name }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/integrations]", err);
    return NextResponse.json({ error: "소스 등록 실패" }, { status: 500 });
  }
}

/** PUT /api/integrations — 소스 수정 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) return NextResponse.json({ error: "id 필수" }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.endpoint !== undefined) updateData.endpoint = data.endpoint;
    if (data.authType !== undefined) updateData.authType = data.authType;
    if (data.authConfig !== undefined) updateData.authConfig = JSON.stringify(data.authConfig);
    if (data.fieldMapping !== undefined) updateData.fieldMapping = JSON.stringify(data.fieldMapping);
    if (data.syncInterval !== undefined) updateData.syncInterval = data.syncInterval;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await prisma.integrationSource.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PUT /api/integrations]", err);
    return NextResponse.json({ error: "소스 수정 실패" }, { status: 500 });
  }
}
