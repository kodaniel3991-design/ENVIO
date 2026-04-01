import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/commuting-work-days?year=2026
export async function GET(req: NextRequest) {
  try {
    const year = Number(req.nextUrl.searchParams.get("year"));
    if (!year || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "유효하지 않은 연도입니다." }, { status: 400 });
    }

    const rows = await prisma.commutingWorkDay.findMany({
      where: { year },
      orderBy: [{ employeeId: "asc" }, { month: "asc" }],
    });

    // { employeeId -> [0,0,...12개] } 형태로 변환
    const workDays: Record<string, number[]> = {};
    for (const row of rows) {
      if (!workDays[row.employeeId]) {
        workDays[row.employeeId] = Array(12).fill(0);
      }
      workDays[row.employeeId][row.month - 1] = row.days;
    }

    return NextResponse.json({ year: String(year), workDays });
  } catch (err: any) {
    console.error("[GET /api/commuting-work-days]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/commuting-work-days
// body: { year: "2026", workDays: { "emp-id-1": [22,21,22,0,...], ... } }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const year = Number(body.year);
    const workDays: Record<string, number[]> = body.workDays;

    if (!year || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "유효하지 않은 연도입니다." }, { status: 400 });
    }
    if (!workDays || typeof workDays !== "object") {
      return NextResponse.json({ error: "workDays가 필요합니다." }, { status: 400 });
    }

    for (const [employeeId, months] of Object.entries(workDays)) {
      if (!Array.isArray(months)) continue;
      for (let m = 0; m < 12; m++) {
        const days = Math.max(0, Math.round(months[m] ?? 0));
        await prisma.commutingWorkDay.upsert({
          where: {
            employeeId_year_month: { employeeId, year, month: m + 1 },
          },
          update: { days },
          create: { employeeId, year, month: m + 1, days },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[POST /api/commuting-work-days]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
