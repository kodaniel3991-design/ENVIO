import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category");
    const where: Record<string, unknown> = {};
    if (category) where.category = category;

    const notices = await prisma.notice.findMany({
      where: where as any,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(notices);
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

    if (action === "create") {
      const { data } = body;
      const notice = await prisma.notice.create({
        data: {
          title: data.title,
          content: data.content,
          category: data.category ?? "general",
          isPinned: data.isPinned ?? false,
          isPublished: data.isPublished ?? false,
          authorId: user?.userId ?? "system",
          authorName: user?.name ?? "시스템",
          publishedAt: data.isPublished ? new Date() : null,
        },
      });
      return NextResponse.json({ ok: true, id: notice.id });
    }

    if (action === "update") {
      const { id, data } = body;
      const current = await prisma.notice.findUnique({ where: { id } });
      await prisma.notice.update({
        where: { id },
        data: {
          title: data.title,
          content: data.content,
          category: data.category,
          isPinned: data.isPinned,
          isPublished: data.isPublished,
          publishedAt: data.isPublished && !current?.isPublished ? new Date() : current?.publishedAt,
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      await prisma.notice.delete({ where: { id: body.id } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
