import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit-log";

// GET — 챗봇 설정 조회
export async function GET() {
  try {
    const config = await prisma.chatbotConfig.findFirst();
    return NextResponse.json(config ?? null);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — 챗봇 설정 저장 / 토글
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "save") {
      const { data } = body;
      const existing = await prisma.chatbotConfig.findFirst();

      if (existing) {
        await prisma.chatbotConfig.update({
          where: { id: existing.id },
          data: {
            projectId: data.projectId,
            botName: data.botName,
            theme: data.theme ?? "light",
            placeholder: data.placeholder ?? null,
            welcomeMessage: data.welcomeMessage ?? null,
            ragNamespace: data.ragNamespace ?? null,
            chatApiUrl: data.chatApiUrl ?? null,
            confirmApiUrl: data.confirmApiUrl ?? null,
            isEnabled: data.isEnabled ?? false,
            position: data.position ?? "bottom-right",
          },
        });
      } else {
        await prisma.chatbotConfig.create({
          data: {
            projectId: data.projectId,
            botName: data.botName,
            theme: data.theme ?? "light",
            placeholder: data.placeholder ?? null,
            welcomeMessage: data.welcomeMessage ?? null,
            ragNamespace: data.ragNamespace ?? null,
            chatApiUrl: data.chatApiUrl ?? null,
            confirmApiUrl: data.confirmApiUrl ?? null,
            isEnabled: data.isEnabled ?? false,
            position: data.position ?? "bottom-right",
          },
        });
      }

      await writeAuditLog({
        action: "chatbot.save",
        targetType: "chatbot",
        targetId: data.projectId,
        targetName: data.botName,
        detail: data.isEnabled ? "챗봇 활성화" : "챗봇 비활성화",
      });

      return NextResponse.json({ ok: true });
    }

    if (action === "toggle") {
      const existing = await prisma.chatbotConfig.findFirst();
      if (!existing) {
        return NextResponse.json({ error: "챗봇 설정이 없습니다." }, { status: 400 });
      }
      const updated = await prisma.chatbotConfig.update({
        where: { id: existing.id },
        data: { isEnabled: !existing.isEnabled },
      });

      await writeAuditLog({
        action: updated.isEnabled ? "chatbot.enable" : "chatbot.disable",
        targetType: "chatbot",
        targetId: existing.projectId,
        targetName: existing.botName,
      });

      return NextResponse.json({ ok: true, isEnabled: updated.isEnabled });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
