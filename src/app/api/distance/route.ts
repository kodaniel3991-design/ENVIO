import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface DistanceApiSettings {
  provider: string;
  apiKey?: string;
  baseUrl?: string;
  enabled: boolean;
}

/** 카카오 주소 → 좌표 변환 */
async function kakaoGeocode(address: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
    { headers: { Authorization: `KakaoAK ${apiKey}` } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const doc = data.documents?.[0];
  if (!doc) {
    // 주소 검색 실패 시 키워드 검색 시도
    const res2 = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(address)}`,
      { headers: { Authorization: `KakaoAK ${apiKey}` } }
    );
    if (!res2.ok) return null;
    const data2 = await res2.json();
    const doc2 = data2.documents?.[0];
    if (!doc2) return null;
    return { lat: parseFloat(doc2.y), lng: parseFloat(doc2.x) };
  }
  return { lat: parseFloat(doc.y), lng: parseFloat(doc.x) };
}

/** 두 좌표 간 직선거리 (Haversine) */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/distance — 거리 API 설정 조회
export async function GET() {
  try {
    const org = await prisma.organization.findFirst();
    const settings: DistanceApiSettings = org?.distanceApiSettings
      ? JSON.parse(org.distanceApiSettings)
      : { provider: "none", enabled: false };
    return NextResponse.json(settings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/distance — 거리 API 설정 저장
export async function PUT(req: NextRequest) {
  try {
    const settings: DistanceApiSettings = await req.json();
    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    await prisma.organization.update({
      where: { id: org.id },
      data: { distanceApiSettings: JSON.stringify(settings) },
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/distance — 직원 편도거리 일괄 계산
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { worksiteId } = body as { worksiteId?: string };

    // 설정 조회
    const org = await prisma.organization.findFirst();
    if (!org?.distanceApiSettings) {
      return NextResponse.json({ error: "거리 API 설정이 없습니다. 설정 > API 키 관리에서 등록하세요." }, { status: 400 });
    }
    const settings: DistanceApiSettings = JSON.parse(org.distanceApiSettings);
    if (!settings.enabled || settings.provider === "none" || !settings.apiKey) {
      return NextResponse.json({ error: "거리 API가 비활성화되어 있거나 API 키가 없습니다." }, { status: 400 });
    }

    // 사업장 주소 조회
    const worksite = worksiteId
      ? await prisma.worksite.findUnique({ where: { id: worksiteId } })
      : await prisma.worksite.findFirst({ where: { isDefault: true } });
    if (!worksite?.address) {
      return NextResponse.json({ error: "사업장 주소가 등록되지 않았습니다." }, { status: 400 });
    }

    // 사업장 좌표 구하기
    const wsCoord = await kakaoGeocode(worksite.address, settings.apiKey);
    if (!wsCoord) {
      return NextResponse.json({ error: `사업장 주소 좌표를 찾을 수 없습니다: ${worksite.address}` }, { status: 400 });
    }

    // 해당 사업장 직원 중 주소가 있고 거리가 없는 직원 조회
    const employees = await prisma.employee.findMany({
      where: {
        worksiteId: worksite.id,
        address: { not: null },
      },
    });

    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const emp of employees) {
      if (!emp.address) continue;
      try {
        const empCoord = await kakaoGeocode(emp.address, settings.apiKey);
        if (!empCoord) {
          failed++;
          errors.push(`${emp.name}: 주소 좌표 변환 실패`);
          continue;
        }

        // 직선거리 × 1.3 (도로 보정계수)
        const straightKm = haversineKm(wsCoord.lat, wsCoord.lng, empCoord.lat, empCoord.lng);
        const roadKm = Math.round(straightKm * 1.3 * 10) / 10;

        await prisma.employee.update({
          where: { id: emp.id },
          data: {
            commuteDistanceKm: roadKm,
            roundTripDistanceKm: Math.round(roadKm * 2 * 10) / 10,
            workAddress: worksite.address,
          },
        });
        updated++;
      } catch (e: any) {
        failed++;
        errors.push(`${emp.name}: ${e.message}`);
      }
    }

    return NextResponse.json({
      ok: true,
      total: employees.length,
      updated,
      failed,
      errors: errors.slice(0, 10),
      worksiteCoord: wsCoord,
    });
  } catch (err: any) {
    console.error("[POST /api/distance]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
