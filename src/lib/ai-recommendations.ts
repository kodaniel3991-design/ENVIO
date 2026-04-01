/**
 * 산업군별 AI 추천 데이터
 * 실제 Claude AI 호출로 교체 가능한 구조로 설계
 */

export interface KpiItem {
  group: string;
  name: string;
  description: string;
  reason: string;
  criteria: string;
  /** 이 KPI를 요구하는 프레임워크 목록 (명시적 선언) */
  frameworks?: string[];
}

export interface AiRecommendation {
  kpi: {
    environmental: string[];
    social: string[];
    governance: string[];
  };
  frameworks: string[];
  scope3Categories: string[];
}

export const INDUSTRY_RECOMMENDATIONS: Record<string, AiRecommendation> = {
  자동차: {
    kpi: {
      environmental: ["온실가스 배출량(Scope 1+2)", "총 에너지 사용량", "공급망 탄소(Scope 3)", "용수 사용량", "폐기물 발생량", "재생에너지 비율"],
      social: ["산업재해율", "여성 관리자 비율", "교육훈련 시간", "이직률", "공급망 인권 실사"],
      governance: ["ESG 위원회 존재 여부", "공급망 리스크 평가율", "반부패 정책 존재 여부", "여성 이사 비율"],
    },
    frameworks: ["GRI", "ISSB", "CDP"],
    scope3Categories: ["구매 제품 및 서비스", "자본재", "상류 운송·물류", "출장", "통근", "판매 제품 사용"],
  },
  제조: {
    kpi: {
      environmental: ["온실가스 배출량(Scope 1+2)", "에너지 효율", "용수 사용량", "폐기물 재활용률", "대기오염물질 배출"],
      social: ["산업재해율", "직업병 발생률", "여성 고용 비율", "교육훈련 시간", "협력사 안전 관리"],
      governance: ["ESG 위원회 존재 여부", "공급망 리스크 평가율", "컴플라이언스 점검 수행률", "반부패 정책 존재 여부"],
    },
    frameworks: ["GRI", "K-ESG", "CDP"],
    scope3Categories: ["구매 제품 및 서비스", "자본재", "상류 운송·물류", "폐기물", "출장", "통근"],
  },
  건설: {
    kpi: {
      environmental: ["온실가스 배출량(Scope 1+2)", "폐기물 재활용률", "총 에너지 사용량", "녹색건물 인증"],
      social: ["산업재해율", "협력사 안전 관리", "지역사회 투자", "여성 고용 비율"],
      governance: ["ESG 위원회 존재 여부", "반부패 정책 존재 여부", "공급망 ESG 평가율", "법규 위반 건수"],
    },
    frameworks: ["GRI", "K-ESG"],
    scope3Categories: ["구매 제품 및 서비스", "자본재", "상류 운송·물류", "폐기물", "출장", "통근"],
  },
  "IT/소프트웨어": {
    kpi: {
      environmental: ["총 에너지 사용량", "재생에너지 비율", "폐기물 재활용률", "탄소중립 목표"],
      social: ["여성 고용 비율", "이직률", "교육훈련 시간", "직원 만족도", "공급망 인권 실사"],
      governance: ["보안 인증 보유 여부", "데이터 보호 정책 존재 여부", "여성 이사 비율", "윤리강령 존재 여부"],
    },
    frameworks: ["GRI", "ISSB", "CDP"],
    scope3Categories: ["구매 제품 및 서비스", "출장", "통근", "클라우드 서비스"],
  },
  금융: {
    kpi: {
      environmental: ["온실가스 배출량(Scope 1+2)", "총 에너지 사용량", "배출 감축률", "탄소중립 목표"],
      social: ["여성 관리자 비율", "고객 만족도", "지역사회 투자", "교육훈련 시간"],
      governance: ["사외이사 비율", "리스크 평가 체계 존재 여부", "반부패 정책 존재 여부", "ESG 위원회 존재 여부"],
    },
    frameworks: ["GRI", "ISSB", "TCFD"],
    scope3Categories: ["투자 포트폴리오", "출장", "통근"],
  },
  유통: {
    kpi: {
      environmental: ["폐기물 감축률", "온실가스 배출량(Scope 1+2)", "에너지 집약도", "폐기물 재활용률"],
      social: ["산업재해율", "협력사 안전 관리", "여성 고용 비율", "고객 만족도"],
      governance: ["공급망 ESG 평가율", "반부패 정책 존재 여부", "데이터 보호 정책 존재 여부"],
    },
    frameworks: ["GRI", "K-ESG"],
    scope3Categories: ["구매 제품 및 서비스", "상류 운송·물류", "하류 운송·물류", "포장재", "출장", "통근"],
  },
  에너지: {
    kpi: {
      environmental: ["온실가스 배출량(Scope 1+2)", "재생에너지 비율", "에너지 집약도", "생물다양성 영향"],
      social: ["산업재해율", "지역사회 투자", "신규 채용률", "교육훈련 시간"],
      governance: ["리스크 식별 건수", "ESG 위원회 존재 여부", "법규 위반 건수"],
    },
    frameworks: ["GRI", "ISSB", "CDP", "TCFD"],
    scope3Categories: ["구매 제품 및 서비스", "자본재", "연료·에너지 관련", "출장", "통근"],
  },
  화학: {
    kpi: {
      environmental: ["온실가스 배출량(Scope 1+2)", "대기오염물질 배출", "용수 사용량", "수질 오염 배출량"],
      social: ["산업재해율", "안전교육 이수율", "지역사회 영향 평가", "협력사 안전 관리"],
      governance: ["법규 위반 건수", "ESG 위원회 존재 여부", "공급망 리스크 평가율"],
    },
    frameworks: ["GRI", "CDP", "K-ESG"],
    scope3Categories: ["구매 제품 및 서비스", "폐기물", "출장", "통근"],
  },
  식품: {
    kpi: {
      environmental: ["온실가스 배출량(Scope 1+2)", "용수 사용량", "폐기물 감축률", "폐기물 재활용률"],
      social: ["제품 안전 사고", "공급망 인권 실사", "지역사회 투자", "고객 만족도"],
      governance: ["법규 위반 건수", "공급망 ESG 평가율", "반부패 정책 존재 여부"],
    },
    frameworks: ["GRI", "K-ESG"],
    scope3Categories: ["농산물 원료", "포장재", "상류 운송·물류", "식품 폐기물", "출장", "통근"],
  },
  기타: {
    kpi: {
      environmental: ["온실가스 배출량(Scope 1+2)", "총 에너지 사용량", "용수 사용량", "폐기물 발생량"],
      social: ["산업재해율", "여성 관리자 비율", "교육훈련 시간", "이직률"],
      governance: ["ESG 위원회 존재 여부", "반부패 정책 존재 여부", "여성 이사 비율"],
    },
    frameworks: ["GRI", "K-ESG"],
    scope3Categories: ["구매 제품 및 서비스", "출장", "통근"],
  },
};

export const ALL_KPI: { environmental: KpiItem[]; social: KpiItem[]; governance: KpiItem[] } = {
  environmental: [
    // 탄소/기후
    { group: "탄소/기후", name: "온실가스 배출량(Scope 1+2)", description: "Scope 1+2 온실가스 총량", reason: "GHG Protocol 핵심 — 기후 공시의 출발점이자 탄소 감축 전략의 기준 지표", criteria: "tCO2e 단위 측정, 제3자 검증 권장", frameworks: ["GRI", "ISSB", "CDP", "TCFD"] },
    { group: "탄소/기후", name: "공급망 탄소(Scope 3)", description: "가치사슬 간접 온실가스 배출량", reason: "전체 배출의 70~90%를 차지 — GHG Protocol Scope 3 공급망 탄소 핵심 공시", criteria: "15개 카테고리별 산정, GHG Protocol Scope 3 Standard", frameworks: ["GRI", "ISSB", "CDP"] },
    { group: "탄소/기후", name: "탄소 집약도", description: "매출 대비 온실가스 배출 효율", reason: "절대량 외 효율성 파악 및 동종 업계 비교 — GRI·ISSB 탄소 효율 측정 지표", criteria: "tCO2e/억원 또는 tCO2e/생산단위", frameworks: ["GRI", "ISSB"] },
    { group: "탄소/기후", name: "배출 감축률", description: "기준연도 대비 배출 감소 비율", reason: "넷제로 목표 진행도 측정의 핵심 — SBTi·TCFD 기후 목표 이행 진단 지표", criteria: "% 단위, 기준연도 명시 필수", frameworks: ["GRI", "ISSB", "CDP", "TCFD"] },
    { group: "탄소/기후", name: "Scope3 카테고리별 배출", description: "15개 Scope3 카테고리 세분화 배출량", reason: "배출 핫스팟 파악 및 감축 우선순위 설정 — GHG Protocol Scope 3 Standard 세분화 공시", criteria: "GHG Protocol Scope 3 Standard 준수", frameworks: ["GRI", "CDP"] },
    { group: "탄소/기후", name: "내부 탄소가격 적용 여부", description: "내부 탄소 비용 부과 여부 및 가격", reason: "투자 의사결정의 탄소비용 내재화 수준 — TCFD·CDP 탄소 가격 책정 핵심 항목", criteria: "₩/tCO2e 단위, 적용 범위 명시", frameworks: ["TCFD", "CDP"] },
    { group: "탄소/기후", name: "탄소중립 목표", description: "넷제로 목표 연도 및 감축 경로", reason: "SBTi 과학기반 목표 설정 여부 공시 — TCFD·CDP 넷제로 전략 핵심 공시 항목", criteria: "목표연도·기준연도·감축방법론 명시", frameworks: ["ISSB", "CDP", "TCFD"] },
    { group: "탄소/기후", name: "탄소중립 목표 달성률", description: "넷제로 목표 대비 감축 진행률", reason: "기후 목표 이행 모니터링 및 투자자 신뢰 확보 — ISSB·CDP 기후 진행률 공시", criteria: "% 단위, 연간 감축 경로 대비 실적 비교", frameworks: ["ISSB", "CDP"] },
    { group: "탄소/기후", name: "기후 리스크 영향도", description: "기후 리스크의 재무적 영향 평가", reason: "물리적·전환 리스크의 재무 영향 정량화 — TCFD·CSRD ESRS E1 핵심 공시 항목", criteria: "고·중·저 리스크 분류 및 금액 추정", frameworks: ["ISSB", "TCFD"] },
    { group: "탄소/기후", name: "기후 기회(Opportunity)", description: "기후변화 관련 사업 기회 식별", reason: "리스크뿐 아니라 기회 측면 공시 요구 — TCFD·ISSB 기후 기회 공시 핵심 항목", criteria: "기회 유형(제품·시장·자원효율 등) 및 잠재 규모", frameworks: ["ISSB", "TCFD"] },
    // 에너지
    { group: "에너지", name: "총 에너지 사용량", description: "전력·연료·열 등 총 소비량", reason: "에너지 관리의 기본 지표 — GRI 302·CSRD ESRS E1 에너지 소비 기본 공시", criteria: "GJ 또는 MWh 단위, 에너지원별 구분", frameworks: ["GRI", "ISSB", "CDP"] },
    { group: "에너지", name: "에너지 집약도", description: "매출 대비 에너지 소비 효율", reason: "에너지 효율 개선 추이 파악 및 산업 내 비교 — GRI 302 에너지 원단위 지표", criteria: "GJ/억원 또는 GJ/생산단위", frameworks: ["GRI", "ISSB"] },
    { group: "에너지", name: "재생에너지 사용량", description: "태양광·풍력 등 재생에너지 소비량", reason: "RE100 이행 및 Scope2 감축의 핵심 — GRI 302·CDP 재생에너지 전환 공시 항목", criteria: "GWh 단위, 에너지원별 구분", frameworks: ["GRI", "CDP"] },
    { group: "에너지", name: "재생에너지 비율", description: "총 에너지 중 재생에너지 비중", reason: "RE100 목표 달성률 모니터링 — GRI 302·ISSB 재생에너지 전환 진행도 지표", criteria: "% 단위, 연도별 목표 병기 권장", frameworks: ["GRI", "ISSB", "CDP"] },
    { group: "에너지", name: "에너지 절감량", description: "효율화 활동 에너지 절감 실적", reason: "에너지 절감 투자의 효과 측정 — GRI 302-4 에너지 절약 활동 성과 공시", criteria: "GJ 또는 MWh, 절감 활동별 구분", frameworks: ["GRI"] },
    { group: "에너지", name: "에너지 효율", description: "생산단위당 에너지 소비 개선률", reason: "효율화 프로그램 성과의 수치적 측정 — GRI 302 에너지 원단위 개선률 지표", criteria: "% 개선율 또는 에너지원단위", frameworks: ["GRI"] },
    { group: "에너지", name: "에너지 비용", description: "에너지 구매 총 비용", reason: "에너지 가격 리스크의 재무적 영향 파악 — ISSB·TCFD 재무 리스크 연계 지표", criteria: "백만원 단위, 에너지원별 구분", frameworks: ["ISSB", "TCFD"] },
    // 수자원
    { group: "수자원", name: "용수 사용량", description: "총 취수량(지하수·상수도 등)", reason: "수자원 관리의 기본 지표 — GRI 303·CSRD ESRS E3 취수량 기본 공시 항목", criteria: "m³ 단위, 수원별 구분", frameworks: ["GRI", "CDP"] },
    { group: "수자원", name: "수자원 집약도", description: "매출 대비 용수 사용 효율", reason: "수자원 효율화 추이 파악 및 산업 내 비교 — GRI 303 수자원 원단위 지표", criteria: "m³/억원 또는 m³/생산단위", frameworks: ["GRI"] },
    { group: "수자원", name: "수자원 재사용률", description: "용수 재이용·순환 사용 비율", reason: "취수 저감 및 순환경제 기여도 측정 — GRI 303 재이용수 활용 공시 항목", criteria: "% 단위", frameworks: ["GRI"] },
    { group: "수자원", name: "고위험 지역 수자원 사용량", description: "물 부족 지역 취수량", reason: "WRI Aqueduct 기반 물 스트레스 리스크 평가 — CDP Water 핵심 공시 항목", criteria: "m³, 위험 지역 비율 함께 공시", frameworks: ["CDP"] },
    { group: "수자원", name: "수질 오염 배출량", description: "방류 수질 오염물질 총량", reason: "수계 환경 영향 최소화 요구 — GRI 303·CSRD ESRS E3 수질 오염 배출 공시", criteria: "mg/L 및 총량(ton) 단위", frameworks: ["GRI"] },
    // 폐기물
    { group: "폐기물", name: "폐기물 발생량", description: "사업장 총 폐기물 양", reason: "폐기물 관리의 기본 지표 — GRI 306·CSRD ESRS E5 폐기물 발생 기본 공시", criteria: "ton 단위, 유해/일반 구분", frameworks: ["GRI", "CDP"] },
    { group: "폐기물", name: "폐기물 재활용률", description: "폐기물 중 재활용 비율", reason: "순환경제 기여도 측정 — GRI 306 폐기물 처리 방식 및 재활용 비율 공시", criteria: "% 단위", frameworks: ["GRI"] },
    { group: "폐기물", name: "유해 폐기물 비율", description: "총 폐기물 중 지정폐기물 비율", reason: "환경·안전 리스크 관리의 핵심 — GRI 306 유해 폐기물 별도 공시 요구 항목", criteria: "% 및 절대량(ton)", frameworks: ["GRI"] },
    { group: "폐기물", name: "폐기물 처리 방식별 비율", description: "매립·소각·재활용 등 처리 구성", reason: "처리 방식 개선 추이 파악 — GRI 306 폐기물 처리 경로별 구분 공시 항목", criteria: "% 구성비, 방식별 절대량", frameworks: ["GRI"] },
    { group: "폐기물", name: "폐기물 감축률", description: "기준연도 대비 발생 감소율", reason: "폐기물 감축 목표 달성 모니터링 — GRI 306·CSRD ESRS E5 폐기물 감축 이행 지표", criteria: "% 단위, 기준연도 명시", frameworks: ["GRI"] },
    { group: "폐기물", name: "순환자원 사용 비율", description: "재생·순환 소재 사용 비율", reason: "순환경제 전환 정도 측정 — CSRD ESRS E5 순환경제 핵심 공시 항목", criteria: "% 단위, 소재 유형별 구분" },
    // 오염/환경 영향
    { group: "오염/환경 영향", name: "대기오염물질 배출", description: "NOx·SOx·먼지 등 배출량", reason: "지역 대기질 영향 관리 — GRI 305·CSRD ESRS E2 대기오염 물질 공시 항목", criteria: "ton 단위, 물질별 구분", frameworks: ["GRI"] },
    { group: "오염/환경 영향", name: "총 대기오염 배출량", description: "대기오염물질 통합 배출량", reason: "통합 대기 관리 수준 측정 — GRI 305 대기오염 통합 공시 지표", criteria: "ton, 물질별 합산 또는 CO2eq", frameworks: ["GRI"] },
    { group: "오염/환경 영향", name: "오염물질 초과 배출 건수", description: "법적 기준 초과 배출 횟수", reason: "환경 법규 준수 현황 모니터링 — GRI 307 환경 컴플라이언스 핵심 지표", criteria: "건수, 초과 사유 및 조치 내역 포함", frameworks: ["GRI"] },
    { group: "오염/환경 영향", name: "토양/수질 오염 사고 건수", description: "토양·수질 오염 사고 발생 수", reason: "환경 사고 예방 및 관리 수준 측정 — GRI 306·307 환경 사고 공시 항목", criteria: "건수, 피해 규모 및 복구 현황", frameworks: ["GRI"] },
    { group: "오염/환경 영향", name: "환경 민원 건수", description: "환경 관련 민원 접수 건수", reason: "지역사회 환경 영향 및 소통 수준 파악 — GRI 413 지역사회 영향 관리 지표", criteria: "건수, 유형별 구분 및 해결률", frameworks: ["GRI"] },
    // 환경 리스크/컴플라이언스
    { group: "환경 리스크/컴플라이언스", name: "환경 사고 건수", description: "환경 오염 사고 발생 횟수", reason: "환경 관리 시스템 실효성 평가 — GRI 307 환경 사고 발생 공시 핵심 항목", criteria: "건수, 중대사고 별도 구분", frameworks: ["GRI"] },
    { group: "환경 리스크/컴플라이언스", name: "환경 벌금 금액", description: "환경 법규 위반 벌금·과태료 총액", reason: "환경 규제 리스크의 재무적 영향 측정 — GRI 307 환경 부과금 공시 항목", criteria: "백만원 단위, 위반 유형 포함", frameworks: ["GRI"] },
    { group: "환경 리스크/컴플라이언스", name: "환경 법규 위반 건수", description: "환경 법규 위반 행정처분 건수", reason: "환경 법적 리스크 관리 수준 파악 — GRI 307 환경 법규 위반 핵심 공시 항목", criteria: "건수, 처분 유형 구분", frameworks: ["GRI"] },
    { group: "환경 리스크/컴플라이언스", name: "환경 리스크 평가 수행 여부", description: "환경 리스크 평가 운영 여부", reason: "선제적 환경 리스크 관리 역량 확인 — TCFD·CSRD ESRS E1 환경 리스크 평가 요구", criteria: "수행 여부(Y/N), 평가 주기 및 대상 범위", frameworks: ["TCFD"] },
    // 제품/공급망
    { group: "제품/공급망", name: "친환경 제품 매출 비율", description: "친환경 인증 제품 매출 비중", reason: "녹색 전환 사업 포트폴리오 측정 — EU 택소노미·CSRD 녹색 매출 공시 핵심 항목", criteria: "% 단위, 인증 기준 명시" },
    { group: "제품/공급망", name: "제품 탄소발자국", description: "제품 전 과정 온실가스 배출량", reason: "LCA 기반 제품 환경영향 관리 — ISO 14067·CSRD 제품 탄소 공시 핵심 항목", criteria: "tCO2e/제품단위, ISO 14067 기준" },
    { group: "제품/공급망", name: "공급망 탄소 배출량", description: "주요 협력사 온실가스 배출량", reason: "공급망 탈탄소화 이행 수준 측정 — GHG Protocol Scope 3 Cat.1 핵심 공시", criteria: "tCO2e, 주요 협력사 커버리지 비율", frameworks: ["GRI", "CDP"] },
    { group: "제품/공급망", name: "공급망 환경 평가율", description: "환경 평가 받은 공급업체 비율", reason: "공급망 환경 리스크 관리 수준 파악 — EcoVadis·GRI 414 공급망 환경 평가 지표", criteria: "% 단위, 평가 기준 및 방법론 명시", frameworks: ["GRI"] },
    // 기타
    { group: "기타", name: "녹색건물 인증", description: "친환경 인증 건물 비율·건수", reason: "부동산 자산의 환경 품질 관리 — GRI·LEED·BREEAM 자산 환경 성능 공시 지표", criteria: "인증 건수 및 비율, 인증 등급 구분", frameworks: ["GRI"] },
    { group: "기타", name: "생물다양성 영향", description: "사업장 생태계 영향 평가", reason: "TNFD 프레임워크 대응 핵심 지표 — GRI 304·CSRD ESRS E4 생물다양성 공시 항목", criteria: "고위험 사업장 비율, 생태계 복원 활동", frameworks: ["GRI"] },
  ],
  social: [
    // 노동/안전
    { group: "노동/안전", name: "산업재해율", description: "근로자 1만명당 산업재해 발생 건수 및 비율", reason: "GRI 403·CSRD·SASB 핵심 — 산업안전보건의 법적 기준 준수 지표", criteria: "GRI, CSRD, SASB", frameworks: ["GRI", "ISSB"] },
    { group: "노동/안전", name: "직업병 발생률", description: "직업성 질환 발생 건수 비율", reason: "CSRD ESRS S1 요구 — 장기 만성 직업성 질환 리스크 관리 수준 측정", criteria: "CSRD", frameworks: ["GRI"] },
    { group: "노동/안전", name: "사망 사고 건수", description: "업무상 사망자 수", reason: "GRI·CSRD·SASB 최우선 지표 — 중대재해처벌법 대응의 핵심 공시 항목", criteria: "GRI, CSRD, SASB", frameworks: ["GRI", "ISSB"] },
    { group: "노동/안전", name: "LTIFR", description: "손실시간 사고율 (Lost Time Injury Frequency Rate)", reason: "글로벌 산업 안전 비교 표준 — 손실시간 기반 사고율로 SASB 요구", criteria: "SASB", frameworks: ["GRI"] },
    { group: "노동/안전", name: "근로손실일수", description: "사고로 인한 근로 손실 일수", reason: "사고의 실질적 심각도 측정 — GRI 403 공시 핵심 항목", criteria: "GRI", frameworks: ["GRI"] },
    { group: "노동/안전", name: "안전교육 이수율", description: "안전 교육 완료 비율", reason: "사고 예방의 선행 지표 — EcoVadis 안전 관리 평가 핵심 항목", criteria: "EcoVadis", frameworks: ["GRI"] },
    { group: "노동/안전", name: "안전 점검 수행률", description: "정기 안전 점검 수행 수준", reason: "예방적 안전 관리 실행력 측정 — EcoVadis 현장 관리 평가", criteria: "EcoVadis" },
    { group: "노동/안전", name: "직업건강 관리 프로그램 여부", description: "건강관리 체계 운영 여부", reason: "임직원 건강 보호 체계 구비 여부 — K-ESG 사회 항목 핵심", criteria: "K-ESG" },
    // 인사/고용
    { group: "인사/고용", name: "총 직원 수", description: "전체 인원(정규직·계약직·파견직 포함)", reason: "모든 S 지표 산정의 분모 — GRI 102·CSRD 고용 현황 기본 공시", criteria: "GRI, CSRD" },
    { group: "인사/고용", name: "이직률", description: "연간 퇴사율(자발적 퇴직 포함)", reason: "조직 안정성 및 인재 유지 수준 측정 — GRI 401 고용 공시 지표", criteria: "GRI" },
    { group: "인사/고용", name: "신규 채용률", description: "전체 인원 대비 신규 채용 비율", reason: "조직 성장성 및 고용 창출 기여 측정 — GRI 401 신규 채용 공시", criteria: "GRI" },
    { group: "인사/고용", name: "평균 근속연수", description: "임직원 평균 근속기간", reason: "인력 유지 및 숙련 인력 보유 수준 측정 — GRI 401 고용 안정 지표", criteria: "GRI" },
    { group: "인사/고용", name: "정규직 비율", description: "전체 인원 중 정규직 비중", reason: "고용 안정성의 핵심 지표 — GRI 102 고용 형태 공시 필수 항목", criteria: "GRI" },
    { group: "인사/고용", name: "초과근로시간", description: "임직원 1인당 연평균 연장 근무 시간", reason: "과로·번아웃 리스크 관리 — CSRD ESRS S1 근로조건 공시 요구 항목", criteria: "CSRD" },
    { group: "인사/고용", name: "직원 만족도", description: "정기 설문을 통한 조직 만족도", reason: "조직 몰입도·생산성 예측 선행 지표 — SASB 인적자본 관리 핵심", criteria: "SASB" },
    { group: "인사/고용", name: "정규직 전환율", description: "비정규직의 정규직 전환 비율", reason: "비정규직 고용 안정성 개선 이행 측정 — K-ESG 사회 핵심 항목", criteria: "K-ESG" },
    { group: "인사/고용", name: "장기근속자 비율", description: "일정 기간(5년·10년) 이상 근속자 비율", reason: "조직 안정성 및 숙련 인력 보유 수준 — K-ESG 인력 관리 지표", criteria: "K-ESG" },
    { group: "인사/고용", name: "청년 고용 비율", description: "전체 채용 중 청년(만 15~34세) 비중", reason: "정부 청년고용촉진 정책 이행 및 사회적 책임 측정 — K-ESG", criteria: "K-ESG" },
    { group: "인사/고용", name: "고령자 고용 비율", description: "전체 인원 중 고령자(만 55세 이상) 비중", reason: "사회적 책임으로서 고령자 경제 참여 지원 기여도 — K-ESG", criteria: "K-ESG" },
    // 다양성/포용성(DEI)
    { group: "다양성/포용성(DEI)", name: "여성 고용 비율", description: "전체 직원 중 여성 비율", reason: "성별 다양성의 기본 공시 지표 — GRI 405 포용성 측정 핵심", criteria: "GRI" },
    { group: "다양성/포용성(DEI)", name: "여성 관리자 비율", description: "전체 관리직 중 여성 리더 비율", reason: "리더십 성평등 측정 — GRI 405·CSRD ESRS S1 핵심 공시 요구 항목", criteria: "GRI" },
    { group: "다양성/포용성(DEI)", name: "장애인 고용 비율", description: "전체 인원 중 장애인 비율", reason: "장애인고용촉진법 준수 여부 측정 — K-ESG 법정 의무 지표", criteria: "K-ESG" },
    { group: "다양성/포용성(DEI)", name: "외국인 근로자 비율", description: "전체 인원 중 외국인 비율", reason: "글로벌 인력 다양성 수준 측정 — GRI 405 포용성·다문화 지표", criteria: "GRI" },
    { group: "다양성/포용성(DEI)", name: "연령 다양성", description: "연령대별 인원 구성 비율", reason: "세대 간 균형 인력 구성 측정 — GRI 405 조직 다양성 공시 항목", criteria: "GRI" },
    { group: "다양성/포용성(DEI)", name: "성별 임금 격차", description: "남녀 임금 차이 비율(동일 직군 기준)", reason: "동일노동 동일임금 원칙 이행 여부 — GRI 405·CSRD ESRS S1 핵심 공시", criteria: "GRI, CSRD" },
    { group: "다양성/포용성(DEI)", name: "관리자 다양성 비율", description: "다양한 배경(성별·연령·국적)의 관리자 구성 비율", reason: "다양한 배경의 의사결정 참여 보장 — CSRD 조직 다양성 수준 평가", criteria: "CSRD" },
    // 노동/인권
    { group: "노동/인권", name: "고충 신고 건수", description: "내부 고충처리 신고 건수", reason: "임직원 불만 조기 식별 채널 가동 수준 — GRI 402 조직 리스크 관리", criteria: "GRI" },
    { group: "노동/인권", name: "고충 해결율", description: "접수된 고충 건 중 해결 비율", reason: "고충처리 채널의 실효성 측정 — GRI 402 구제 메커니즘 이행 지표", criteria: "GRI" },
    { group: "노동/인권", name: "노동법 위반 건수", description: "노동 관련 법규 위반 사례 건수", reason: "노동 관련 법규 준수 현황 — GRI 407 규제 리스크 실현 수준 측정", criteria: "GRI" },
    { group: "노동/인권", name: "아동노동 발생 여부", description: "아동노동 발생 여부 (사업장 및 공급망 포함)", reason: "ILO 협약·UN 인권 원칙 이행 여부 — EcoVadis·GRI 필수 ESG 항목", criteria: "EcoVadis, GRI" },
    { group: "노동/인권", name: "강제노동 발생 여부", description: "강제노동·강요 노동 발생 여부", reason: "ILO 협약·현대판 노예제 방지 이행 — EcoVadis·GRI 필수 인권 지표", criteria: "EcoVadis, GRI" },
    { group: "노동/인권", name: "인권 리스크 평가율", description: "인권 리스크 평가를 받은 사업장·공급망 비율", reason: "CSRD ESRS S2 — 공급망 포함 인권 실사 이행 수준 측정", criteria: "CSRD" },
    { group: "노동/인권", name: "인권 교육 이수율", description: "인권 관련 교육 참여율", reason: "인권 침해 예방 역량 구축의 선행 지표 — EcoVadis 인권 관리 핵심", criteria: "EcoVadis" },
    { group: "노동/인권", name: "노조 가입률", description: "노동조합 참여율", reason: "결사의 자유 및 단체교섭권 이행 수준 — GRI 407 노동 기본권 지표", criteria: "GRI" },
    { group: "노동/인권", name: "인권 정책 수립 여부", description: "인권 정책 문서 존재 여부", reason: "인권 경영의 제도적 기반 구비 여부 — K-ESG 인권 관리 필수 항목", criteria: "K-ESG" },
    { group: "노동/인권", name: "인권 실사 체계 여부", description: "인권 실사 프로세스 운영 여부", reason: "EU 공급망 실사법(CSDDD) 선제 대응 관리체계 — K-ESG", criteria: "K-ESG" },
    { group: "노동/인권", name: "인권 위반 대응 프로세스", description: "인권 위반 발생 시 대응 체계 구비 여부", reason: "인권 침해 발생 시 구제·시정 체계의 실효성 — K-ESG 리스크 관리", criteria: "K-ESG" },
    { group: "노동/인권", name: "익명 신고 시스템 여부", description: "내부 익명 신고 시스템 운영 여부", reason: "내부 고발자 보호 및 조기 경보 체계 구비 — K-ESG 필수 운영 요소", criteria: "K-ESG" },
    // 공급망/협력사
    { group: "공급망/협력사", name: "공급망 인권 실사", description: "공급망 인권 리스크 실사 수행 여부 및 범위", reason: "EU CSDDD·GRI 414 — 공급망 인권 리스크 실사 이행 범위 및 깊이 측정", criteria: "GRI, EcoVadis" },
    { group: "공급망/협력사", name: "협력사 안전 관리", description: "협력사 안전 점검·관리 수준", reason: "산업안전보건법 확대 적용 대응 — EcoVadis 공급망 안전 관리 평가", criteria: "EcoVadis" },
    { group: "공급망/협력사", name: "공급망 ESG 평가율", description: "ESG 평가를 완료한 공급업체 비율", reason: "공급망 ESG 리스크 파악의 출발점 — EcoVadis 공급망 관리 핵심 지표", criteria: "EcoVadis" },
    { group: "공급망/협력사", name: "공급망 감사율", description: "정기 감사를 수행한 공급업체 비율", reason: "평가 결과 현장 검증으로 신뢰성 확보 — EcoVadis 공급망 실사 지표", criteria: "EcoVadis" },
    { group: "공급망/협력사", name: "공급망 개선 완료율", description: "지적 사항에 대한 시정조치 완료 비율", reason: "지적 사항 이행의 실효성 측정 — CSRD 공급망 개선 성과 지표", criteria: "CSRD" },
    { group: "공급망/협력사", name: "고위험 협력사 비율", description: "ESG 고위험 등급 공급업체 비율", reason: "공급망 리스크 집중 관리 대상 규모 파악 — CSRD 리스크 공시", criteria: "CSRD" },
    { group: "공급망/협력사", name: "협력사 사고 건수", description: "협력사에서 발생한 안전·환경 사고 건수", reason: "협력사 ESG 사고의 브랜드·법적 파급 리스크 측정 — GRI 확장 ESG", criteria: "GRI" },
    { group: "공급망/협력사", name: "협력사 ESG 교육 여부", description: "협력사 대상 ESG 교육 제공 여부", reason: "공급망 전반 ESG 역량 강화 및 ESG 가치 확산 — K-ESG", criteria: "K-ESG" },
    { group: "공급망/협력사", name: "협력사 계약 ESG 반영 여부", description: "협력사 계약서 내 ESG 요건 반영 여부", reason: "계약을 통한 ESG 요건 구속력 부여 — K-ESG 실질적 ESG 이행 지표", criteria: "K-ESG" },
    { group: "공급망/협력사", name: "협력사 ESG 점검 여부", description: "협력사 현장 ESG 점검 수행 여부", reason: "서면 평가를 넘어선 현장 관리 수준 확인 — K-ESG 공급망 관리", criteria: "K-ESG" },
    // 교육/조직문화
    { group: "교육/조직문화", name: "교육훈련 시간", description: "임직원 1인당 연평균 총 교육시간", reason: "인적자본 투자의 기본 지표 — GRI 404-1 인력 개발 공시 핵심 항목", criteria: "GRI" },
    { group: "교육/조직문화", name: "교육 참여율", description: "전체 임직원 교육 참여 비율", reason: "교육 제도 실효성 및 접근성 측정 — GRI 404 학습 기회 공시", criteria: "GRI" },
    { group: "교육/조직문화", name: "교육 투자 비용", description: "교육·훈련에 투입된 비용 규모", reason: "인재 육성 투자의 재무적 규모 측정 — GRI 404 인적자본 투자 지표", criteria: "GRI" },
    { group: "교육/조직문화", name: "내부 승진율", description: "전체 승진 중 내부 승진 비율", reason: "내부 성장 기회 제공 수준 — GRI 404 조직 내부 인재 활용도 지표", criteria: "GRI" },
    { group: "교육/조직문화", name: "직원 참여율", description: "조직 내 참여도(인게이지먼트) 지수", reason: "조직 몰입도와 생산성의 선행 지표 — SASB 인적자본 관리 핵심", criteria: "SASB" },
    { group: "교육/조직문화", name: "유연근무제 도입 여부", description: "재택·시차출퇴근 등 유연근무 제도 운영 여부", reason: "일·생활 균형 지원 및 우수 인재 유치 — K-ESG 근무환경 개선 지표", criteria: "K-ESG" },
    { group: "교육/조직문화", name: "육아휴직 사용률", description: "육아휴직 사용 임직원 비율", reason: "가족친화 제도의 실질 이용률 측정 — K-ESG 사회적 가치 지표", criteria: "K-ESG" },
    { group: "교육/조직문화", name: "건강관리 프로그램 여부", description: "임직원 건강관리 프로그램 운영 여부", reason: "임직원 웰빙 관리 체계의 구비 여부 — K-ESG 복지 수준 지표", criteria: "K-ESG" },
    // 고객/사회 영향
    { group: "고객/사회 영향", name: "고객 만족도", description: "제품·서비스에 대한 고객 만족 수준", reason: "서비스 품질 및 장기 고객 신뢰 측정 — SASB 고객 관계 관리 핵심", criteria: "SASB" },
    { group: "고객/사회 영향", name: "고객 불만 건수", description: "제품·서비스 관련 클레임 건수", reason: "제품·서비스 품질 리스크의 실현 수준 — SASB 고객 불만 처리 지표", criteria: "SASB" },
    { group: "고객/사회 영향", name: "제품 안전 사고", description: "제품 결함으로 인한 안전 사고 건수", reason: "소비자 안전 및 제조물책임 리스크 관리 — SASB 제조업 핵심 공시", criteria: "SASB" },
    { group: "고객/사회 영향", name: "지역사회 투자", description: "지역사회 사회공헌 투자 금액", reason: "사회적 허가 유지 및 CSV 가치 창출 기여 — GRI 203 기본 공시 항목", criteria: "GRI" },
    { group: "고객/사회 영향", name: "지역사회 영향 평가", description: "사업 활동의 사회 영향 분석 수행 여부", reason: "사업의 부정적 사회 영향 체계적 분석 — CSRD ESRS S3 요구 항목", criteria: "CSRD" },
    { group: "고객/사회 영향", name: "사회공헌 참여율", description: "임직원 사회공헌 활동 참여 수준", reason: "임직원의 사회적 가치 실천 참여 — GRI 413 지역사회 관여 지표", criteria: "GRI" },
    { group: "고객/사회 영향", name: "지역사회 고용 비율", description: "지역 인력 채용 비중", reason: "지역 경제 기여 및 사회적 가치 창출 측정 — K-ESG 지역 기여 지표", criteria: "K-ESG" },
    { group: "고객/사회 영향", name: "지역사회 협력 프로그램", description: "지역사회와의 협력 활동 건수 또는 예산", reason: "지역사회와의 파트너십 형성 및 사회적 가치 창출 — K-ESG", criteria: "K-ESG" },
    { group: "고객/사회 영향", name: "사회공헌 지속성", description: "사회공헌 활동의 지속적 운영 여부", reason: "일회성이 아닌 지속적 사회공헌 체계 구축 여부 — K-ESG 지속가능성", criteria: "K-ESG" },
  ],
  governance: [
    // 이사회/지배구조
    { group: "이사회/지배구조", name: "이사회 구성원 수", description: "전체 이사회 인원 수", reason: "이사회 규모의 적정성 판단 — GRI 102·CSRD 지배구조 기본 공시 항목", criteria: "GRI, CSRD" },
    { group: "이사회/지배구조", name: "사외이사 비율", description: "이사회 중 독립 이사(사외이사) 비율", reason: "경영 감시 독립성 확보 수준 측정 — GRI 405·CSRD 지배구조 핵심 요구", criteria: "GRI, CSRD" },
    { group: "이사회/지배구조", name: "여성 이사 비율", description: "이사회 내 여성 이사 비율", reason: "이사회 성평등 다양성 수준 — GRI 405·CSRD ESRS G1 공시 필수 항목", criteria: "GRI, CSRD" },
    { group: "이사회/지배구조", name: "이사회 출석률", description: "이사회 회의 평균 참여율", reason: "이사회 실질 운영 충실도 측정 — GRI 102 이사회 활동 참여도 공시", criteria: "GRI" },
    { group: "이사회/지배구조", name: "이사회 개최 횟수", description: "연간 이사회 회의 개최 수", reason: "이사회 활동의 충실성 및 감독 기능 수준 — GRI 102 지배구조 공시", criteria: "GRI" },
    { group: "이사회/지배구조", name: "ESG 위원회 존재 여부", description: "이사회 내 ESG 위원회 구성 여부", reason: "ESG 책임의 이사회 내재화 수준 — CSRD·K-ESG 지배구조 거버넌스 핵심", criteria: "CSRD, K-ESG" },
    { group: "이사회/지배구조", name: "이사회 ESG 교육 여부", description: "이사회 대상 ESG 교육 수행 여부", reason: "이사회의 ESG 전문성 및 감독 역량 확보 — K-ESG 이사회 역량 지표", criteria: "K-ESG" },
    // 윤리/반부패
    { group: "윤리/반부패", name: "윤리강령 존재 여부", description: "임직원 행동 윤리 규정 존재 여부", reason: "윤리 경영의 제도적 기반 문서 — GRI 205·EcoVadis 윤리 관리 필수 요건", criteria: "GRI, EcoVadis" },
    { group: "윤리/반부패", name: "반부패 정책 존재 여부", description: "뇌물·부패 방지 정책 수립 여부", reason: "UN UNGC 10원칙 이행의 핵심 — GRI 205·EcoVadis 반부패 관리 필수 정책", criteria: "GRI, EcoVadis" },
    { group: "윤리/반부패", name: "반부패 교육 이수율", description: "반부패 관련 교육 참여 비율", reason: "부패 예방 인식 제고의 선행 지표 — EcoVadis 반부패 관리 수준 측정", criteria: "EcoVadis" },
    { group: "윤리/반부패", name: "윤리 위반 건수", description: "부패·비리 발생 건수", reason: "부패·비리 리스크의 실현 수준 측정 — GRI 205-3 핵심 공시 항목", criteria: "GRI" },
    { group: "윤리/반부패", name: "법규 위반 건수", description: "법적 위반 사례 발생 건수", reason: "컴플라이언스 위반의 법적 리스크 현실화 수준 — GRI 206 규제 대응", criteria: "GRI" },
    { group: "윤리/반부패", name: "벌금 및 제재 금액", description: "법규 위반으로 부과된 벌금 총액", reason: "법규 위반의 재무적 파급 영향 측정 — GRI 207 부과금 공시 항목", criteria: "GRI" },
    { group: "윤리/반부패", name: "내부 신고 시스템 여부", description: "내부 익명 신고 채널 존재 여부", reason: "내부 고발자 보호 및 조기 경보 채널 — EcoVadis·K-ESG 필수 운영 체계", criteria: "EcoVadis, K-ESG" },
    { group: "윤리/반부패", name: "내부 신고 건수", description: "내부 신고 발생 건수", reason: "조직 내 윤리 리스크의 조기 신호 탐지 — GRI 205 조직 리스크 지표", criteria: "GRI" },
    { group: "윤리/반부패", name: "신고 처리 완료율", description: "접수된 신고의 처리 완료 비율", reason: "신고 채널의 실효성 입증 — GRI 205 구제 메커니즘 이행 수준", criteria: "GRI" },
    // 정보보안/데이터 보호
    { group: "정보보안/데이터 보호", name: "정보보안 사고 건수", description: "보안 사고 발생 건수", reason: "사이버 리스크 현실화 수준 측정 — GRI·CSRD 디지털 리스크 핵심 공시", criteria: "GRI, CSRD" },
    { group: "정보보안/데이터 보호", name: "개인정보 유출 건수", description: "개인정보 침해 사고 건수", reason: "GDPR·개인정보보호법 위반 리스크 측정 — CSRD 규제 대응 공시 항목", criteria: "CSRD" },
    { group: "정보보안/데이터 보호", name: "보안 교육 이수율", description: "임직원 보안 교육 참여율", reason: "내부자 위협 예방을 위한 인식 제고 — EcoVadis 정보보안 관리 핵심", criteria: "EcoVadis" },
    { group: "정보보안/데이터 보호", name: "보안 인증 보유 여부", description: "ISO27001 등 보안 인증 보유 여부", reason: "국제 보안 기준 충족 수준 공인 — GRI·EcoVadis 정보보안 신뢰성 지표", criteria: "GRI, EcoVadis" },
    { group: "정보보안/데이터 보호", name: "접근권한 관리 수준", description: "시스템 접근 권한 통제 수준", reason: "내부통제의 핵심 보안 요소 관리 수준 — CSRD 내부통제 KPI", criteria: "CSRD" },
    { group: "정보보안/데이터 보호", name: "데이터 보호 정책 존재 여부", description: "데이터 보호 정책 문서 존재 여부", reason: "개인정보 처리의 법적·제도적 기반 구비 — K-ESG 데이터 보호 체계", criteria: "K-ESG" },
    // 리스크 관리/내부통제
    { group: "리스크 관리/내부통제", name: "리스크 식별 건수", description: "식별·등록된 리스크 수", reason: "전사 리스크 관리 프로세스 가동 수준 — TCFD·CSRD 리스크 공시 기반", criteria: "TCFD, CSRD" },
    { group: "리스크 관리/내부통제", name: "리스크 대응 완료율", description: "식별된 리스크에 대한 대응 완료 비율", reason: "식별된 리스크의 실질 관리 이행 수준 — TCFD 리스크 관리 실질 KPI", criteria: "TCFD" },
    { group: "리스크 관리/내부통제", name: "내부 감사 수행률", description: "계획 대비 내부 감사 수행 비율", reason: "내부통제의 독립적 검증 기능 충실도 — GRI 205 내부통제 핵심 지표", criteria: "GRI" },
    { group: "리스크 관리/내부통제", name: "내부통제 시스템 존재 여부", description: "내부통제 체계 구축 여부", reason: "재무·비재무 리스크 관리의 제도적 기반 — CSRD·K-ESG 필수 요건", criteria: "CSRD, K-ESG" },
    { group: "리스크 관리/내부통제", name: "컴플라이언스 점검 수행률", description: "준법 점검 수행율", reason: "준법 관리 활동의 실질 이행 수준 측정 — GRI 준법 경영 지표", criteria: "GRI" },
    { group: "리스크 관리/내부통제", name: "리스크 평가 체계 존재 여부", description: "리스크 관리 프로세스 운영 여부", reason: "체계적 리스크 관리 프로세스 제도화 여부 — K-ESG 관리체계 KPI", criteria: "K-ESG" },
    { group: "리스크 관리/내부통제", name: "중대 리스크 보고 여부", description: "주요 리스크의 이사회 보고 체계 여부", reason: "이사회의 리스크 감시 기능 활성화 수준 — CSRD 거버넌스 공시", criteria: "CSRD" },
    // 공시/투명성
    { group: "공시/투명성", name: "ESG 보고서 발간 여부", description: "연간 ESG 보고서 발행 여부", reason: "ESG 공시의 가장 기본 요건 — GRI·CSRD 투명성 기반의 출발점", criteria: "GRI, CSRD" },
    { group: "공시/투명성", name: "ESG 데이터 공개율", description: "공개된 ESG 데이터 비율", reason: "정량 데이터 공개 범위의 충실도 — CSRD 투명성 수준 측정 지표", criteria: "CSRD" },
    { group: "공시/투명성", name: "공시 적시성", description: "공시 지연 발생 여부", reason: "투자자 정보 수요의 적시 충족 여부 — CSRD 공시 의무 이행 지표", criteria: "CSRD" },
    { group: "공시/투명성", name: "외부 검증 여부", description: "ESG 데이터 제3자 검증 수행 여부", reason: "ESG 데이터 신뢰성의 독립적 확보 — GRI·CSRD 제3자 검증 요구 항목", criteria: "GRI, CSRD" },
    { group: "공시/투명성", name: "공시 오류 건수", description: "공시 데이터 오류 발생 건수", reason: "공시 데이터 정확성 및 신뢰성 관리 — CSRD 데이터 품질 관리 지표", criteria: "CSRD" },
    // 공급망 거버넌스
    { group: "공급망 거버넌스", name: "공급망 ESG 평가율", description: "ESG 평가를 완료한 공급업체 비율", reason: "공급망 ESG 리스크 파악의 출발점 — EcoVadis 공급망 거버넌스 핵심", criteria: "EcoVadis" },
    { group: "공급망 거버넌스", name: "공급망 리스크 평가율", description: "리스크 평가를 수행한 공급망 비율", reason: "EU CSDDD 공급망 실사 이행 수준 측정 — CSRD 공급망 관리 공시", criteria: "CSRD" },
    { group: "공급망 거버넌스", name: "협력사 행동강령 준수율", description: "협력사의 행동강령 정책 준수 비율", reason: "협력사 윤리 기준 확산 및 이행 수준 — GRI 414 공급망 윤리 확산 지표", criteria: "GRI" },
    { group: "공급망 거버넌스", name: "협력사 위반 건수", description: "협력사 ESG 위반 사례 건수", reason: "공급망 ESG 위반의 평판·법적 파급 리스크 — GRI 공급망 거버넌스 지표", criteria: "GRI" },
    { group: "공급망 거버넌스", name: "협력사 ESG 계약 반영 여부", description: "협력사 계약서 내 ESG 요건 반영 여부", reason: "계약 조항을 통한 ESG 구속력 부여 — K-ESG 공급망 실질적 ESG 이행", criteria: "K-ESG" },
    { group: "공급망 거버넌스", name: "협력사 교육 여부", description: "협력사 대상 ESG 교육 제공 여부", reason: "공급망 전반 ESG 역량 강화 및 ESG 가치 확산 체계 — K-ESG", criteria: "K-ESG" },
    // 정책/시스템
    { group: "정책/시스템", name: "ESG 정책 수립 여부", description: "전사 ESG 정책 문서 존재 여부", reason: "전사 ESG 추진 방향의 법적·제도적 기반 확보 — K-ESG 필수 항목", criteria: "K-ESG" },
    { group: "정책/시스템", name: "윤리경영 시스템 구축 여부", description: "윤리경영 관리 시스템 구축 여부", reason: "윤리 경영 실행 체계의 제도화 수준 — K-ESG 관리체계 핵심 지표", criteria: "K-ESG" },
    { group: "정책/시스템", name: "내부 규정 관리 수준", description: "내부 규정 관리 체계 운영 수준", reason: "조직 내 규정 준수 및 통제 체계 충실도 — K-ESG 조직 통제 지표", criteria: "K-ESG" },
    { group: "정책/시스템", name: "정책 업데이트 주기", description: "ESG 정책 개정 주기", reason: "ESG 환경 변화에 대응한 정책 적시 개정 여부 — K-ESG 최신성 유지", criteria: "K-ESG" },
    { group: "정책/시스템", name: "경영진 ESG KPI 반영 여부", description: "경영진 성과평가에 ESG KPI 연계 여부", reason: "ESG를 경영진 책임 지표로 연결해 실행력 확보 — K-ESG 핵심 거버넌스", criteria: "K-ESG" },
    { group: "정책/시스템", name: "ESG 담당 조직 존재 여부", description: "전담 ESG 조직 또는 담당자 존재 여부", reason: "ESG 추진의 조직적 기반 및 책임 체계 구비 — K-ESG 운영 체계 지표", criteria: "K-ESG" },
  ],
};

/** 선택된 프레임워크 기반 KPI 추천 — criteria·reason 필드에서 프레임워크명 매칭 */
export function getKpiRecommendationsByFrameworks(
  selectedFrameworks: string[]
): { environmental: string[]; social: string[]; governance: string[] } {
  if (selectedFrameworks.length === 0) return { environmental: [], social: [], governance: [] };
  const matches = (item: KpiItem) => {
    // 1. frameworks 배열이 있으면 명시적 매칭 (우선)
    if (item.frameworks && item.frameworks.length > 0) {
      return selectedFrameworks.some((fw) => item.frameworks!.includes(fw));
    }
    // 2. fallback: 텍스트 매칭
    return selectedFrameworks.some((fw) => item.criteria.includes(fw) || item.reason.includes(fw));
  };
  return {
    environmental: ALL_KPI.environmental.filter(matches).map((k) => k.name),
    social: ALL_KPI.social.filter(matches).map((k) => k.name),
    governance: ALL_KPI.governance.filter(matches).map((k) => k.name),
  };
}

/** KpiItem 하나에 대해 매칭되는 프레임워크 목록 반환 */
export function getMatchingFrameworks(item: KpiItem, selectedFrameworks: string[]): string[] {
  return selectedFrameworks.filter((fw) => {
    if (item.frameworks && item.frameworks.length > 0) {
      return item.frameworks.includes(fw);
    }
    return item.criteria.includes(fw) || item.reason.includes(fw);
  });
}

export const SCOPE3_GROUPS = [
  {
    key: "upstream",
    label: "Upstream — 상류",
    desc: "Cat. 1–8 · 공급망·운영 관련 간접 배출",
    categories: [
      "구매 제품 및 서비스",
      "자본재",
      "연료·에너지 관련",
      "상류 운송·물류",
      "사업장 폐기물",
      "출장",
      "통근",
      "임차 자산(상류)",
    ],
  },
  {
    key: "downstream",
    label: "Downstream — 하류",
    desc: "Cat. 9–15 · 판매 제품·투자 관련 간접 배출",
    categories: [
      "하류 운송·물류",
      "판매 제품 가공",
      "판매 제품 사용",
      "판매 제품 폐기",
      "임차 자산(하류)",
      "프랜차이즈",
      "투자 포트폴리오",
    ],
  },
] as const;

export const ALL_SCOPE3_CATEGORIES = SCOPE3_GROUPS.flatMap((g) => g.categories);

export const FRAMEWORKS = [
  {
    id: "GRI",
    name: "GRI (Global Reporting Initiative)",
    description: "글로벌 표준 ESG 공시 프레임워크. 가장 널리 사용됨",
    badge: "가장 범용",
  },
  {
    id: "ISSB",
    name: "ISSB (S1/S2)",
    description: "IFRS 기반 재무적 중요성 중심 공시. 투자자 대상",
    badge: "의무화 추세",
  },
  {
    id: "CDP",
    name: "CDP (Carbon Disclosure Project)",
    description: "기후변화·용수·산림 특화 공시 플랫폼",
    badge: "탄소 특화",
  },
  {
    id: "K-ESG",
    name: "K-ESG",
    description: "한국형 ESG 공시 기준. 국내 상장사 중심",
    badge: "국내 표준",
  },
  {
    id: "TCFD",
    name: "TCFD",
    description: "기후 관련 재무 공시 권고안",
    badge: "기후 리스크",
  },
];

/** 산업군 선택 시 AI 추천 반환 (실제 Claude API 호출로 교체 가능) */
/** ALL_KPI에 실제 존재하는 이름만 필터링하여 추천 반환 */
export function getAiRecommendation(industry: string): AiRecommendation | null {
  const rec = INDUSTRY_RECOMMENDATIONS[industry] ?? INDUSTRY_RECOMMENDATIONS["기타"] ?? null;
  if (!rec) return null;

  const validEnv = new Set(ALL_KPI.environmental.map((k) => k.name));
  const validSoc = new Set(ALL_KPI.social.map((k) => k.name));
  const validGov = new Set(ALL_KPI.governance.map((k) => k.name));

  return {
    ...rec,
    kpi: {
      environmental: rec.kpi.environmental.filter((n) => validEnv.has(n)),
      social: rec.kpi.social.filter((n) => validSoc.has(n)),
      governance: rec.kpi.governance.filter((n) => validGov.has(n)),
    },
  };
}
