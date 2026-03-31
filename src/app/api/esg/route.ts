import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthOrg, AuthError } from "@/lib/auth";

// GET /api/esg?domain=environment|social|governance
export async function GET(req: NextRequest) {
  try {
    const { organizationId } = await getAuthOrg();
    const domain = req.nextUrl.searchParams.get("domain") ?? "environment";
    const period = req.nextUrl.searchParams.get("period");

    const metrics = await prisma.esgMetric.findMany({
      where: {
        organizationId,
        esgDomain: domain,
        ...(period ? { period } : {}),
      },
      orderBy: [{ category: "asc" }, { indicatorName: "asc" }],
    });

    return NextResponse.json(
      metrics.map((row) => ({
        id: row.id,
        esgDomain: row.esgDomain,
        category: row.category,
        indicatorName: row.indicatorName,
        value: row.value != null ? parseFloat(String(row.value)) : null,
        unit: row.unit,
        period: row.period,
        source: row.source,
        status: row.status,
      }))
    );
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[GET /api/esg]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/esg — save metrics
export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await getAuthOrg();
    const body = await req.json();
    const { items } = body as { items: any[] };

    for (const item of items) {
      await prisma.esgMetric.upsert({
        where: { id: item.id },
        update: {
          category: item.category,
          indicatorName: item.indicatorName,
          value: item.value ?? null,
          unit: item.unit,
          period: item.period,
          source: item.source ?? null,
          status: item.status ?? "pending",
        },
        create: {
          id: item.id,
          organizationId,
          esgDomain: item.esgDomain,
          category: item.category,
          indicatorName: item.indicatorName,
          value: item.value ?? null,
          unit: item.unit,
          period: item.period,
          source: item.source ?? null,
          status: item.status ?? "pending",
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[POST /api/esg]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
