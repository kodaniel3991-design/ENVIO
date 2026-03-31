import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/admin/emission-factors — 배출계수 마스터 목록
export async function GET(req: NextRequest) {
  try {
    const scope = req.nextUrl.searchParams.get("scope");
    const country = req.nextUrl.searchParams.get("country");
    const search = req.nextUrl.searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (scope) where.scope = Number(scope);
    if (country) where.country = country;
    if (search) {
      where.OR = [
        { factorCode: { contains: search, mode: "insensitive" } },
        { sourceName: { contains: search, mode: "insensitive" } },
        { fuelCode: { contains: search, mode: "insensitive" } },
      ];
    }

    const factors = await prisma.emissionFactorMaster.findMany({
      where: where as any,
      include: { source: { select: { sourceCode: true, publisher: true } } },
      orderBy: [{ scope: "asc" }, { factorCode: "asc" }],
      take: 200,
    });

    return NextResponse.json(
      factors.map((f) => ({
        id: f.id,
        factorCode: f.factorCode,
        scope: f.scope,
        categoryCode: f.categoryCode,
        fuelCode: f.fuelCode,
        sourceType: f.sourceType,
        country: f.country,
        year: f.year,
        sourceName: f.sourceName,
        sourceVersion: f.sourceVersion,
        calculationMethod: f.calculationMethod,
        co2Factor: f.co2Factor ? Number(f.co2Factor) : null,
        ch4Factor: f.ch4Factor ? Number(f.ch4Factor) : null,
        n2oFactor: f.n2oFactor ? Number(f.n2oFactor) : null,
        co2FactorUnit: f.co2FactorUnit,
        ncv: f.ncv ? Number(f.ncv) : null,
        ncvUnit: f.ncvUnit,
        oxidationFactor: f.oxidationFactor ? Number(f.oxidationFactor) : null,
        active: f.active,
        sourcePublisher: f.source?.publisher ?? null,
      }))
    );
  } catch (err: any) {
    console.error("[GET /api/admin/emission-factors]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/emission-factors — upsert, delete
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "upsert") {
      const { data } = body;
      if (data.id) {
        await prisma.emissionFactorMaster.update({
          where: { id: data.id },
          data: {
            scope: data.scope,
            categoryCode: data.categoryCode ?? null,
            fuelCode: data.fuelCode ?? null,
            country: data.country ?? "KR",
            year: data.year,
            sourceName: data.sourceName,
            co2Factor: data.co2Factor ?? null,
            ch4Factor: data.ch4Factor ?? null,
            n2oFactor: data.n2oFactor ?? null,
            co2FactorUnit: data.co2FactorUnit ?? null,
            active: data.active ?? true,
          },
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      await prisma.emissionFactorMaster.delete({ where: { id: body.id } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[POST /api/admin/emission-factors]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
