import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

// GET /api/organization — 조직 및 사업장 정보 조회
export async function GET() {
  try {
    const pool = await getPool();

    // 조직 정보
    const orgResult = await pool.request().query(`
      SELECT TOP 1 id, organization_name, address, address_detail FROM organizations ORDER BY id;
    `);
    const org = orgResult.recordset[0];
    if (!org) {
      return NextResponse.json({
        organizationName: "",
        organizationAddress: "",
        organizationAddressDetail: undefined,
        worksites: [],
        defaultWorksiteId: undefined,
      });
    }

    // 사업장 목록
    const wsReq = pool.request();
    wsReq.input("org_id", sql.Int, org.id);
    const wsResult = await wsReq.query(`
      SELECT id, name, address, address_detail, is_default
      FROM worksites
      WHERE organization_id = @org_id
      ORDER BY sort_order, created_at;
    `);

    const worksites = wsResult.recordset.map((w: any) => ({
      id: w.id,
      name: w.name,
      address: w.address,
      addressDetail: w.address_detail ?? undefined,
    }));

    const defaultRow = wsResult.recordset.find((w: any) => w.is_default === true);
    const defaultWorksiteId = defaultRow?.id ?? wsResult.recordset[0]?.id ?? undefined;

    return NextResponse.json({
      organizationName: org.organization_name,
      organizationAddress: org.address ?? "",
      organizationAddressDetail: org.address_detail ?? undefined,
      worksites,
      defaultWorksiteId,
    });
  } catch (err: any) {
    console.error("[GET /api/organization]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/organization — 조직 및 사업장 정보 저장
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { organizationName, organizationAddress, organizationAddressDetail, worksites, defaultWorksiteId } = body as {
      organizationName: string;
      organizationAddress?: string;
      organizationAddressDetail?: string;
      worksites: { id: string; name: string; address: string; addressDetail?: string }[];
      defaultWorksiteId?: string;
    };

    const pool = await getPool();

    // 조직 정보 업데이트 (단일 행 upsert)
    const orgReq = pool.request();
    orgReq.input("org_name",    sql.NVarChar(200), organizationName || "조직");
    orgReq.input("org_addr",    sql.NVarChar(500), organizationAddress || "");
    orgReq.input("org_addr_d",  sql.NVarChar(200), organizationAddressDetail ?? null);
    await orgReq.query(`
      IF EXISTS (SELECT 1 FROM organizations)
        UPDATE organizations
        SET organization_name = @org_name, address = @org_addr, address_detail = @org_addr_d, updated_at = GETDATE()
        WHERE id = (SELECT TOP 1 id FROM organizations ORDER BY id);
      ELSE
        INSERT INTO organizations (organization_name, address, address_detail) VALUES (@org_name, @org_addr, @org_addr_d);
    `);

    // 조직 id 조회
    const orgResult = await pool.request().query(`
      SELECT TOP 1 id FROM organizations ORDER BY id;
    `);
    const orgId: number = orgResult.recordset[0].id;

    // 기존 사업장 ID 목록
    const existingReq = pool.request();
    existingReq.input("org_id", sql.Int, orgId);
    const existingResult = await existingReq.query(`
      SELECT id FROM worksites WHERE organization_id = @org_id;
    `);
    const existingIds: Set<string> = new Set(existingResult.recordset.map((r: any) => r.id));
    const incomingIds: Set<string> = new Set(worksites.map((w) => w.id));

    // 삭제된 사업장 제거
    for (const eid of Array.from(existingIds)) {
      if (!incomingIds.has(eid)) {
        const delReq = pool.request();
        delReq.input("ws_id", sql.NVarChar(50), eid);
        await delReq.query(`DELETE FROM worksites WHERE id = @ws_id;`);
      }
    }

    // 사업장 upsert
    for (let i = 0; i < worksites.length; i++) {
      const w = worksites[i];
      const isDefault = w.id === defaultWorksiteId ? 1 : 0;
      const r = pool.request();
      r.input("ws_id",    sql.NVarChar(50),  w.id);
      r.input("org_id",   sql.Int,           orgId);
      r.input("name",     sql.NVarChar(200), w.name || "사업장");
      r.input("address",  sql.NVarChar(500), w.address || "");
      r.input("addr_det", sql.NVarChar(200), w.addressDetail ?? null);
      r.input("is_def",   sql.Bit,           isDefault);
      r.input("sort",     sql.Int,           i);

      await r.query(`
        MERGE worksites AS target
        USING (SELECT @ws_id AS id) AS source ON target.id = source.id
        WHEN MATCHED THEN
          UPDATE SET
            name = @name,
            address = @address,
            address_detail = @addr_det,
            is_default = @is_def,
            sort_order = @sort,
            updated_at = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (id, organization_id, name, address, address_detail, is_default, sort_order)
          VALUES (@ws_id, @org_id, @name, @address, @addr_det, @is_def, @sort);
      `);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[POST /api/organization]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
