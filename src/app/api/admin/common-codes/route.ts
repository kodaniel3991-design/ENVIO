import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/admin/common-codes?group=unit
export async function GET(req: NextRequest) {
  try {
    const group = req.nextUrl.searchParams.get("group");

    const where: Record<string, unknown> = {};
    if (group) where.codeGroup = group;

    const codes = await prisma.commonCode.findMany({
      where: where as any,
      orderBy: [{ codeGroup: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(
      codes.map((c) => ({
        id: c.id,
        codeGroup: c.codeGroup,
        code: c.code,
        name: c.name,
        description: c.description,
        sortOrder: c.sortOrder,
        active: c.active,
      }))
    );
  } catch (err: any) {
    console.error("[GET /api/admin/common-codes]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/common-codes — upsert, delete
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "upsert") {
      const { data } = body;
      if (data.id) {
        await prisma.commonCode.update({
          where: { id: data.id },
          data: {
            codeGroup: data.codeGroup,
            code: data.code,
            name: data.name,
            description: data.description ?? null,
            sortOrder: data.sortOrder ?? 0,
            active: data.active ?? true,
          },
        });
      } else {
        await prisma.commonCode.create({
          data: {
            codeGroup: data.codeGroup,
            code: data.code,
            name: data.name,
            description: data.description ?? null,
            sortOrder: data.sortOrder ?? 0,
            active: data.active ?? true,
          },
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      await prisma.commonCode.delete({ where: { id: body.id } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[POST /api/admin/common-codes]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
