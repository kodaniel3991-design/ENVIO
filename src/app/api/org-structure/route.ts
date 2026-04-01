import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthOrg, AuthError } from "@/lib/auth";

// GET /api/org-structure
export async function GET() {
  try {
    const { organizationId } = await getAuthOrg();
    const orgFilter = { organizationId };
    const [departments, teams, positions, duties] = await Promise.all([
      prisma.orgDepartment.findMany({ where: orgFilter, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
      prisma.orgTeam.findMany({ where: orgFilter, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
      prisma.orgPosition.findMany({ where: orgFilter, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
      prisma.orgDuty.findMany({ where: orgFilter, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    ]);

    return NextResponse.json({
      departments: departments.map((d) => ({
        id: d.id,
        name: d.name,
        sort_order: d.sortOrder,
      })),
      teams: teams.map((t) => ({
        id: t.id,
        department_id: t.departmentId,
        departmentId: t.departmentId,
        name: t.name,
        leader_name: t.leaderName,
        default_duty_name: t.defaultDutyName,
        defaultDutyName: t.defaultDutyName,
        sort_order: t.sortOrder,
      })),
      positions: positions.map((p) => ({
        id: p.id,
        name: p.name,
        sort_order: p.sortOrder,
      })),
      duties: duties.map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description ?? "",
        sort_order: d.sortOrder,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/org-structure
export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await getAuthOrg();
    const body = await req.json();
    const { type, action, item } = body as {
      type: "department" | "team" | "position" | "duty";
      action: "upsert" | "delete";
      item: any;
    };

    if (action === "delete") {
      if (type === "department") {
        await prisma.orgDepartment.delete({ where: { id: item.id } });
      } else if (type === "team") {
        await prisma.orgTeam.delete({ where: { id: item.id } });
      } else if (type === "position") {
        await prisma.orgPosition.delete({ where: { id: item.id } });
      } else if (type === "duty") {
        await prisma.orgDuty.delete({ where: { id: item.id } });
      }
      return NextResponse.json({ ok: true });
    }

    if (type === "department") {
      await prisma.orgDepartment.upsert({
        where: { id: item.id },
        update: { name: item.name, sortOrder: item.sort_order ?? 0 },
        create: { id: item.id, organizationId, name: item.name, sortOrder: item.sort_order ?? 0 },
      });
    } else if (type === "team") {
      await prisma.orgTeam.upsert({
        where: { id: item.id },
        update: {
          departmentId: item.departmentId ?? null,
          name: item.name,
          leaderName: item.leaderName ?? null,
          defaultDutyName: item.defaultDutyName ?? null,
          sortOrder: item.sort_order ?? 0,
        },
        create: {
          id: item.id, organizationId,
          departmentId: item.departmentId ?? null,
          name: item.name,
          leaderName: item.leaderName ?? null,
          defaultDutyName: item.defaultDutyName ?? null,
          sortOrder: item.sort_order ?? 0,
        },
      });
    } else if (type === "position") {
      await prisma.orgPosition.upsert({
        where: { id: item.id },
        update: { name: item.name, sortOrder: item.sort_order ?? 0 },
        create: { id: item.id, organizationId, name: item.name, sortOrder: item.sort_order ?? 0 },
      });
    } else if (type === "duty") {
      await prisma.orgDuty.upsert({
        where: { id: item.id },
        update: { name: item.name, description: item.description ?? null, sortOrder: item.sort_order ?? 0 },
        create: { id: item.id, organizationId, name: item.name, description: item.description ?? null, sortOrder: item.sort_order ?? 0 },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
