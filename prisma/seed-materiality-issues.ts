/**
 * KPI 카탈로그의 group을 기반으로 중대성 이슈를 자동 생성
 * 실행: npx tsx prisma/seed-materiality-issues.ts
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

// ESG 도메인 → 중대성 dimension 매핑
const DOMAIN_TO_DIMENSION: Record<string, string> = {
  environmental: "environment",
  social: "social",
  governance: "governance",
};

// 그룹별 이슈 설명
const GROUP_DESCRIPTIONS: Record<string, string> = {
  "탄소/기후": "온실가스 배출 관리, 기후변화 대응 전략 및 넷제로 목표 달성",
  "에너지": "에너지 사용 효율화, 재생에너지 전환 및 에너지 비용 관리",
  "수자원": "용수 사용 관리, 수자원 재활용 및 수질 오염 방지",
  "폐기물": "폐기물 발생 저감, 재활용률 향상 및 순환경제 전환",
  "오염/환경 영향": "대기·토양·수질 오염물질 배출 관리 및 환경 민원 대응",
  "환경 리스크/컴플라이언스": "환경 법규 준수, 환경 사고 예방 및 벌금·제재 관리",
  "제품/공급망": "친환경 제품 개발, 제품 탄소발자국 관리 및 공급망 환경 평가",
  "기타": "녹색건물 인증, 생물다양성 보전 등 기타 환경 이슈",
  "노동/안전": "산업재해 예방, 근로자 안전보건 관리 및 중대재해 대응",
  "인사/고용": "인재 확보·유지, 고용 안정성 및 근로조건 개선",
  "다양성/포용성(DEI)": "성별·연령·장애인 다양성 확보 및 공정 보상 체계",
  "노동/인권": "인권 존중 경영, 강제노동·아동노동 방지 및 인권 실사",
  "공급망/협력사": "공급망 ESG 리스크 관리, 협력사 안전·인권 실사",
  "교육/조직문화": "인적자본 투자, 교육훈련 및 일·생활 균형 지원",
  "고객/사회 영향": "고객 만족, 제품 안전, 지역사회 기여 및 사회공헌",
  "이사회/지배구조": "이사회 독립성·다양성 확보 및 ESG 거버넌스 체계",
  "윤리/반부패": "윤리 경영, 반부패 정책 이행 및 내부 신고 체계 운영",
  "정보보안/데이터 보호": "사이버 보안, 개인정보 보호 및 데이터 거버넌스",
  "리스크 관리/내부통제": "전사 리스크 관리 체계, 내부 감사 및 컴플라이언스",
  "공시/투명성": "ESG 보고서 발간, 데이터 검증 및 공시 적시성",
  "공급망 거버넌스": "공급망 ESG 평가·감사 체계 및 협력사 윤리 기준",
  "정책/시스템": "ESG 정책 수립, 경영진 KPI 반영 및 전담 조직 운영",
};

async function main() {
  // 1. KPI 카탈로그에서 고유 그룹 추출
  const catalog = await prisma.kpiCatalog.findMany({
    where: { active: true },
    select: { esgDomain: true, grp: true },
    distinct: ["esgDomain", "grp"],
    orderBy: [{ esgDomain: "asc" }, { sortOrder: "asc" }],
  });

  // 도메인+그룹 조합으로 이슈 생성
  const issueMap = new Map<string, { domain: string; group: string }>();
  for (const item of catalog) {
    const key = `${item.esgDomain}::${item.grp}`;
    if (!issueMap.has(key)) {
      issueMap.set(key, { domain: item.esgDomain, group: item.grp });
    }
  }

  // 2. 조직 목록 조회
  const orgs = await prisma.organization.findMany({ select: { id: true } });

  let total = 0;
  for (const org of orgs) {
    let idx = 0;
    for (const [, { domain, group }] of Array.from(issueMap)) {
      const dimension = DOMAIN_TO_DIMENSION[domain] ?? "environment";
      const prefix = dimension === "environment" ? "ENV" : dimension === "social" ? "SOC" : "GOV";
      const code = `${prefix}-${String(idx + 1).padStart(2, "0")}`;
      const id = `mat-${org.id}-${code}`;

      await prisma.materialityIssue.upsert({
        where: { id },
        update: {
          name: group,
          dimension,
          kpiGroup: group,
          description: GROUP_DESCRIPTIONS[group] ?? "",
        },
        create: {
          id,
          organizationId: org.id,
          code,
          name: group,
          dimension,
          kpiGroup: group,
          description: GROUP_DESCRIPTIONS[group] ?? "",
          expertScore: 3.0,
          benchmarkScore: 3.0,
        },
      });
      idx++;
      total++;
    }
    console.log(`  조직 ${org.id}: ${idx}개 이슈 생성/업데이트`);
  }

  // 3. KPI 연결 수 업데이트
  const issues = await prisma.materialityIssue.findMany({
    where: { kpiGroup: { not: null } },
    select: { id: true, kpiGroup: true, dimension: true },
  });

  for (const issue of issues) {
    const domain = issue.dimension === "environment" ? "environmental"
      : issue.dimension === "social" ? "social" : "governance";
    const count = await prisma.kpiCatalog.count({
      where: { esgDomain: domain, grp: issue.kpiGroup!, active: true },
    });
    await prisma.materialityIssue.update({
      where: { id: issue.id },
      data: {
        kpiLinkedCount: count,
        kpiConnectionStatus: count > 0 ? "full" : "none",
      },
    });
  }

  console.log(`\n총 ${total}개 중대성 이슈 생성 완료`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
