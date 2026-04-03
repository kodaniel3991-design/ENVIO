/**
 * KPI 카탈로그 priority 시드 스크립트
 * 프레임워크별 핵심 필수 항목을 critical로 업데이트
 * 실행: npx tsx prisma/seed-kpi-priority.ts
 */
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const connStr = process.env.DATABASE_URL || "";
const sep = connStr.includes("?") ? "&" : "?";
const pool = new pg.Pool({ connectionString: `${connStr}${sep}client_encoding=UTF8` });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

/**
 * Critical KPI 목록 — 주요 프레임워크가 의무적으로 요구하는 핵심 지표
 *
 * 선정 기준:
 * - GRI: Universal Standards 2021 필수 공시 (GRI 2, 302, 303, 305, 306, 401, 403, 405)
 * - ISSB S2: 기후 관련 필수 공시 (온실가스, 에너지, 기후 리스크)
 * - CDP: 기후변화 질의서 핵심 항목
 * - K-ESG: 한국형 ESG 필수 핵심 지표
 * - TCFD: 기후 관련 재무 공시 핵심 권고
 */
const CRITICAL_KPIS: Record<string, string[]> = {
  environmental: [
    "온실가스 배출량(Scope 1+2)",       // GRI 305, ISSB S2, CDP — 기후 공시의 출발점
    "공급망 탄소(Scope 3)",             // GRI 305, ISSB S2, CDP — Scope 3 공시 의무화 추세
    "배출 감축률",                       // GRI 305, ISSB S2, CDP, TCFD — 넷제로 진행도
    "총 에너지 사용량",                  // GRI 302, ISSB S2, CDP — 에너지 기본 공시
    "재생에너지 비율",                   // GRI 302, ISSB, CDP — RE100 핵심
    "용수 사용량",                       // GRI 303, CDP Water — 수자원 기본 공시
    "폐기물 발생량",                     // GRI 306 — 폐기물 기본 공시
    "기후 리스크 영향도",                // ISSB S2, TCFD — 기후 리스크 필수 공시
    "탄소중립 목표",                     // ISSB, CDP, TCFD — 넷제로 전략 공시
  ],
  social: [
    "산업재해율",                        // GRI 403, K-ESG — 중대재해처벌법 핵심
    "사망 사고 건수",                    // GRI 403 — 중대재해 필수 공시
    "총 직원 수",                        // GRI 102 — 모든 S 지표의 분모
    "여성 고용 비율",                    // GRI 405 — 다양성 기본 공시
    "여성 관리자 비율",                  // GRI 405 — 리더십 성평등 핵심
    "교육훈련 시간",                     // GRI 404 — 인적자본 투자 기본
    "이직률",                           // GRI 401 — 고용 안정성 핵심
    "성별 임금 격차",                    // GRI 405 — 공정 보상 핵심
    "아동노동 발생 여부",                // GRI 408 — 인권 필수
    "강제노동 발생 여부",                // GRI 409 — 인권 필수
  ],
  governance: [
    "사외이사 비율",                     // GRI 102, K-ESG — 이사회 독립성 핵심
    "여성 이사 비율",                    // GRI 405 — 이사회 다양성 핵심
    "ESG 위원회 존재 여부",              // K-ESG — ESG 거버넌스 핵심
    "반부패 정책 존재 여부",             // GRI 205 — 윤리 경영 필수
    "윤리강령 존재 여부",                // GRI 205 — 윤리 기반 필수
    "ESG 보고서 발간 여부",              // GRI, K-ESG — 투명성 기본
    "외부 검증 여부",                    // GRI — 데이터 신뢰성 핵심
    "법규 위반 건수",                    // GRI 206 — 컴플라이언스 핵심
    "정보보안 사고 건수",                // GRI — 디지털 리스크 핵심
  ],
};

async function main() {
  let criticalCount = 0;

  for (const [domain, names] of Object.entries(CRITICAL_KPIS)) {
    for (const name of names) {
      const result = await prisma.kpiCatalog.updateMany({
        where: { esgDomain: domain, name },
        data: { priority: "critical" },
      });
      if (result.count > 0) criticalCount++;
    }
    console.log(`  ${domain}: ${names.length}개 critical 설정`);
  }

  const total = await prisma.kpiCatalog.count();
  const critical = await prisma.kpiCatalog.count({ where: { priority: "critical" } });
  console.log(`\n총 ${total}개 중 ${critical}개 critical, ${total - critical}개 recommended`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
