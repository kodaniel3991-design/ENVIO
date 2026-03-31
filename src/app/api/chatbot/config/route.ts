import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/chatbot/config — 활성화된 챗봇 설정 (사용자 화면용)
export async function GET() {
  try {
    const config = await prisma.chatbotConfig.findFirst({
      where: { isEnabled: true },
    });

    if (!config) {
      return NextResponse.json({ enabled: false });
    }

    return NextResponse.json({
      enabled: true,
      projectId: config.projectId,
      botName: config.botName,
      theme: config.theme,
      placeholder: config.placeholder,
      welcomeMessage: config.welcomeMessage,
      ragNamespace: config.ragNamespace,
      chatApiUrl: config.chatApiUrl,
      confirmApiUrl: config.confirmApiUrl,
      position: config.position,
    });
  } catch {
    return NextResponse.json({ enabled: false });
  }
}
