import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

// GET /api/facilities?scope=1&category=fixed
export async function GET(req: NextRequest) {
  const scope = req.nextUrl.searchParams.get("scope");
  const category = req.nextUrl.searchParams.get("category");
  try {
    const pool = await getPool();
    const request = pool.request();
    let query = "SELECT * FROM emission_facilities";
    if (scope) {
      request.input("scope", sql.Int, parseInt(scope));
      query += " WHERE scope = @scope";
      if (category) {
        request.input("category", sql.NVarChar(50), category);
        query += " AND category_id = @category";
      }
      query += " ORDER BY sort_order, created_at";
    } else {
      query += " ORDER BY scope, sort_order, created_at";
    }
    const result = await request.query(query);
    return NextResponse.json(result.recordset);
  } catch (err: any) {
    console.error("[GET /api/facilities]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/facilities — 전체 목록을 통째로 저장 (upsert)
export async function POST(req: NextRequest) {
  try {
    const body: {
      scope: number;
      categoryId?: string;
      rows: Array<{
        id: string;
        facilityName: string;
        fuelType?: string;
        energyType?: string;
        activityType?: string;
        unit: string;
        dataMethod: string;
        sortOrder?: number;
        categoryId?: string;
      }>;
    } = await req.json();

    const pool = await getPool();
    const categoryId = body.categoryId ?? "fixed";
    const newIds = body.rows.map((r) => r.id);

    // 새 목록에 없는 시설만 삭제 (CASCADE로 activity_data/attachments도 삭제)
    // 기존 시설은 삭제하지 않아 첨부파일·활동량 데이터가 보존됨
    if (newIds.length > 0) {
      const idList = newIds.map((_, i) => `@delId${i}`).join(", ");
      const delReq = pool.request();
      delReq.input("scope", sql.Int, body.scope);
      delReq.input("category_id", sql.NVarChar(50), categoryId);
      newIds.forEach((id, i) => delReq.input(`delId${i}`, sql.NVarChar(50), id));
      await delReq.query(
        `DELETE FROM emission_facilities WHERE scope = @scope AND category_id = @category_id AND id NOT IN (${idList})`
      );
    } else {
      // 빈 목록 저장 시 전체 삭제
      const delReq = pool.request();
      delReq.input("scope", sql.Int, body.scope);
      delReq.input("category_id", sql.NVarChar(50), categoryId);
      await delReq.query("DELETE FROM emission_facilities WHERE scope = @scope AND category_id = @category_id");
    }

    // 각 시설을 UPSERT (존재하면 UPDATE, 없으면 INSERT)
    for (let i = 0; i < body.rows.length; i++) {
      const row = body.rows[i];
      const req2 = pool.request();
      req2.input("id", sql.NVarChar(50), row.id);
      req2.input("scope", sql.Int, body.scope);
      req2.input("category_id", sql.NVarChar(50), row.categoryId ?? categoryId);
      req2.input("facility_name", sql.NVarChar(200), row.facilityName);
      req2.input("fuel_type", sql.NVarChar(100), row.fuelType ?? null);
      req2.input("energy_type", sql.NVarChar(100), row.energyType ?? null);
      req2.input("activity_type", sql.NVarChar(200), row.activityType ?? null);
      req2.input("unit", sql.NVarChar(50), row.unit);
      req2.input("data_method", sql.NVarChar(100), row.dataMethod);
      req2.input("sort_order", sql.Int, row.sortOrder ?? i);
      await req2.query(`
        IF EXISTS (SELECT 1 FROM emission_facilities WHERE id = @id)
          UPDATE emission_facilities SET
            scope         = @scope,
            category_id   = @category_id,
            facility_name = @facility_name,
            fuel_type     = @fuel_type,
            energy_type   = @energy_type,
            activity_type = @activity_type,
            unit          = @unit,
            data_method   = @data_method,
            sort_order    = @sort_order,
            updated_at    = GETDATE()
          WHERE id = @id
        ELSE
          INSERT INTO emission_facilities
            (id, scope, category_id, facility_name, fuel_type, energy_type, activity_type, unit, data_method, sort_order)
          VALUES
            (@id, @scope, @category_id, @facility_name, @fuel_type, @energy_type, @activity_type, @unit, @data_method, @sort_order)
      `);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[POST /api/facilities]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
