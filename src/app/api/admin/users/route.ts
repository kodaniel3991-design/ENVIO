import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit-log";
import bcrypt from "bcryptjs";

// GET /api/admin/users — 전체 사용자 목록 (기업 정보 포함)
export async function GET(req: NextRequest) {
  try {
    const approvalStatus = req.nextUrl.searchParams.get("approvalStatus");
    const search = req.nextUrl.searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (approvalStatus && approvalStatus !== "all") {
      where.approvalStatus = approvalStatus;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where: where as any,
      include: {
        role: { select: { name: true } },
        organization: { select: { organizationName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        department: u.department,
        jobTitle: u.jobTitle,
        roleId: u.roleId,
        roleName: u.role?.name ?? null,
        status: u.status,
        approvalStatus: u.approvalStatus,
        isPlatformAdmin: u.isPlatformAdmin,
        organizationId: u.organizationId,
        organizationName: u.organization?.organizationName ?? null,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      }))
    );
  } catch (err: any) {
    console.error("[GET /api/admin/users]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/users — 승인/반려/상태변경/비밀번호초기화
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "approve") {
      const user = await prisma.user.update({
        where: { id: body.userId },
        data: {
          approvalStatus: "approved",
          status: "active",
          approvedAt: new Date(),
        },
      });
      await writeAuditLog({ action: "user.approve", targetType: "user", targetId: body.userId, targetName: user.name });
      return NextResponse.json({ ok: true });
    }

    if (action === "reject") {
      const user = await prisma.user.update({
        where: { id: body.userId },
        data: {
          approvalStatus: "rejected",
          status: "disabled",
          rejectionReason: body.reason ?? null,
        },
      });
      await writeAuditLog({ action: "user.reject", targetType: "user", targetId: body.userId, targetName: user.name, detail: body.reason });
      return NextResponse.json({ ok: true });
    }

    if (action === "change-status") {
      const user = await prisma.user.update({
        where: { id: body.userId },
        data: { status: body.status },
      });
      await writeAuditLog({ action: `user.${body.status}`, targetType: "user", targetId: body.userId, targetName: user.name, detail: `상태 변경: ${body.status}` });
      return NextResponse.json({ ok: true });
    }

    if (action === "reset-password") {
      const tempPassword = `temp${Math.random().toString(36).slice(2, 10)}!`;
      const hashed = await bcrypt.hash(tempPassword, 10);
      const user = await prisma.user.update({
        where: { id: body.userId },
        data: { password: hashed },
      });
      await writeAuditLog({ action: "user.reset-password", targetType: "user", targetId: body.userId, targetName: user.name });
      return NextResponse.json({ ok: true, tempPassword });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[POST /api/admin/users]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
