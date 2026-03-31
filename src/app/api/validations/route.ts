import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthOrg, AuthError } from "@/lib/auth";

// GET /api/validations?type=validations|approvals
export async function GET(req: NextRequest) {
  try {
    const { organizationId } = await getAuthOrg();
    const orgFilter = { organizationId };
    const type = req.nextUrl.searchParams.get("type") ?? "validations";

    if (type === "validations") {
      const validations = await prisma.dataValidation.findMany({
        where: orgFilter,
        orderBy: { submittedAt: "desc" },
      });
      return NextResponse.json(
        validations.map((r) => ({
          id: r.id, scope: r.scope, category: r.category,
          emissionSource: r.emissionSource, site: r.site, period: r.period,
          activityAmount: r.activityAmount, emissions: r.emissions,
          status: r.status, aiVerification: r.aiVerification,
          dataSource: r.dataSource, evidenceCount: r.evidenceCount,
          submittedBy: r.submittedBy, submittedAt: r.submittedAt,
        }))
      );
    }

    if (type === "approvals") {
      const approvals = await prisma.dataApproval.findMany({
        where: { validation: orgFilter },
        include: {
          validation: {
            select: { scope: true, category: true, emissionSource: true, site: true, period: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(
        approvals.map((r) => ({
          id: r.id, validationId: r.validationId, status: r.status,
          approver: r.approver, comment: r.comment, approvedAt: r.approvedAt,
          scope: r.validation.scope, category: r.validation.category,
          emissionSource: r.validation.emissionSource,
          site: r.validation.site, period: r.validation.period,
        }))
      );
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[GET /api/validations]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/validations — CRUD
export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await getAuthOrg();
    const body = await req.json();
    const { action } = body;

    if (action === "save-validation") {
      const { item } = body;
      await prisma.dataValidation.upsert({
        where: { id: item.id },
        update: {
          status: item.status ?? "submitted",
          activityAmount: item.activityAmount ?? null,
          emissions: item.emissions ?? null,
        },
        create: {
          id: item.id, organizationId,
          scope: item.scope, category: item.category,
          emissionSource: item.emissionSource, site: item.site,
          period: item.period, activityAmount: item.activityAmount ?? null,
          emissions: item.emissions ?? null,
          status: item.status ?? "submitted", submittedAt: new Date(),
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "update-status") {
      const { id, status } = body;
      // 소유권 검증
      const v = await prisma.dataValidation.findUnique({ where: { id }, select: { organizationId: true } });
      if (!v || v.organizationId !== organizationId) {
        return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
      }
      await prisma.dataValidation.update({ where: { id }, data: { status } });
      return NextResponse.json({ ok: true });
    }

    if (action === "approve") {
      const { id, status, approver, comment } = body;
      await prisma.dataApproval.update({
        where: { id },
        data: { status, approver: approver ?? null, comment: comment ?? null, approvedAt: new Date() },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[POST /api/validations]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
