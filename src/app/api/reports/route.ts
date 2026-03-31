import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthOrg, AuthError } from "@/lib/auth";

// GET /api/reports?type=list|compliance|mappings
export async function GET(req: NextRequest) {
  try {
    const { organizationId } = await getAuthOrg();
    const orgFilter = { organizationId };
    const type = req.nextUrl.searchParams.get("type") ?? "list";

    if (type === "list") {
      const reports = await prisma.esgReport.findMany({ where: orgFilter, orderBy: { createdAt: "desc" } });
      return NextResponse.json(
        reports.map((r) => ({
          id: r.id, title: r.title, type: r.type, period: r.period,
          status: r.status, framework: r.framework, version: r.version,
          publishedAt: r.publishedAt, createdAt: r.createdAt,
        }))
      );
    }

    if (type === "compliance") {
      const items = await prisma.complianceItem.findMany({
        where: orgFilter,
        orderBy: [{ framework: "asc" }, { requirement: "asc" }],
      });
      return NextResponse.json(
        items.map((r) => ({
          id: r.id, framework: r.framework, requirement: r.requirement,
          status: r.status, dueDate: r.dueDate, lastChecked: r.lastChecked,
        }))
      );
    }

    if (type === "mappings") {
      const mappings = await prisma.kpiDisclosureMapping.findMany({
        where: orgFilter,
        orderBy: [{ framework: "asc" }, { kpiCode: "asc" }],
      });
      return NextResponse.json(
        mappings.map((r) => ({
          id: r.id, kpiCode: r.kpiCode, kpiName: r.kpiName,
          kpiCategory: r.kpiCategory, framework: r.framework,
          disclosureCode: r.disclosureCode, status: r.status,
        }))
      );
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[GET /api/reports]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/reports
export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await getAuthOrg();
    const body = await req.json();
    const { action } = body;

    if (action === "save-report") {
      const { item } = body;
      await prisma.esgReport.upsert({
        where: { id: item.id },
        update: {
          title: item.title, type: item.type, period: item.period,
          status: item.status ?? "draft", framework: item.framework ?? null,
          version: item.version ?? null,
        },
        create: {
          id: item.id, organizationId, title: item.title, type: item.type,
          period: item.period, status: item.status ?? "draft",
          framework: item.framework ?? null, version: item.version ?? null,
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "save-compliance") {
      const { items } = body as { items: any[] };
      for (const item of items) {
        await prisma.complianceItem.upsert({
          where: { id: item.id },
          update: {
            framework: item.framework, requirement: item.requirement,
            status: item.status, dueDate: item.dueDate ? new Date(item.dueDate) : null,
            lastChecked: new Date(),
          },
          create: {
            id: item.id, organizationId, framework: item.framework,
            requirement: item.requirement, status: item.status,
            dueDate: item.dueDate ? new Date(item.dueDate) : null,
            lastChecked: new Date(),
          },
        });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[POST /api/reports]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
