import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const SEED_FACTORS = [
  // Scope 1 — NIER-2023
  {
    factorCode: "S1-LNG-KR-2024",
    scope: 1,
    fuelCode: "LNG",
    categoryCode: "fixed",
    country: "KR",
    year: 2024,
    sourceName: "국립환경과학원 국가 온실가스 배출·흡수계수",
    sourceVersion: "NIER-2023",
    calculationMethod: "Tier-1",
    co2Factor: 0.002244,
    co2FactorUnit: "tCO₂/Nm³",
    ch4Factor: 2.0e-7,
    ch4FactorUnit: "tCH₄/Nm³",
    n2oFactor: 4.0e-9,
    n2oFactorUnit: "tN₂O/Nm³",
    gwpCh4: 28.0,
    gwpN2o: 265.0,
  },
  {
    factorCode: "S1-DIESEL-MOBILE-KR-2024",
    scope: 1,
    fuelCode: "Diesel",
    categoryCode: "mobile",
    country: "KR",
    year: 2024,
    sourceName: "국립환경과학원 국가 온실가스 배출·흡수계수",
    sourceVersion: "NIER-2023",
    calculationMethod: "Tier-1",
    co2Factor: 0.0026128,
    co2FactorUnit: "tCO₂/L",
    ch4Factor: 1.375e-7,
    ch4FactorUnit: "tCH₄/L",
    n2oFactor: 1.375e-7,
    n2oFactorUnit: "tN₂O/L",
    gwpCh4: 28.0,
    gwpN2o: 265.0,
  },
  {
    factorCode: "S1-GASOLINE-MOBILE-KR-2024",
    scope: 1,
    fuelCode: "Gasoline",
    categoryCode: "mobile",
    country: "KR",
    year: 2024,
    sourceName: "국립환경과학원 국가 온실가스 배출·흡수계수",
    sourceVersion: "NIER-2023",
    calculationMethod: "Tier-1",
    co2Factor: 0.0022204,
    co2FactorUnit: "tCO₂/L",
    ch4Factor: 9.612e-7,
    ch4FactorUnit: "tCH₄/L",
    n2oFactor: 9.61e-8,
    n2oFactorUnit: "tN₂O/L",
    gwpCh4: 28.0,
    gwpN2o: 265.0,
  },
  // Scope 2 — 전력·스팀
  {
    factorCode: "S2-ELECTRICITY-KR-2024",
    scope: 2,
    fuelCode: "Electricity",
    categoryCode: "electricity",
    country: "KR",
    year: 2024,
    sourceName: "한국 전력거래소 간접배출 계수",
    sourceVersion: "2024",
    calculationMethod: "Location-Based",
    co2Factor: 0.44,
    co2FactorUnit: "tCO₂/MWh",
    ch4Factor: 0.007,
    ch4FactorUnit: "tCH₄/MWh",
    n2oFactor: 0.003,
    n2oFactorUnit: "tN₂O/MWh",
    gwpCh4: 28.0,
    gwpN2o: 265.0,
  },
  {
    factorCode: "S2-STEAM-KR-2024",
    scope: 2,
    fuelCode: "Steam",
    categoryCode: "steam",
    country: "KR",
    year: 2024,
    sourceName: "열·스팀 공급자 제공 배출계수",
    sourceVersion: "2024",
    calculationMethod: "Location-Based",
    co2Factor: 0.192,
    co2FactorUnit: "tCO₂/GJ",
    ch4Factor: 0.005,
    ch4FactorUnit: "tCH₄/GJ",
    n2oFactor: 0.003,
    n2oFactorUnit: "tN₂O/GJ",
    gwpCh4: 28.0,
    gwpN2o: 265.0,
  },
];

// POST /api/emission-factors/seed — 시드 데이터 투입
export async function POST() {
  try {
    let created = 0;
    let skipped = 0;

    for (const f of SEED_FACTORS) {
      const existing = await prisma.emissionFactorMaster.findUnique({
        where: { factorCode: f.factorCode },
      });
      if (existing) {
        skipped++;
        continue;
      }
      await prisma.emissionFactorMaster.create({ data: f });
      created++;
    }

    return NextResponse.json({ ok: true, created, skipped, total: SEED_FACTORS.length });
  } catch (err: any) {
    console.error("[POST /api/emission-factors/seed]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
