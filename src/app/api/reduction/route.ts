import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

// GET /api/reduction?type=projects|summary
export async function GET(req: NextRequest) {
  try {
    const pool = await getPool();
    const type = req.nextUrl.searchParams.get("type") ?? "projects";

    if (type === "projects") {
      const result = await pool.request().query(`
        SELECT id, name, category, scope, owner, status,
               expected_reduction_mt, actual_reduction_mt,
               estimated_cost_m, start_date, end_date
        FROM reduction_projects ORDER BY created_at DESC;
      `);
      return NextResponse.json(
        result.recordset.map((r: any) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          scope: r.scope,
          owner: r.owner,
          status: r.status,
          expectedReductionMt: r.expected_reduction_mt != null ? parseFloat(r.expected_reduction_mt) : null,
          actualReductionMt: r.actual_reduction_mt != null ? parseFloat(r.actual_reduction_mt) : null,
          estimatedCostM: r.estimated_cost_m != null ? parseFloat(r.estimated_cost_m) : null,
          startDate: r.start_date,
          endDate: r.end_date,
        }))
      );
    }

    if (type === "summary") {
      const result = await pool.request().query(`
        SELECT
          COUNT(*) AS total_projects,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
          SUM(COALESCE(expected_reduction_mt, 0)) AS total_expected,
          SUM(COALESCE(actual_reduction_mt, 0)) AS total_actual
        FROM reduction_projects;
      `);
      const row = result.recordset[0];
      return NextResponse.json({
        totalProjects: row?.total_projects ?? 0,
        completed: row?.completed ?? 0,
        inProgress: row?.in_progress ?? 0,
        totalExpectedReductionMt: parseFloat(row?.total_expected) || 0,
        totalActualReductionMt: parseFloat(row?.total_actual) || 0,
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: any) {
    console.error("[GET /api/reduction]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/reduction — CRUD
export async function POST(req: NextRequest) {
  try {
    const pool = await getPool();
    const body = await req.json();
    const { action, item } = body;

    if (action === "save") {
      const r = pool.request();
      r.input("id", sql.NVarChar(36), item.id);
      r.input("name", sql.NVarChar(255), item.name);
      r.input("category", sql.NVarChar(50), item.category);
      r.input("scope", sql.NVarChar(50), item.scope);
      r.input("owner", sql.NVarChar(255), item.owner ?? null);
      r.input("status", sql.NVarChar(50), item.status ?? "planning");
      r.input("expected", sql.Decimal(18, 6), item.expectedReductionMt ?? null);
      r.input("actual", sql.Decimal(18, 6), item.actualReductionMt ?? null);
      r.input("cost", sql.Decimal(18, 6), item.estimatedCostM ?? null);
      r.input("start", sql.Date, item.startDate ?? null);
      r.input("end", sql.Date, item.endDate ?? null);

      await r.query(`
        MERGE reduction_projects AS target
        USING (SELECT @id AS id) AS source ON target.id = source.id
        WHEN MATCHED THEN UPDATE SET
          name = @name, category = @category, scope = @scope, owner = @owner,
          status = @status, expected_reduction_mt = @expected,
          actual_reduction_mt = @actual, estimated_cost_m = @cost,
          start_date = @start, end_date = @end, updated_at = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (id, name, category, scope, owner, status, expected_reduction_mt,
                  actual_reduction_mt, estimated_cost_m, start_date, end_date)
          VALUES (@id, @name, @category, @scope, @owner, @status, @expected,
                  @actual, @cost, @start, @end);
      `);
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      const { id } = body;
      const r = pool.request();
      r.input("id", sql.NVarChar(36), id);
      await r.query(`DELETE FROM reduction_projects WHERE id = @id;`);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[POST /api/reduction]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
