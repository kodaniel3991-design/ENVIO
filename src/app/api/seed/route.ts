import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: false,
    message: "Seed API는 Prisma 전환 후 미구현 상태입니다.",
  });
}
