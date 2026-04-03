import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/admin/kpi-catalog
export async function GET(req: NextRequest) {
  try {
    const domain = req.nextUrl.searchParams.get("domain");
    const search = req.nextUrl.searchParams.get("search");

    const where: any = {};
    if (domain && domain !== "all") where.esgDomain = domain;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { grp: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const items = await prisma.kpiCatalog.findMany({
      where,
      orderBy: [{ esgDomain: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(
      items.map((item) => ({
        id: item.id,
        esgDomain: item.esgDomain,
        group: item.grp,
        name: item.name,
        description: item.description ?? "",
        reason: item.reason ?? "",
        criteria: item.criteria ?? "",
        frameworks: item.frameworks ? JSON.parse(item.frameworks) : [],
        priority: item.priority,
        sortOrder: item.sortOrder,
        active: item.active,
      }))
    );
  } catch (err: any) {
    console.error("[GET /api/admin/kpi-catalog]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/kpi-catalog
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "upsert") {
      const { item } = body;
      if (item.id) {
        await prisma.kpiCatalog.update({
          where: { id: item.id },
          data: {
            esgDomain: item.esgDomain,
            grp: item.group,
            name: item.name,
            description: item.description ?? null,
            reason: item.reason ?? null,
            criteria: item.criteria ?? null,
            frameworks: JSON.stringify(item.frameworks ?? []),
            priority: item.priority ?? "recommended",
            sortOrder: item.sortOrder ?? 0,
            active: item.active ?? true,
          },
        });
      } else {
        await prisma.kpiCatalog.create({
          data: {
            esgDomain: item.esgDomain,
            grp: item.group,
            name: item.name,
            description: item.description ?? null,
            reason: item.reason ?? null,
            criteria: item.criteria ?? null,
            frameworks: JSON.stringify(item.frameworks ?? []),
            priority: item.priority ?? "recommended",
            sortOrder: item.sortOrder ?? 0,
            active: item.active ?? true,
          },
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      await prisma.kpiCatalog.delete({ where: { id: body.id } });
      return NextResponse.json({ ok: true });
    }

    if (action === "toggle-active") {
      const current = await prisma.kpiCatalog.findUnique({ where: { id: body.id } });
      if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
      await prisma.kpiCatalog.update({
        where: { id: body.id },
        data: { active: !current.active },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[POST /api/admin/kpi-catalog]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
