import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET — 플랜 목록 + 기업별 구독 현황
export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type") ?? "plans";

    if (type === "plans") {
      const plans = await prisma.subscriptionPlan.findMany({
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { subscriptions: true } } },
      });
      return NextResponse.json(plans.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        description: p.description,
        monthlyPrice: p.monthlyPrice,
        maxUsers: p.maxUsers,
        maxWorksites: p.maxWorksites,
        features: p.features ? JSON.parse(p.features) : [],
        isActive: p.isActive,
        sortOrder: p.sortOrder,
        subscriberCount: p._count.subscriptions,
      })));
    }

    if (type === "subscriptions") {
      const subs = await prisma.orgSubscription.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          plan: { select: { name: true, code: true } },
        },
      });

      // organization name 조회
      const orgIds = [...new Set(subs.map((s) => s.organizationId))];
      const orgs = await prisma.organization.findMany({
        where: { id: { in: orgIds } },
        select: { id: true, organizationName: true },
      });
      const orgMap = Object.fromEntries(orgs.map((o) => [o.id, o.organizationName]));

      return NextResponse.json(subs.map((s) => ({
        id: s.id,
        organizationId: s.organizationId,
        organizationName: orgMap[s.organizationId] ?? "-",
        planId: s.planId,
        planName: s.plan.name,
        planCode: s.plan.code,
        status: s.status,
        startDate: s.startDate,
        endDate: s.endDate,
        memo: s.memo,
        createdAt: s.createdAt,
      })));
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "upsert-plan") {
      const { data } = body;
      if (data.id) {
        await prisma.subscriptionPlan.update({
          where: { id: data.id },
          data: {
            name: data.name,
            description: data.description ?? null,
            monthlyPrice: data.monthlyPrice ?? 0,
            maxUsers: data.maxUsers ?? 5,
            maxWorksites: data.maxWorksites ?? 1,
            features: data.features ? JSON.stringify(data.features) : null,
            isActive: data.isActive ?? true,
            sortOrder: data.sortOrder ?? 0,
          },
        });
      } else {
        await prisma.subscriptionPlan.create({
          data: {
            code: data.code,
            name: data.name,
            description: data.description ?? null,
            monthlyPrice: data.monthlyPrice ?? 0,
            maxUsers: data.maxUsers ?? 5,
            maxWorksites: data.maxWorksites ?? 1,
            features: data.features ? JSON.stringify(data.features) : null,
            isActive: data.isActive ?? true,
            sortOrder: data.sortOrder ?? 0,
          },
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "assign-plan") {
      const { organizationId, planId, startDate, endDate, memo } = body;
      await prisma.orgSubscription.create({
        data: {
          organizationId,
          planId,
          status: "active",
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          memo: memo ?? null,
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "cancel-subscription") {
      await prisma.orgSubscription.update({
        where: { id: body.id },
        data: { status: "cancelled" },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
