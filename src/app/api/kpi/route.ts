import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

// GET /api/kpi?type=master|targets|performance|change-log
export async function GET(req: NextRequest) {
  try {
    const pool = await getPool();
    const type = req.nextUrl.searchParams.get("type") ?? "master";

    if (type === "master") {
      const result = await pool.request().query(`
        SELECT id, code, name, category, unit, description, report_included
        FROM kpi_masters ORDER BY code;
      `);
      return NextResponse.json(
        result.recordset.map((r: any) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          category: r.category,
          unit: r.unit,
          description: r.description ?? "",
          reportIncluded: r.report_included,
        }))
      );
    }

    if (type === "targets") {
      const period = req.nextUrl.searchParams.get("period");
      let q = `
        SELECT t.id, t.kpi_id, m.name AS kpi_name, m.code AS kpi_code,
               m.category, m.unit, t.period, t.target_value, t.updated_by, t.updated_at
        FROM kpi_targets t JOIN kpi_masters m ON t.kpi_id = m.id
      `;
      if (period) q += ` WHERE t.period = @period`;
      q += ` ORDER BY m.code;`;
      const r = pool.request();
      if (period) r.input("period", sql.NVarChar(50), period);
      const result = await r.query(q);
      return NextResponse.json(
        result.recordset.map((r: any) => ({
          id: r.id,
          kpiId: r.kpi_id,
          kpiName: r.kpi_name,
          kpiCode: r.kpi_code,
          category: r.category,
          unit: r.unit,
          period: r.period,
          targetValue: parseFloat(r.target_value),
          updatedBy: r.updated_by,
          updatedAt: r.updated_at,
        }))
      );
    }

    if (type === "performance") {
      const period = req.nextUrl.searchParams.get("period");
      let q = `
        SELECT p.id, p.kpi_id, m.name AS kpi_name, m.code AS kpi_code,
               m.category, m.unit, p.period, p.actual_value,
               t.target_value, p.updated_by, p.updated_at
        FROM kpi_performance p
        JOIN kpi_masters m ON p.kpi_id = m.id
        LEFT JOIN kpi_targets t ON t.kpi_id = p.kpi_id AND t.period = p.period
      `;
      if (period) q += ` WHERE p.period = @period`;
      q += ` ORDER BY m.code;`;
      const r = pool.request();
      if (period) r.input("period", sql.NVarChar(50), period);
      const result = await r.query(q);
      return NextResponse.json(
        result.recordset.map((r: any) => {
          const actual = parseFloat(r.actual_value);
          const target = r.target_value ? parseFloat(r.target_value) : null;
          return {
            id: r.id,
            kpiId: r.kpi_id,
            kpiName: r.kpi_name,
            kpiCode: r.kpi_code,
            category: r.category,
            unit: r.unit,
            period: r.period,
            actualValue: actual,
            targetValue: target,
            achievementPercent: target ? Math.round((actual / target) * 100) : null,
            updatedBy: r.updated_by,
            updatedAt: r.updated_at,
          };
        })
      );
    }

    if (type === "change-log") {
      const result = await pool.request().query(`
        SELECT c.id, c.kpi_id, m.name AS kpi_name, c.field,
               c.old_value, c.new_value, c.changed_by, c.changed_at
        FROM kpi_change_log c JOIN kpi_masters m ON c.kpi_id = m.id
        ORDER BY c.changed_at DESC;
      `);
      return NextResponse.json(
        result.recordset.map((r: any) => ({
          id: r.id,
          kpiId: r.kpi_id,
          kpiName: r.kpi_name,
          field: r.field,
          oldValue: r.old_value,
          newValue: r.new_value,
          changedBy: r.changed_by,
          changedAt: r.changed_at,
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
    const pool = await getPool();
    const body = await req.json();
    const { action } = body;

    if (action === "save-master") {
      const { items } = body as { items: any[] };
      for (const item of items) {
        const r = pool.request();
        r.input("id", sql.NVarChar(36), item.id);
        r.input("code", sql.NVarChar(50), item.code);
        r.input("name", sql.NVarChar(255), item.name);
        r.input("category", sql.NVarChar(50), item.category);
        r.input("unit", sql.NVarChar(50), item.unit);
        r.input("desc", sql.NVarChar(sql.MAX), item.description ?? null);
        r.input("report", sql.Bit, item.reportIncluded ? 1 : 0);
        await r.query(`
          MERGE kpi_masters AS target
          USING (SELECT @id AS id) AS source ON target.id = source.id
          WHEN MATCHED THEN UPDATE SET
            code = @code, name = @name, category = @category,
            unit = @unit, description = @desc, report_included = @report,
            updated_at = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (id, code, name, category, unit, description, report_included)
            VALUES (@id, @code, @name, @category, @unit, @desc, @report);
        `);
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "save-targets") {
      const { items } = body as { items: any[] };
      for (const item of items) {
        const r = pool.request();
        r.input("id", sql.NVarChar(36), item.id);
        r.input("kpi_id", sql.NVarChar(36), item.kpiId);
        r.input("period", sql.NVarChar(50), item.period);
        r.input("target", sql.Decimal(18, 6), item.targetValue);
        r.input("by", sql.NVarChar(255), item.updatedBy ?? null);
        await r.query(`
          MERGE kpi_targets AS target
          USING (SELECT @id AS id) AS source ON target.id = source.id
          WHEN MATCHED THEN UPDATE SET
            target_value = @target, updated_by = @by, updated_at = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (id, kpi_id, period, target_value, updated_by)
            VALUES (@id, @kpi_id, @period, @target, @by);
        `);
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "save-performance") {
      const { items } = body as { items: any[] };
      for (const item of items) {
        const r = pool.request();
        r.input("id", sql.NVarChar(36), item.id);
        r.input("kpi_id", sql.NVarChar(36), item.kpiId);
        r.input("period", sql.NVarChar(50), item.period);
        r.input("actual", sql.Decimal(18, 6), item.actualValue);
        r.input("by", sql.NVarChar(255), item.updatedBy ?? null);
        await r.query(`
          MERGE kpi_performance AS target
          USING (SELECT @id AS id) AS source ON target.id = source.id
          WHEN MATCHED THEN UPDATE SET
            actual_value = @actual, updated_by = @by, updated_at = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (id, kpi_id, period, actual_value, updated_by)
            VALUES (@id, @kpi_id, @period, @actual, @by);
        `);
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "delete-master") {
      const { id } = body;
      const r = pool.request();
      r.input("id", sql.NVarChar(36), id);
      await r.query(`DELETE FROM kpi_masters WHERE id = @id;`);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[POST /api/kpi]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
