import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

interface AuditLogParams {
  action: string;
  targetType: string;
  targetId: string;
  targetName?: string;
  detail?: string;
  ipAddress?: string;
}

export async function writeAuditLog(params: AuditLogParams) {
  try {
    let actorId = "system";
    let actorName = "시스템";

    try {
      const cookieStore = cookies();
      const token = cookieStore.get("auth-token")?.value;
      if (token) {
        const payload = await verifyToken(token);
        actorId = payload.userId;
        actorName = payload.name;
      }
    } catch {
      // token 없거나 만료 시 system으로 기록
    }

    await prisma.platformAuditLog.create({
      data: {
        actorId,
        actorName,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        targetName: params.targetName ?? null,
        detail: params.detail ?? null,
        ipAddress: params.ipAddress ?? null,
      },
    });
  } catch (err) {
    console.error("[AuditLog] Failed to write:", err);
  }
}
