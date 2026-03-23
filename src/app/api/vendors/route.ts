import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

// GET /api/vendors?type=list|submissions|esg-scores
export async function GET(req: NextRequest) {
  try {
    const pool = await getPool();
    const type = req.nextUrl.searchParams.get("type") ?? "list";

    if (type === "list") {
      const result = await pool.request().query(`
        SELECT id, name, email, status, tier, category, risk_level, esg_score,
               invited_at, linked_at, created_at
        FROM vendors ORDER BY name;
      `);
      return NextResponse.json(
        result.recordset.map((r: any) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          status: r.status,
          tier: r.tier,
          category: r.category,
          riskLevel: r.risk_level,
          esgScore: r.esg_score != null ? parseFloat(r.esg_score) : null,
          invitedAt: r.invited_at,
          linkedAt: r.linked_at,
        }))
      );
    }

    if (type === "submissions") {
      const result = await pool.request().query(`
        SELECT s.id, s.vendor_id, v.name AS vendor_name, s.period, s.status,
               s.scope3_categories_completed, s.scope3_categories_total,
               s.emissions_tco2e, s.submitted_at
        FROM vendor_submissions s JOIN vendors v ON s.vendor_id = v.id
        ORDER BY v.name, s.period;
      `);
      return NextResponse.json(
        result.recordset.map((r: any) => ({
          id: r.id,
          vendorId: r.vendor_id,
          vendorName: r.vendor_name,
          period: r.period,
          status: r.status,
          scope3CategoriesCompleted: r.scope3_categories_completed,
          scope3CategoriesTotal: r.scope3_categories_total,
          emissionsTco2e: r.emissions_tco2e != null ? parseFloat(r.emissions_tco2e) : null,
          submittedAt: r.submitted_at,
        }))
      );
    }

    if (type === "esg-scores") {
      const result = await pool.request().query(`
        SELECT s.id, s.vendor_id, v.name AS vendor_name,
               s.overall_score, s.environment_score, s.social_score,
               s.governance_score, s.risk_level, s.trend
        FROM vendor_esg_scores s JOIN vendors v ON s.vendor_id = v.id
        ORDER BY v.name;
      `);
      return NextResponse.json(
        result.recordset.map((r: any) => ({
          id: r.id,
          vendorId: r.vendor_id,
          vendorName: r.vendor_name,
          overallScore: r.overall_score != null ? parseFloat(r.overall_score) : null,
          environmentScore: r.environment_score != null ? parseFloat(r.environment_score) : null,
          socialScore: r.social_score != null ? parseFloat(r.social_score) : null,
          governanceScore: r.governance_score != null ? parseFloat(r.governance_score) : null,
          riskLevel: r.risk_level,
          trend: r.trend,
        }))
      );
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: any) {
    console.error("[GET /api/vendors]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/vendors — CRUD
export async function POST(req: NextRequest) {
  try {
    const pool = await getPool();
    const body = await req.json();
    const { action } = body;

    if (action === "save") {
      const { items } = body as { items: any[] };
      for (const item of items) {
        const r = pool.request();
        r.input("id", sql.NVarChar(36), item.id);
        r.input("name", sql.NVarChar(255), item.name);
        r.input("email", sql.NVarChar(255), item.email ?? null);
        r.input("status", sql.NVarChar(50), item.status ?? "invited");
        r.input("tier", sql.Int, item.tier ?? null);
        r.input("category", sql.NVarChar(255), item.category ?? null);
        r.input("risk_level", sql.NVarChar(50), item.riskLevel ?? null);

        await r.query(`
          MERGE vendors AS target
          USING (SELECT @id AS id) AS source ON target.id = source.id
          WHEN MATCHED THEN UPDATE SET
            name = @name, email = @email, status = @status,
            tier = @tier, category = @category, risk_level = @risk_level,
            updated_at = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (id, name, email, status, tier, category, risk_level, invited_at)
            VALUES (@id, @name, @email, @status, @tier, @category, @risk_level, GETDATE());
        `);
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      const { id } = body;
      const r = pool.request();
      r.input("id", sql.NVarChar(36), id);
      await r.query(`DELETE FROM vendors WHERE id = @id;`);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[POST /api/vendors]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
