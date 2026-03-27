/**
 * 산업군별 AI 추천 데이터
 * 실제 Claude AI 호출로 교체 가능한 구조로 설계
 */

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
      environmental: ["온실가스 배출량(Scope 1+2)", "에너지 사용량", "공급망 탄소(Scope 3)", "용수 사용량", "폐기물 발생량", "재생에너지 비율"],
      social: ["산업재해율", "여성 관리자 비율", "교육훈련 시간", "이직률", "공급망 인권 실사"],
      governance: ["ESG 위원회 설치", "공급망 실사", "반부패 정책", "이사회 다양성"],
    },
    frameworks: ["GRI", "ISSB", "CDP"],
    scope3Categories: ["구매 제품 및 서비스", "자본재", "상류 운송·물류", "출장", "통근", "판매 제품 사용"],
  },
  제조: {
    kpi: {
      environmental: ["온실가스 배출량(Scope 1+2)", "에너지 효율", "용수 사용량", "폐기물 재활용률", "대기오염물질 배출"],
      social: ["산업재해율", "직업병 발생률", "여성 고용 비율", "교육훈련 시간", "협력사 안전 관리"],
      governance: ["ESG 위원회", "공급망 실사", "환경 컴플라이언스", "반부패 정책"],
    },
    frameworks: ["GRI", "K-ESG", "CDP"],
    scope3Categories: ["구매 제품 및 서비스", "자본재", "상류 운송·물류", "폐기물", "출장", "통근"],
  },
  건설: {
    kpi: {
      environmental: ["온실가스 배출량", "건설 폐기물 재활용률", "에너지 사용량", "녹색건물 인증"],
      social: ["산업재해율", "협력사 안전관리", "지역사회 투자", "여성 고용 비율"],
      governance: ["ESG 위원회", "반부패 정책", "공급망 관리", "환경 인허가 준수"],
    },
    frameworks: ["GRI", "K-ESG"],
    scope3Categories: ["구매 제품 및 서비스", "자본재", "상류 운송·물류", "폐기물", "출장", "통근"],
  },
  "IT/소프트웨어": {
    kpi: {
      environmental: ["데이터센터 에너지(PUE)", "재생에너지 사용 비율", "전자폐기물 처리", "탄소중립 목표"],
      social: ["여성 개발자 비율", "이직률", "교육훈련 시간", "임직원 만족도", "공급망 인권"],
      governance: ["데이터 보안", "개인정보 보호", "이사회 다양성", "AI 윤리 정책"],
    },
    frameworks: ["GRI", "ISSB", "CDP"],
    scope3Categories: ["구매 제품 및 서비스", "출장", "통근", "클라우드 서비스"],
  },
  금융: {
    kpi: {
      environmental: ["녹색금융 비율", "탄소 포트폴리오", "친환경 대출 비중", "ESG 투자 비율"],
      social: ["금융 접근성", "여성 관리자 비율", "고객 만족도", "사회공헌 투자"],
      governance: ["이사회 독립성", "리스크 관리", "금융소비자 보호", "반부패 정책"],
    },
    frameworks: ["GRI", "ISSB", "TCFD"],
    scope3Categories: ["투자 포트폴리오", "출장", "통근"],
  },
  유통: {
    kpi: {
      environmental: ["포장재 감소율", "탄소 배출량", "물류 에너지 효율", "친환경 포장 비율"],
      social: ["산업재해율", "협력사 공정 거래", "여성 고용 비율", "고객 만족도"],
      governance: ["공급망 투명성", "반부패 정책", "개인정보 보호"],
    },
    frameworks: ["GRI", "K-ESG"],
    scope3Categories: ["구매 제품 및 서비스", "상류 운송·물류", "하류 운송·물류", "포장재", "출장", "통근"],
  },
  에너지: {
    kpi: {
      environmental: ["온실가스 배출량", "재생에너지 생산 비율", "에너지 손실률", "생태계 영향"],
      social: ["산업재해율", "지역사회 에너지 접근성", "고용 창출", "직업 훈련"],
      governance: ["기후 관련 리스크", "ESG 위원회", "에너지 규제 준수"],
    },
    frameworks: ["GRI", "ISSB", "CDP", "TCFD"],
    scope3Categories: ["구매 제품 및 서비스", "자본재", "연료·에너지 관련", "출장", "통근"],
  },
  화학: {
    kpi: {
      environmental: ["온실가스 배출량", "유해화학물질 배출", "용수 사용량", "폐수 처리율"],
      social: ["산업재해율", "화학물질 안전교육", "지역사회 영향", "협력사 안전관리"],
      governance: ["화학물질 규제 준수", "ESG 위원회", "공급망 실사"],
    },
    frameworks: ["GRI", "CDP", "K-ESG"],
    scope3Categories: ["구매 제품 및 서비스", "폐기물", "출장", "통근"],
  },
  식품: {
    kpi: {
      environmental: ["온실가스 배출량", "용수 사용량", "식품 폐기물 감소율", "친환경 포장"],
      social: ["식품 안전 사고율", "공급망 인권", "지역사회 농업 지원", "영양 접근성"],
      governance: ["식품 안전 규제 준수", "공급망 투명성", "반부패 정책"],
    },
    frameworks: ["GRI", "K-ESG"],
    scope3Categories: ["농산물 원료", "포장재", "상류 운송·물류", "식품 폐기물", "출장", "통근"],
  },
  기타: {
    kpi: {
      environmental: ["온실가스 배출량(Scope 1+2)", "에너지 사용량", "용수 사용량", "폐기물 발생량"],
      social: ["산업재해율", "여성 관리자 비율", "교육훈련 시간", "이직률"],
      governance: ["ESG 위원회 설치", "반부패 정책", "이사회 다양성"],
    },
    frameworks: ["GRI", "K-ESG"],
    scope3Categories: ["구매 제품 및 서비스", "출장", "통근"],
  },
};

export const ALL_KPI = {
  environmental: [
    "온실가스 배출량(Scope 1+2)",
    "공급망 탄소(Scope 3)",
    "에너지 사용량",
    "재생에너지 비율",
    "에너지 효율",
    "용수 사용량",
    "폐기물 발생량",
    "폐기물 재활용률",
    "대기오염물질 배출",
    "녹색건물 인증",
    "탄소중립 목표",
    "생물다양성 영향",
  ],
  social: [
    "산업재해율",
    "직업병 발생률",
    "여성 관리자 비율",
    "여성 고용 비율",
    "교육훈련 시간",
    "이직률",
    "임직원 만족도",
    "공급망 인권 실사",
    "협력사 안전 관리",
    "지역사회 투자",
    "고객 만족도",
  ],
  governance: [
    "ESG 위원회 설치",
    "이사회 다양성",
    "공급망 실사",
    "반부패 정책",
    "환경 컴플라이언스",
    "데이터 보안",
    "개인정보 보호",
    "리스크 관리",
    "금융소비자 보호",
    "AI 윤리 정책",
  ],
};

export const ALL_SCOPE3_CATEGORIES = [
  "구매 제품 및 서비스",
  "자본재",
  "연료·에너지 관련",
  "상류 운송·물류",
  "사업장 폐기물",
  "출장",
  "통근",
  "임차 자산(상류)",
  "하류 운송·물류",
  "판매 제품 가공",
  "판매 제품 사용",
  "판매 제품 폐기",
  "임차 자산(하류)",
  "프랜차이즈",
  "투자 포트폴리오",
];

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
export function getAiRecommendation(industry: string): AiRecommendation | null {
  return INDUSTRY_RECOMMENDATIONS[industry] ?? INDUSTRY_RECOMMENDATIONS["기타"] ?? null;
}
