import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";

export async function POST(request: Request) {
  try {
    const { email, password, autoLogin } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "이메일과 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return NextResponse.json(
        { error: "이메일 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "이메일 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 로그인 감사 로그 (writeAuditLog는 쿠키에서 토큰을 읽으므로 직접 기록)
    try {
      await prisma.platformAuditLog.create({
        data: {
          actorId: user.id,
          actorName: user.name,
          action: "auth.login",
          targetType: "user",
          targetId: user.id,
          targetName: user.name,
        },
      });
    } catch { /* 로그 실패 시 로그인 차단하지 않음 */ }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      isPlatformAdmin: user.isPlatformAdmin,
      organizationId: user.organizationId,
    });

    const response = NextResponse.json({ ok: true, name: user.name });
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: autoLogin ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
