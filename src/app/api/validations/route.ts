import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

// GET /api/validations?type=validations|approvals
export async function GET(req: NextRequest) {
  try {
    const pool = await getPool();
    const type = req.nextUrl.searchParams.get("type") ?? "validations";

    if (type === "validations") {
      const result = await pool.request().query(`
        SELECT id, scope, category, emission_source, site, period,
               activity_amount, emissions, status, ai_verification,
               data_source, evidence_count, submitted_by, submitted_at
        FROM data_validations ORDER BY submitted_at DESC;
      `);
      return NextResponse.json(
        result.recordset.map((r: any) => ({
          id: r.id,
          scope: r.scope,
          category: r.category,
          emissionSource: r.emission_source,
          site: r.site,
          period: r.period,
          activityAmount: r.activity_amount,
          emissions: r.emissions,
          status: r.status,
          aiVerification: r.ai_verification,
          dataSource: r.data_source,
          evidenceCount: r.evidence_count,
          submittedBy: r.submitted_by,
          submittedAt: r.submitted_at,
        }))
      );
    }

    if (type === "approvals") {
      const result = await pool.request().query(`
        SELECT a.id, a.validation_id, a.status, a.approver, a.comment, a.approved_at,
               v.scope, v.category, v.emission_source, v.site, v.period
        FROM data_approvals a JOIN data_validations v ON a.validation_id = v.id
        ORDER BY a.created_at DESC;
      `);
      return NextResponse.json(
        result.recordset.map((r: any) => ({
          id: r.id,
          validationId: r.validation_id,
          status: r.status,
          approver: r.approver,
          comment: r.comment,
          approvedAt: r.approved_at,
          scope: r.scope,
          category: r.category,
          emissionSource: r.emission_source,
          site: r.site,
          period: r.period,
        }))
      );
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: any) {
    console.error("[GET /api/validations]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/validations — CRUD
export async function POST(req: NextRequest) {
  try {
    const pool = await getPool();
    const body = await req.json();
    const { action } = body;

    if (action === "save-validation") {
      const { item } = body;
      const r = pool.request();
      r.input("id", sql.NVarChar(36), item.id);
      r.input("scope", sql.NVarChar(50), item.scope);
      r.input("category", sql.NVarChar(255), item.category);
      r.input("source", sql.NVarChar(255), item.emissionSource);
      r.input("site", sql.NVarChar(255), item.site);
      r.input("period", sql.NVarChar(50), item.period);
      r.input("activity", sql.NVarChar(255), item.activityAmount ?? null);
      r.input("emissions", sql.NVarChar(255), item.emissions ?? null);
      r.input("status", sql.NVarChar(50), item.status ?? "submitted");

      await r.query(`
        MERGE data_validations AS target
        USING (SELECT @id AS id) AS s ON target.id = s.id
        WHEN MATCHED THEN UPDATE SET
          status = @status, activity_amount = @activity, emissions = @emissions,
          updated_at = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (id, scope, category, emission_source, site, period,
                  activity_amount, emissions, status, submitted_at)
          VALUES (@id, @scope, @category, @source, @site, @period,
                  @activity, @emissions, @status, GETDATE());
      `);
      return NextResponse.json({ ok: true });
    }

    if (action === "approve") {
      const { id, status, approver, comment } = body;
      const r = pool.request();
      r.input("id", sql.NVarChar(36), id);
      r.input("status", sql.NVarChar(50), status);
      r.input("approver", sql.NVarChar(255), approver ?? null);
      r.input("comment", sql.NVarChar(sql.MAX), comment ?? null);

      await r.query(`
        UPDATE data_approvals SET
          status = @status, approver = @approver, comment = @comment,
          approved_at = GETDATE(), updated_at = GETDATE()
        WHERE id = @id;
      `);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[POST /api/validations]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
