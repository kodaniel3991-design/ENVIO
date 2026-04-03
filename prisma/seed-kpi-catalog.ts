/**
 * KPI 카탈로그 시드 스크립트
 * 기존 ALL_KPI 하드코딩 데이터를 kpi_catalog 테이블에 삽입
 * 실행: npx tsx prisma/seed-kpi-catalog.ts
 */
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

import { ALL_KPI } from "../src/lib/ai-recommendations";

const connStr = process.env.DATABASE_URL || "";
const sep = connStr.includes("?") ? "&" : "?";
const pool = new pg.Pool({ connectionString: `${connStr}${sep}client_encoding=UTF8` });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  const domains = ["environmental", "social", "governance"] as const;
  let total = 0;

  for (const domain of domains) {
    const items = ALL_KPI[domain];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await prisma.kpiCatalog.upsert({
        where: { uq_kpi_catalog: { esgDomain: domain, name: item.name } },
        update: {
          grp: item.group,
          description: item.description,
          reason: item.reason,
          criteria: item.criteria,
          frameworks: JSON.stringify(item.frameworks ?? []),
          sortOrder: i,
          active: true,
        },
        create: {
          esgDomain: domain,
          grp: item.group,
          name: item.name,
          description: item.description,
          reason: item.reason,
          criteria: item.criteria,
          frameworks: JSON.stringify(item.frameworks ?? []),
          sortOrder: i,
          active: true,
        },
      });
      total++;
    }
    console.log(`  ${domain}: ${items.length}개 upsert 완료`);
  }

  console.log(`\n총 ${total}개 KPI 카탈로그 시드 완료`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
