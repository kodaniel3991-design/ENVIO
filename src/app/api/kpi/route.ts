import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

// GET /api/kpi?type=master|targets|performance|change-log
export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type") ?? "master";

    if (type === "master") {
      const domain = req.nextUrl.searchParams.get("domain");
      const masters = await prisma.kpiMaster.findMany({
        where: domain ? { esgDomain: domain } : undefined,
        orderBy: { code: "asc" },
      });
      return NextResponse.json(
        masters.map((r) => ({
          id: r.id,
          esgDomain: r.esgDomain ?? "",
          code: r.code,
          name: r.name,
          category: r.category,
          unit: r.unit,
          description: r.description ?? "",
          reportIncluded: r.reportIncluded,
        }))
      );
    }

    if (type === "targets") {
      const period = req.nextUrl.searchParams.get("period");
      const targets = await prisma.kpiTarget.findMany({
        where: period ? { period } : undefined,
        include: { kpi: true },
        orderBy: { kpi: { code: "asc" } },
      });
      return NextResponse.json(
        targets.map((r) => ({
          id: r.id,
          kpiId: r.kpiId,
          kpiName: r.kpi.name,
          kpiCode: r.kpi.code,
          category: r.kpi.category,
          unit: r.kpi.unit,
          period: r.period,
          targetValue: parseFloat(String(r.targetValue)),
          updatedBy: r.updatedBy,
          updatedAt: r.updatedAt,
        }))
      );
    }

    if (type === "performance") {
      const period = req.nextUrl.searchParams.get("period");
      const performances = await prisma.kpiPerformance.findMany({
        where: period ? { period } : undefined,
        include: {
          kpi: {
            include: { targets: true },
          },
        },
        orderBy: { kpi: { code: "asc" } },
      });
      return NextResponse.json(
        performances.map((r) => {
          const actual = parseFloat(String(r.actualValue));
          // Find matching target for same period
          const matchingTarget = r.kpi.targets.find((t) => t.period === r.period);
          const target = matchingTarget ? parseFloat(String(matchingTarget.targetValue)) : null;
          return {
            id: r.id,
            kpiId: r.kpiId,
            kpiName: r.kpi.name,
            kpiCode: r.kpi.code,
            category: r.kpi.category,
            unit: r.kpi.unit,
            period: r.period,
            actualValue: actual,
            targetValue: target,
            achievementPercent: target ? Math.round((actual / target) * 100) : null,
            updatedBy: r.updatedBy,
            updatedAt: r.updatedAt,
          };
        })
      );
    }

    if (type === "change-log") {
      const logs = await prisma.kpiChangeLog.findMany({
        include: { kpi: true },
        orderBy: { changedAt: "desc" },
      });
      return NextResponse.json(
        logs.map((r) => ({
          id: r.id,
          kpiId: r.kpiId,
          kpiName: r.kpi.name,
          field: r.field,
          oldValue: r.oldValue,
          newValue: r.newValue,
          changedBy: r.changedBy,
          changedAt: r.changedAt,
        }))
      );
    }

    if (type === "list") {
      const period = req.nextUrl.searchParams.get("period") ?? String(new Date().getFullYear());
      const domain = req.nextUrl.searchParams.get("domain");
      const masters = await prisma.kpiMaster.findMany({
        where: domain ? { esgDomain: domain } : undefined,
        include: {
          targets: { where: { period } },
          performance: { where: { period } },
        },
        orderBy: { code: "asc" },
      });
      return NextResponse.json(
        masters.map((m) => {
          const target = m.targets[0];
          const perf = m.performance[0];
          const targetVal = target ? parseFloat(String(target.targetValue)) : null;
          const actualVal = perf ? parseFloat(String(perf.actualValue)) : undefined;
          const achievement = targetVal && actualVal != null ? Math.round((actualVal / targetVal) * 100) : undefined;
          const status = achievement == null ? undefined : achievement >= 90 ? "on_track" : achievement >= 70 ? "attention" : "anomaly";
          const domainMap: Record<string, string> = { environment: "environment", social: "social", governance: "governance" };
          const category = (m.esgDomain && domainMap[m.esgDomain] ? domainMap[m.esgDomain] : "environment") as any;
          return {
            id: m.id,
            name: m.name,
            category,
            unit: m.unit,
            target: targetVal ?? "—",
            actual: actualVal,
            achievementPercent: achievement,
            period,
            status,
            isMissing: perf == null,
            reportIncluded: m.reportIncluded,
          };
        })
      );
    }

    if (type === "summary") {
      const period = req.nextUrl.searchParams.get("period") ?? String(new Date().getFullYear());
      const masters = await prisma.kpiMaster.findMany({
        include: {
          targets: { where: { period } },
          performance: { where: { period } },
        },
      });
      const total = masters.length;
      const withTarget = masters.filter((m) => m.targets.length > 0).length;
      const withPerf = masters.filter((m) => m.performance.length > 0).length;
      const onTrack = masters.filter((m) => {
        const t = m.targets[0];
        const p = m.performance[0];
        if (!t || !p) return false;
        const pct = parseFloat(String(p.actualValue)) / parseFloat(String(t.targetValue)) * 100;
        return pct >= 90;
      }).length;
      return NextResponse.json([
        { label: "전체 KPI", value: total },
        { label: "목표 설정", value: withTarget },
        { label: "데이터 입력", value: withPerf },
        { label: "목표 달성", value: onTrack },
      ]);
    }

    // type=by-scope&scope=1 — 해당 Scope에 기여하는 KPI 목록 (calcRule 기반)
    if (type === "by-scope") {
      const scopeParam = req.nextUrl.searchParams.get("scope");
      const categoryParam = req.nextUrl.searchParams.get("category"); // optional
      if (!scopeParam) {
        return NextResponse.json({ error: "scope 파라미터 필수" }, { status: 400 });
      }
      const scopeNum = parseInt(scopeParam);

      const allAuto = await prisma.kpiMaster.findMany({
        where: { calcType: "auto" },
        orderBy: { code: "asc" },
      });

      const matched = allAuto.filter((kpi) => {
        if (!kpi.calcRule) return false;
        try {
          const rule = JSON.parse(kpi.calcRule);
          const scopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope];
          if (!scopes.includes(scopeNum)) return false;
          if (categoryParam && rule.categories && Array.isArray(rule.categories)) {
            return rule.categories.includes(categoryParam);
          }
          return true;
        } catch {
          return false;
        }
      });

      return NextResponse.json(
        matched.map((r) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          category: r.category,
          unit: r.unit,
          calcType: r.calcType,
          calcRule: r.calcRule ? JSON.parse(r.calcRule) : null,
        }))
      );
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: any) {
    console.error("[GET /api/kpi]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/kpi — CRUD for KPI master, targets, performance
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "save-master") {
      const { items } = body as { items: any[] };
      for (const item of items) {
        await prisma.kpiMaster.upsert({
          where: { id: item.id },
          update: {
            esgDomain: item.esgDomain || null,
            code: item.code,
            name: item.name,
            category: item.category,
            unit: item.unit,
            description: item.description ?? null,
            reportIncluded: item.reportIncluded ? true : false,
          },
          create: {
            id: item.id,
            esgDomain: item.esgDomain || null,
            code: item.code,
            name: item.name,
            category: item.category,
            unit: item.unit,
            description: item.description ?? null,
            reportIncluded: item.reportIncluded ? true : false,
          },
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "save-targets") {
      const { items } = body as { items: any[] };
      for (const item of items) {
        await prisma.kpiTarget.upsert({
          where: { id: item.id },
          update: {
            targetValue: item.targetValue,
            updatedBy: item.updatedBy ?? null,
          },
          create: {
            id: item.id,
            kpiId: item.kpiId,
            period: item.period,
            targetValue: item.targetValue,
            updatedBy: item.updatedBy ?? null,
          },
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "save-performance") {
      const { items } = body as { items: any[] };
      for (const item of items) {
        await prisma.kpiPerformance.upsert({
          where: { id: item.id },
          update: {
            actualValue: item.actualValue,
            updatedBy: item.updatedBy ?? null,
          },
          create: {
            id: item.id,
            kpiId: item.kpiId,
            period: item.period,
            actualValue: item.actualValue,
            updatedBy: item.updatedBy ?? null,
          },
        });
      }
      return NextResponse.json({ ok: true });
    }

    // 온보딩 위저드 — 선택된 KPI를 kpi_masters에 upsert (code 기준)
    if (action === "setup-kpis") {
      const { items } = body as {
        items: {
          code: string;
          name: string;
          esgDomain: string;
          category: string;
          unit: string;
          description: string;
        }[];
      };
      for (const item of items) {
        const existing = await prisma.kpiMaster.findUnique({ where: { code: item.code } });
        if (existing) {
          await prisma.kpiMaster.update({
            where: { code: item.code },
            data: {
              name: item.name,
              esgDomain: item.esgDomain,
              category: item.category,
              unit: item.unit,
              description: item.description,
              reportIncluded: true,
            },
          });
        } else {
          await prisma.kpiMaster.create({
            data: {
              id: randomUUID(),
              code: item.code,
              name: item.name,
              esgDomain: item.esgDomain,
              category: item.category,
              unit: item.unit,
              description: item.description,
              reportIncluded: true,
            },
          });
        }
      }
      return NextResponse.json({ ok: true, count: items.length });
    }

    if (action === "delete-master") {
      const { id } = body;
      await prisma.kpiMaster.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[POST /api/kpi]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
