import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

// GET /api/dashboard?type=summary|scope-breakdown|trends
// 대시보드는 여러 테이블 조합 → 실시간 집계
export async function GET(req: NextRequest) {
  try {
    const pool = await getPool();
    const type = req.nextUrl.searchParams.get("type") ?? "summary";
    const year = parseInt(req.nextUrl.searchParams.get("year") ?? String(new Date().getFullYear()));

    if (type === "summary") {
      // 배출량 KPI 카드
      const r = pool.request();
      r.input("year", sql.Int, year);
      r.input("prev_year", sql.Int, year - 1);

      const emResult = await r.query(`
        SELECT
          ef.scope,
          SUM(
            ad.activity_value *
            COALESCE(
              (SELECT TOP 1 em.co2_factor FROM emission_factor_master em
               WHERE em.fuel_type = ef.fuel_type AND em.energy_type = ef.energy_type),
              0
            )
          ) AS total
        FROM activity_data ad
        JOIN emission_facilities ef ON ad.facility_id = ef.id
        WHERE ad.year = @year
        GROUP BY ef.scope;
      `);

      const scopeMap: Record<number, number> = {};
      for (const row of emResult.recordset) {
        scopeMap[row.scope] = parseFloat(row.total) || 0;
      }

      // KPI 달성률
      const kpiResult = await pool.request().query(`
        SELECT COUNT(*) AS total,
               SUM(CASE WHEN p.actual_value IS NOT NULL THEN 1 ELSE 0 END) AS entered
        FROM kpi_masters m
        LEFT JOIN kpi_performance p ON p.kpi_id = m.id;
      `);

      // ESG 데이터 입력율
      const esgResult = await pool.request().query(`
        SELECT COUNT(*) AS total,
               SUM(CASE WHEN value IS NOT NULL THEN 1 ELSE 0 END) AS filled
        FROM esg_metrics;
      `);

      // 협력사 현황
      const vendorResult = await pool.request().query(`
        SELECT COUNT(*) AS total,
               SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_count
        FROM vendors;
      `);

      const scope1 = scopeMap[1] ?? 0;
      const scope2 = scopeMap[2] ?? 0;
      const scope3 = scopeMap[3] ?? 0;

      return NextResponse.json({
        emissions: {
          totalMtCO2e: scope1 + scope2 + scope3,
          scope1,
          scope2,
          scope3,
        },
        kpi: {
          total: kpiResult.recordset[0]?.total ?? 0,
          entered: kpiResult.recordset[0]?.entered ?? 0,
        },
        esg: {
          total: esgResult.recordset[0]?.total ?? 0,
          filled: esgResult.recordset[0]?.filled ?? 0,
        },
        vendors: {
          total: vendorResult.recordset[0]?.total ?? 0,
          active: vendorResult.recordset[0]?.active_count ?? 0,
        },
      });
    }

    if (type === "scope-breakdown") {
      const r = pool.request();
      r.input("year", sql.Int, year);
      const result = await r.query(`
        SELECT ef.scope,
               SUM(
                 ad.activity_value *
                 COALESCE(
                   (SELECT TOP 1 em.co2_factor FROM emission_factor_master em
                    WHERE em.fuel_type = ef.fuel_type AND em.energy_type = ef.energy_type),
                   0
                 )
               ) AS total
        FROM activity_data ad
        JOIN emission_facilities ef ON ad.facility_id = ef.id
        WHERE ad.year = @year
        GROUP BY ef.scope;
      `);
      return NextResponse.json(
        result.recordset.map((r: any) => ({
          scope: `Scope ${r.scope}`,
          value: parseFloat(r.total) || 0,
        }))
      );
    }

    if (type === "trends") {
      const r = pool.request();
      r.input("year", sql.Int, year);
      const result = await r.query(`
        SELECT ad.month,
               SUM(
                 ad.activity_value *
                 COALESCE(
                   (SELECT TOP 1 em.co2_factor FROM emission_factor_master em
                    WHERE em.fuel_type = ef.fuel_type AND em.energy_type = ef.energy_type),
                   0
                 )
               ) AS total
        FROM activity_data ad
        JOIN emission_facilities ef ON ad.facility_id = ef.id
        WHERE ad.year = @year
        GROUP BY ad.month
        ORDER BY ad.month;
      `);

      const months = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        value: 0,
      }));
      for (const row of result.recordset) {
        months[row.month - 1].value = parseFloat(row.total) || 0;
      }
      return NextResponse.json(months);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: any) {
    console.error("[GET /api/dashboard]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
