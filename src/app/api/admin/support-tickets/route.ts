import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status");
    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;

    const tickets = await prisma.supportTicket.findMany({
      where: where as any,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tickets);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    const token = req.cookies.get("auth-token")?.value;
    const user = token ? await verifyToken(token) : null;

    if (action === "reply") {
      const { id, reply } = body;
      await prisma.supportTicket.update({
        where: { id },
        data: {
          reply,
          repliedAt: new Date(),
          assigneeId: user?.userId,
          assigneeName: user?.name,
          status: "in_progress",
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "resolve") {
      await prisma.supportTicket.update({
        where: { id: body.id },
        data: { status: "resolved", resolvedAt: new Date() },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "close") {
      await prisma.supportTicket.update({
        where: { id: body.id },
        data: { status: "closed" },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "change-status") {
      await prisma.supportTicket.update({
        where: { id: body.id },
        data: { status: body.status },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
