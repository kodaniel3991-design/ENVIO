import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

// GET /api/materiality?type=issues|matrix
export async function GET(req: NextRequest) {
  try {
    const pool = await getPool();
    const type = req.nextUrl.searchParams.get("type") ?? "issues";

    if (type === "issues") {
      const result = await pool.request().query(`
        SELECT id, code, name, dimension, description,
               expert_score, benchmark_score, kpi_linked_count,
               kpi_connection_status, impact_score, stakeholder_score
        FROM materiality_issues ORDER BY code;
      `);
      return NextResponse.json(
        result.recordset.map((r: any) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          dimension: r.dimension,
          description: r.description,
          expertScore: parseFloat(r.expert_score),
          benchmarkScore: parseFloat(r.benchmark_score),
          kpiLinkedCount: r.kpi_linked_count,
          kpiConnectionStatus: r.kpi_connection_status,
          impactScore: r.impact_score != null ? parseFloat(r.impact_score) : null,
          stakeholderScore: r.stakeholder_score != null ? parseFloat(r.stakeholder_score) : null,
        }))
      );
    }

    if (type === "matrix") {
      const result = await pool.request().query(`
        SELECT id, name, impact_score, stakeholder_score
        FROM materiality_issues
        WHERE impact_score IS NOT NULL AND stakeholder_score IS NOT NULL;
      `);
      return NextResponse.json(
        result.recordset.map((r: any) => ({
          issueId: r.id,
          issueName: r.name,
          x: parseFloat(r.impact_score),
          y: parseFloat(r.stakeholder_score),
        }))
      );
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: any) {
    console.error("[GET /api/materiality]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/materiality — save issues
export async function POST(req: NextRequest) {
  try {
    const pool = await getPool();
    const body = await req.json();
    const { items } = body as { items: any[] };

    for (const item of items) {
      const r = pool.request();
      r.input("id", sql.NVarChar(36), item.id);
      r.input("code", sql.NVarChar(50), item.code);
      r.input("name", sql.NVarChar(255), item.name);
      r.input("dim", sql.NVarChar(50), item.dimension);
      r.input("desc", sql.NVarChar(sql.MAX), item.description ?? null);
      r.input("expert", sql.Decimal(3, 2), item.expertScore);
      r.input("bench", sql.Decimal(3, 2), item.benchmarkScore);
      r.input("kpi_count", sql.Int, item.kpiLinkedCount ?? 0);
      r.input("impact", sql.Decimal(4, 2), item.impactScore ?? null);
      r.input("stakeholder", sql.Decimal(4, 2), item.stakeholderScore ?? null);

      await r.query(`
        MERGE materiality_issues AS target
        USING (SELECT @id AS id) AS source ON target.id = source.id
        WHEN MATCHED THEN UPDATE SET
          code = @code, name = @name, dimension = @dim, description = @desc,
          expert_score = @expert, benchmark_score = @bench,
          kpi_linked_count = @kpi_count, impact_score = @impact,
          stakeholder_score = @stakeholder, updated_at = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (id, code, name, dimension, description, expert_score, benchmark_score,
                  kpi_linked_count, impact_score, stakeholder_score)
          VALUES (@id, @code, @name, @dim, @desc, @expert, @bench,
                  @kpi_count, @impact, @stakeholder);
      `);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[POST /api/materiality]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
