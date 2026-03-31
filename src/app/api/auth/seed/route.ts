import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    // 특정 사용자 비밀번호 설정: { email, password }
    let body: { email?: string; password?: string } = {};
    try { body = await request.json(); } catch { /* empty body = admin seed */ }

    if (body.email && body.password) {
      const user = await prisma.user.findUnique({ where: { email: body.email } });
      if (!user) {
        return NextResponse.json({ ok: false, error: "사용자를 찾을 수 없습니다." }, { status: 404 });
      }
      const hashed = await bcrypt.hash(body.password, 10);
      await prisma.user.update({
        where: { email: body.email },
        data: { password: hashed },
      });
      return NextResponse.json({ ok: true, message: `${user.name} 비밀번호가 설정되었습니다.` });
    }

    // 기본: 관리자 + 테스트 사용자 시드
    const hashed = await bcrypt.hash("1234", 10);

    // 조직 확인/생성
    let org = await prisma.organization.findFirst({ orderBy: { id: "asc" } });
    if (!org) {
      org = await prisma.organization.create({
        data: { organizationName: "진양오토모티브", industry: "자동차", country: "대한민국", employeeCount: "1,000~5,000명" },
      });
    }

    // 관리자 계정
    const adminExisting = await prisma.user.findUnique({ where: { email: "admin" } });
    if (adminExisting) {
      await prisma.user.update({
        where: { email: "admin" },
        data: { password: hashed, isPlatformAdmin: true, approvalStatus: "approved", organizationId: org.id },
      });
    } else {
      await prisma.user.create({
        data: { id: randomUUID(), name: "관리자", email: "admin", password: hashed, status: "active", approvalStatus: "approved", isPlatformAdmin: true, organizationId: org.id },
      });
    }

    // 일반 사용자 계정
    const userExisting = await prisma.user.findUnique({ where: { email: "user@test.com" } });
    if (userExisting) {
      await prisma.user.update({
        where: { email: "user@test.com" },
        data: { password: hashed, organizationId: org.id, approvalStatus: "approved" },
      });
    } else {
      await prisma.user.create({
        data: { id: randomUUID(), name: "이영희", email: "user@test.com", password: hashed, status: "active", approvalStatus: "approved", organizationId: org.id },
      });
    }

    // yhlee@envio.kr 계정
    const yhleeHashed = await bcrypt.hash("luonai2026", 10);
    const yhleeExisting = await prisma.user.findUnique({ where: { email: "yhlee@envio.kr" } });
    if (yhleeExisting) {
      await prisma.user.update({
        where: { email: "yhlee@envio.kr" },
        data: { password: yhleeHashed, organizationId: org.id, approvalStatus: "approved" },
      });
    } else {
      await prisma.user.create({
        data: { id: randomUUID(), name: "이영희", email: "yhlee@envio.kr", password: yhleeHashed, status: "active", approvalStatus: "approved", organizationId: org.id },
      });
    }

    return NextResponse.json({ ok: true, message: "시드 완료", orgId: org.id, users: ["admin", "user@test.com", "yhlee@envio.kr"] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
