import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

// GET /api/users?type=users|roles
export async function GET(req: NextRequest) {
  try {
    const pool = await getPool();
    const type = req.nextUrl.searchParams.get("type") ?? "users";

    if (type === "users") {
      const result = await pool.request().query(`
        SELECT u.id, u.name, u.email, u.department, u.job_title,
               u.role_id, r.name AS role_name, u.status, u.last_login_at
        FROM users u LEFT JOIN roles r ON u.role_id = r.id
        ORDER BY u.name;
      `);
      return NextResponse.json(
        result.recordset.map((r: any) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          department: r.department,
          jobTitle: r.job_title,
          roleId: r.role_id,
          roleName: r.role_name,
          status: r.status,
          lastLoginAt: r.last_login_at,
        }))
      );
    }

    if (type === "roles") {
      const result = await pool.request().query(`
        SELECT id, name, description, system_code FROM roles ORDER BY name;
      `);
      return NextResponse.json(
        result.recordset.map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          systemCode: r.system_code,
        }))
      );
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: any) {
    console.error("[GET /api/users]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/users — CRUD
export async function POST(req: NextRequest) {
  try {
    const pool = await getPool();
    const body = await req.json();
    const { action } = body;

    if (action === "save-user") {
      const { item } = body;
      const r = pool.request();
      r.input("id", sql.NVarChar(36), item.id);
      r.input("name", sql.NVarChar(255), item.name);
      r.input("email", sql.NVarChar(255), item.email);
      r.input("dept", sql.NVarChar(255), item.department ?? null);
      r.input("title", sql.NVarChar(255), item.jobTitle ?? null);
      r.input("role_id", sql.NVarChar(36), item.roleId ?? null);
      r.input("status", sql.NVarChar(50), item.status ?? "active");

      await r.query(`
        MERGE users AS target
        USING (SELECT @id AS id) AS source ON target.id = source.id
        WHEN MATCHED THEN UPDATE SET
          name = @name, email = @email, department = @dept,
          job_title = @title, role_id = @role_id, status = @status,
          updated_at = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (id, name, email, department, job_title, role_id, status)
          VALUES (@id, @name, @email, @dept, @title, @role_id, @status);
      `);
      return NextResponse.json({ ok: true });
    }

    if (action === "save-role") {
      const { item } = body;
      const r = pool.request();
      r.input("id", sql.NVarChar(36), item.id);
      r.input("name", sql.NVarChar(255), item.name);
      r.input("desc", sql.NVarChar(sql.MAX), item.description ?? null);
      r.input("code", sql.NVarChar(100), item.systemCode ?? null);

      await r.query(`
        MERGE roles AS target
        USING (SELECT @id AS id) AS source ON target.id = source.id
        WHEN MATCHED THEN UPDATE SET
          name = @name, description = @desc, system_code = @code, updated_at = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (id, name, description, system_code) VALUES (@id, @name, @desc, @code);
      `);
      return NextResponse.json({ ok: true });
    }

    if (action === "delete-user") {
      const r = pool.request();
      r.input("id", sql.NVarChar(36), body.id);
      await r.query(`DELETE FROM users WHERE id = @id;`);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[POST /api/users]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
