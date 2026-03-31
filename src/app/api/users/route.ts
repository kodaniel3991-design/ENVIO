import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthOrg, AuthError } from "@/lib/auth";

// GET /api/users?type=users|roles
export async function GET(req: NextRequest) {
  try {
    const { organizationId } = await getAuthOrg();
    const type = req.nextUrl.searchParams.get("type") ?? "users";

    if (type === "users") {
      // 자기 조직 사용자만 조회
      const users = await prisma.user.findMany({
        where: { organizationId },
        include: { role: { select: { name: true } } },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(
        users.map((r) => ({
          id: r.id, name: r.name, email: r.email,
          department: r.department, jobTitle: r.jobTitle,
          roleId: r.roleId, roleName: r.role?.name ?? null,
          status: r.status, lastLoginAt: r.lastLoginAt,
        }))
      );
    }

    if (type === "roles") {
      // Role은 플랫폼 공용
      const roles = await prisma.role.findMany({ orderBy: { name: "asc" } });
      return NextResponse.json(
        roles.map((r) => ({
          id: r.id, name: r.name, description: r.description, systemCode: r.systemCode,
        }))
      );
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[GET /api/users]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/users — CRUD
export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await getAuthOrg();
    const body = await req.json();
    const { action } = body;

    if (action === "save-user") {
      const { item } = body;
      await prisma.user.upsert({
        where: { id: item.id },
        update: {
          name: item.name, email: item.email,
          department: item.department ?? null, jobTitle: item.jobTitle ?? null,
          roleId: item.roleId ?? null, status: item.status ?? "active",
        },
        create: {
          id: item.id, organizationId,
          name: item.name, email: item.email,
          department: item.department ?? null, jobTitle: item.jobTitle ?? null,
          roleId: item.roleId ?? null, status: item.status ?? "active",
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "save-role") {
      const { item } = body;
      await prisma.role.upsert({
        where: { id: item.id },
        update: { name: item.name, description: item.description ?? null, systemCode: item.systemCode ?? null },
        create: { id: item.id, name: item.name, description: item.description ?? null, systemCode: item.systemCode ?? null },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "delete-user") {
      // 소유권 검증
      const user = await prisma.user.findUnique({ where: { id: body.id }, select: { organizationId: true } });
      if (!user || user.organizationId !== organizationId) {
        return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
      }
      await prisma.user.delete({ where: { id: body.id } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[POST /api/users]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
