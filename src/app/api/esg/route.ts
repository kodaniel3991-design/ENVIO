import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

// GET /api/esg?domain=environment|social|governance
export async function GET(req: NextRequest) {
  try {
    const pool = await getPool();
    const domain = req.nextUrl.searchParams.get("domain") ?? "environment";
    const period = req.nextUrl.searchParams.get("period");

    const r = pool.request();
    r.input("domain", sql.NVarChar(50), domain);

    let where = "WHERE esg_domain = @domain";
    if (period) {
      r.input("period", sql.NVarChar(50), period);
      where += " AND period = @period";
    }

    const result = await r.query(`
      SELECT id, esg_domain, category, indicator_name, value, unit, period, source, status
      FROM esg_metrics ${where}
      ORDER BY category, indicator_name;
    `);

    return NextResponse.json(
      result.recordset.map((row: any) => ({
        id: row.id,
        esgDomain: row.esg_domain,
        category: row.category,
        indicatorName: row.indicator_name,
        value: row.value != null ? parseFloat(row.value) : null,
        unit: row.unit,
        period: row.period,
        source: row.source,
        status: row.status,
      }))
    );
  } catch (err: any) {
    console.error("[GET /api/esg]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/esg — save metrics
export async function POST(req: NextRequest) {
  try {
    const pool = await getPool();
    const body = await req.json();
    const { items } = body as { items: any[] };

    for (const item of items) {
      const r = pool.request();
      r.input("id", sql.NVarChar(36), item.id);
      r.input("domain", sql.NVarChar(50), item.esgDomain);
      r.input("category", sql.NVarChar(100), item.category);
      r.input("name", sql.NVarChar(255), item.indicatorName);
      r.input("value", sql.Decimal(18, 6), item.value ?? null);
      r.input("unit", sql.NVarChar(50), item.unit);
      r.input("period", sql.NVarChar(50), item.period);
      r.input("source", sql.NVarChar(255), item.source ?? null);
      r.input("status", sql.NVarChar(50), item.status ?? "pending");

      await r.query(`
        MERGE esg_metrics AS target
        USING (SELECT @id AS id) AS source_t ON target.id = source_t.id
        WHEN MATCHED THEN UPDATE SET
          category = @category, indicator_name = @name,
          value = @value, unit = @unit, period = @period,
          source = @source, status = @status, updated_at = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (id, esg_domain, category, indicator_name, value, unit, period, source, status)
          VALUES (@id, @domain, @category, @name, @value, @unit, @period, @source, @status);
      `);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[POST /api/esg]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
