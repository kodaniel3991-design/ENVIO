import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

// GET /api/employees?worksiteId=xxx  (worksiteId 생략 시 전체)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const worksiteId = searchParams.get("worksiteId");

    const pool = await getPool();
    const request = pool.request();

    let query = `
      SELECT id, worksite_id, department, name, employee_id,
             commute_transport, fuel, address, address_detail,
             commute_distance_km, sort_order, created_at, updated_at
      FROM employees
    `;
    if (worksiteId) {
      request.input("ws_id", sql.NVarChar(50), worksiteId);
      query += ` WHERE worksite_id = @ws_id`;
    }
    query += ` ORDER BY sort_order, created_at`;

    const result = await request.query(query);
    const employees = result.recordset.map((r: any) => ({
      id: r.id,
      worksiteId: r.worksite_id ?? undefined,
      department: r.department ?? undefined,
      name: r.name,
      employeeId: r.employee_id ?? undefined,
      commuteTransport: r.commute_transport ?? undefined,
      fuel: r.fuel ?? undefined,
      address: r.address ?? undefined,
      addressDetail: r.address_detail ?? undefined,
      commuteDistanceKm: r.commute_distance_km != null ? Number(r.commute_distance_km) : undefined,
      createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString("ko-KR") : undefined,
      updatedAt: r.updated_at ? new Date(r.updated_at).toLocaleDateString("ko-KR") : undefined,
    }));

    return NextResponse.json(employees);
  } catch (err: any) {
    console.error("[GET /api/employees]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/employees  — 전체 직원 삭제
export async function DELETE() {
  try {
    const pool = await getPool();
    await pool.request().query(`DELETE FROM employees`);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[DELETE /api/employees]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/employees  — 사업장별 직원 목록 일괄 저장
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { worksiteId, employees } = body as {
      worksiteId: string | null;
      employees: {
        id: string;
        worksiteId?: string;
        department?: string;
        name: string;
        employeeId?: string;
        commuteTransport?: string;
        fuel?: string;
        address?: string;
        addressDetail?: string;
        commuteDistanceKm?: number;
      }[];
    };

    const pool = await getPool();

    // 기존 해당 사업장 직원 ID 목록
    const existReq = pool.request();
    if (worksiteId) {
      existReq.input("ws_id", sql.NVarChar(50), worksiteId);
      const existResult = await existReq.query(
        `SELECT id FROM employees WHERE worksite_id = @ws_id`
      );
      const existingIds = new Set<string>(existResult.recordset.map((r: any) => r.id));
      const incomingIds = new Set<string>(employees.map((e) => e.id));

      // 삭제
      for (const eid of Array.from(existingIds)) {
        if (!incomingIds.has(eid)) {
          const d = pool.request();
          d.input("eid", sql.NVarChar(50), eid);
          await d.query(`DELETE FROM employees WHERE id = @eid`);
        }
      }
    }

    // upsert (사원번호 또는 이름 기준으로 기존 id 재사용 → 중복 방지)
    for (let i = 0; i < employees.length; i++) {
      const e = employees[i];

      // 자연키로 기존 레코드 조회 (지정 사업장 → NULL 사업장 순으로 fallback)
      let resolvedId = e.id;
      const lookupReq = pool.request();
      lookupReq.input("ws_id2", sql.NVarChar(50), worksiteId ?? null);
      if (e.employeeId) {
        lookupReq.input("emp_id2", sql.NVarChar(50), e.employeeId);
        // 1) 지정 사업장에서 조회
        const found = await lookupReq.query(
          worksiteId
            ? `SELECT id FROM employees WHERE worksite_id = @ws_id2 AND employee_id = @emp_id2`
            : `SELECT id FROM employees WHERE worksite_id IS NULL AND employee_id = @emp_id2`
        );
        if (found.recordset.length > 0) {
          resolvedId = found.recordset[0].id;
        } else if (worksiteId) {
          // 2) NULL 사업장에 동일 사원번호 있으면 해당 레코드 재사용 (중복 방지)
          const nullReq = pool.request();
          nullReq.input("emp_id3", sql.NVarChar(50), e.employeeId);
          const nullFound = await nullReq.query(
            `SELECT id FROM employees WHERE worksite_id IS NULL AND employee_id = @emp_id3`
          );
          if (nullFound.recordset.length > 0) resolvedId = nullFound.recordset[0].id;
        }
      } else {
        lookupReq.input("name2", sql.NVarChar(100), e.name);
        // 1) 지정 사업장에서 조회
        const found = await lookupReq.query(
          worksiteId
            ? `SELECT id FROM employees WHERE worksite_id = @ws_id2 AND name = @name2`
            : `SELECT id FROM employees WHERE worksite_id IS NULL AND name = @name2`
        );
        if (found.recordset.length > 0) {
          resolvedId = found.recordset[0].id;
        } else if (worksiteId) {
          // 2) NULL 사업장에 동일 이름 있으면 해당 레코드 재사용 (중복 방지)
          const nullReq = pool.request();
          nullReq.input("name3", sql.NVarChar(100), e.name);
          const nullFound = await nullReq.query(
            `SELECT id FROM employees WHERE worksite_id IS NULL AND name = @name3`
          );
          if (nullFound.recordset.length > 0) resolvedId = nullFound.recordset[0].id;
        }
      }

      const r = pool.request();
      r.input("id",         sql.NVarChar(50),   resolvedId);
      r.input("ws_id",      sql.NVarChar(50),   worksiteId ?? null);
      r.input("dept",       sql.NVarChar(100),  e.department ?? null);
      r.input("name",       sql.NVarChar(100),  e.name);
      r.input("emp_id",     sql.NVarChar(50),   e.employeeId ?? null);
      r.input("transport",  sql.NVarChar(50),   e.commuteTransport ?? null);
      r.input("fuel",       sql.NVarChar(50),   e.fuel ?? null);
      r.input("address",    sql.NVarChar(500),  e.address ?? null);
      r.input("addr_d",     sql.NVarChar(200),  e.addressDetail ?? null);
      r.input("dist_km",    sql.Decimal(10, 3), e.commuteDistanceKm ?? null);
      r.input("sort",       sql.Int,            i);

      await r.query(`
        MERGE employees AS target
        USING (SELECT @id AS id) AS source ON target.id = source.id
        WHEN MATCHED THEN
          UPDATE SET
            worksite_id = @ws_id, department = @dept, name = @name,
            employee_id = @emp_id,
            commute_transport = @transport, fuel = @fuel,
            address = @address, address_detail = @addr_d,
            commute_distance_km = @dist_km, sort_order = @sort,
            updated_at = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (id, worksite_id, department, name, employee_id,
                  commute_transport, fuel, address, address_detail,
                  commute_distance_km, sort_order)
          VALUES (@id, @ws_id, @dept, @name, @emp_id,
                  @transport, @fuel, @address, @addr_d, @dist_km, @sort);
      `);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[POST /api/employees]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
