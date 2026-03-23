import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

// GET /api/reports?type=list|compliance|mappings
export async function GET(req: NextRequest) {
  try {
    const pool = await getPool();
    const type = req.nextUrl.searchParams.get("type") ?? "list";

    if (type === "list") {
      const result = await pool.request().query(`
        SELECT id, title, type, period, status, framework, version, published_at, created_at
        FROM esg_reports ORDER BY created_at DESC;
      `);
      return NextResponse.json(
        result.recordset.map((r: any) => ({
          id: r.id,
          title: r.title,
          type: r.type,
          period: r.period,
          status: r.status,
          framework: r.framework,
          version: r.version,
          publishedAt: r.published_at,
          createdAt: r.created_at,
        }))
      );
    }

    if (type === "compliance") {
      const result = await pool.request().query(`
        SELECT id, framework, requirement, status, due_date, last_checked
        FROM compliance_items ORDER BY framework, requirement;
      `);
      return NextResponse.json(
        result.recordset.map((r: any) => ({
          id: r.id,
          framework: r.framework,
          requirement: r.requirement,
          status: r.status,
          dueDate: r.due_date,
          lastChecked: r.last_checked,
        }))
      );
    }

    if (type === "mappings") {
      const result = await pool.request().query(`
        SELECT id, kpi_code, kpi_name, kpi_category, framework, disclosure_code, status
        FROM kpi_disclosure_mappings ORDER BY framework, kpi_code;
      `);
      return NextResponse.json(
        result.recordset.map((r: any) => ({
          id: r.id,
          kpiCode: r.kpi_code,
          kpiName: r.kpi_name,
          kpiCategory: r.kpi_category,
          framework: r.framework,
          disclosureCode: r.disclosure_code,
          status: r.status,
        }))
      );
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: any) {
    console.error("[GET /api/reports]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/reports — save report or compliance item
export async function POST(req: NextRequest) {
  try {
    const pool = await getPool();
    const body = await req.json();
    const { action } = body;

    if (action === "save-report") {
      const { item } = body;
      const r = pool.request();
      r.input("id", sql.NVarChar(36), item.id);
      r.input("title", sql.NVarChar(255), item.title);
      r.input("type", sql.NVarChar(50), item.type);
      r.input("period", sql.NVarChar(50), item.period);
      r.input("status", sql.NVarChar(50), item.status ?? "draft");
      r.input("framework", sql.NVarChar(50), item.framework ?? null);
      r.input("version", sql.NVarChar(50), item.version ?? null);

      await r.query(`
        MERGE esg_reports AS target
        USING (SELECT @id AS id) AS source ON target.id = source.id
        WHEN MATCHED THEN UPDATE SET
          title = @title, type = @type, period = @period,
          status = @status, framework = @framework, version = @version,
          updated_at = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (id, title, type, period, status, framework, version)
          VALUES (@id, @title, @type, @period, @status, @framework, @version);
      `);
      return NextResponse.json({ ok: true });
    }

    if (action === "save-compliance") {
      const { items } = body as { items: any[] };
      for (const item of items) {
        const r = pool.request();
        r.input("id", sql.NVarChar(36), item.id);
        r.input("framework", sql.NVarChar(100), item.framework);
        r.input("req", sql.NVarChar(255), item.requirement);
        r.input("status", sql.NVarChar(50), item.status);
        r.input("due", sql.Date, item.dueDate ?? null);

        await r.query(`
          MERGE compliance_items AS target
          USING (SELECT @id AS id) AS source ON target.id = source.id
          WHEN MATCHED THEN UPDATE SET
            framework = @framework, requirement = @req, status = @status,
            due_date = @due, last_checked = GETDATE(), updated_at = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (id, framework, requirement, status, due_date, last_checked)
            VALUES (@id, @framework, @req, @status, @due, GETDATE());
        `);
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[POST /api/reports]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
