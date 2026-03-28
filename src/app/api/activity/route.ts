import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/activity?facilityId=xxx&year=2024
export async function GET(req: NextRequest) {
  const facilityId = req.nextUrl.searchParams.get("facilityId");
  const year = req.nextUrl.searchParams.get("year") ?? "2024";
  if (!facilityId) {
    return NextResponse.json({ error: "facilityId is required" }, { status: 400 });
  }
  try {
    const rows = await prisma.activityData.findMany({
      where: { facilityId, year: parseInt(year) },
      orderBy: { month: "asc" },
    });

    const values = Array(12).fill(0);
    for (const row of rows) {
      values[row.month - 1] = Number(row.activityValue);
    }
    return NextResponse.json({ facilityId, year: parseInt(year), values });
  } catch (err: any) {
    console.error("[GET /api/activity]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/activity — 월별 활동량 일괄 저장 (upsert)
export async function POST(req: NextRequest) {
  try {
    const body: {
      facilityId: string;
      year: number;
      values: number[];
      actor?: string;
    } = await req.json();

    if (!body.facilityId || !body.year || !Array.isArray(body.values)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // 이전 값 조회 (변경 내역 비교용)
    const prevRows = await prisma.activityData.findMany({
      where: { facilityId: body.facilityId, year: body.year },
      orderBy: { month: "asc" },
    });
    const prevValues = Array(12).fill(0);
    for (const row of prevRows) {
      prevValues[row.month - 1] = Number(row.activityValue);
    }

    for (let month = 1; month <= 12; month++) {
      const val = body.values[month - 1] ?? 0;
      await prisma.activityData.upsert({
        where: {
          uq_activity_data: {
            facilityId: body.facilityId,
            year: body.year,
            month,
          },
        },
        update: { activityValue: val },
        create: {
          facilityId: body.facilityId,
          year: body.year,
          month,
          activityValue: val,
        },
      });
    }

    // 변경된 월 감지 후 감사 로그 기록
    const changedMonths: string[] = [];
    for (let i = 0; i < 12; i++) {
      const prev = prevValues[i];
      const next = body.values[i] ?? 0;
      if (prev !== next) {
        changedMonths.push(`${i + 1}월: ${prev} → ${next}`);
      }
    }
    const isNew = prevRows.length === 0;
    const action = isNew ? "데이터 입력" : "데이터 수정";

    await prisma.activityAuditLog.create({
      data: {
        facilityId: body.facilityId,
        year: body.year,
        action,
        actor: body.actor ?? "사용자",
        detail: changedMonths.length > 0 ? changedMonths.join(", ") : "변경 없음",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[POST /api/activity]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
