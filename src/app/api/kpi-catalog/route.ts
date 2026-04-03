import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AuthError, getAuthOrg } from "@/lib/auth";

// GET /api/kpi-catalog — 활성 KPI 카탈로그 (도메인별 그룹핑)
export async function GET() {
  try {
    await getAuthOrg();

    const items = await prisma.kpiCatalog.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    const result: Record<string, any[]> = { environmental: [], social: [], governance: [] };
    for (const item of items) {
      const domain = item.esgDomain;
      if (!(domain in result)) continue;
      result[domain].push({
        group: item.grp,
        name: item.name,
        description: item.description ?? "",
        reason: item.reason ?? "",
        criteria: item.criteria ?? "",
        frameworks: item.frameworks ? JSON.parse(item.frameworks) : [],
        priority: item.priority,
      });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[GET /api/kpi-catalog]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
