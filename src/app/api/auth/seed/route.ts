import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST() {
  try {
    const email = "admin";
    const password = "1234";
    const hashed = await bcrypt.hash(password, 10);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // 기존 관리자 계정 업데이트 (비밀번호 + 플랫폼 관리자 플래그)
      await prisma.user.update({
        where: { email },
        data: { password: hashed, isPlatformAdmin: true, approvalStatus: "approved" },
      });
      return NextResponse.json({ ok: true, message: "관리자 계정이 업데이트되었습니다." });
    }

    await prisma.user.create({
      data: {
        id: randomUUID(),
        name: "관리자",
        email,
        password: hashed,
        status: "active",
        approvalStatus: "approved",
        isPlatformAdmin: true,
      },
    });

    return NextResponse.json({ ok: true, message: "관리자 계정이 생성되었습니다.", email, password });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
