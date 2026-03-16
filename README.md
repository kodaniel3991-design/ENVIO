# ENVIO – ESG & Carbon Management Platform

Premium enterprise SaaS dashboard for ESG and carbon management. Frontend-only implementation with mock data and a clear path to FastAPI backend integration.

## Tech Stack

| 영역 | 라이브러리 / 버전 |
|------|------------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.6 |
| Styling | Tailwind CSS 3.4 + shadcn/ui (Radix UI) |
| Charts | Recharts 2.13 |
| Client State | Zustand 5.0 |
| Server State | TanStack React Query 5.59 |
| Font | Pretendard Variable |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → `/dashboard` 로 자동 리다이렉트.

### 400/500 에러가 나올 때 (화면 비거나 Internal Server Error)

1. **우선 프로덕션으로 실행해 보기 (500 해결에 가장 확실)**
   ```bash
   npm run build
   npm run start
   ```

2. **개발 서버를 쓸 때**
   실행 중인 `npm run dev`를 `Ctrl+C`로 종료한 뒤:
   ```bash
   npm run dev:fresh
   ```
   기존 localhost 탭은 닫고 시크릿 창(Ctrl+Shift+N)에서 접속.

3. **`EADDRINUSE`(포트 사용 중)**
   - 다른 터미널에서 `Ctrl+C`로 서버 종료 후, 한 터미널에서만 `npm run dev:fresh` 실행.
   - 또는 (Windows) `netstat -ano | findstr :3000` → `taskkill /PID <숫자> /F` 로 프로세스 종료.

4. **계속 400/500이면**
   - `npm run dev:turbo` 로 실행 후 새 시크릿 창에서 접속.
   - `.next`를 안티바이러스·OneDrive 제외 목록에 넣거나, 프로젝트를 동기화 폴더 밖으로 옮겨 보기.

## Scripts

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 (port 3000) |
| `npm run dev:clean` | `.next` 삭제 후 dev 시작 (500 발생 시 권장) |
| `npm run dev:fresh` | `.next` 삭제 + node_modules 캐시 정리 후 dev 시작 |
| `npm run dev:turbo` | Turbopack 개발 서버 (Windows 파일 잠금 완화) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 빌드 실행 |
| `npm run lint` | ESLint |

## 주요 기능

| 모듈 | 경로 | 설명 |
|------|------|------|
| 대시보드 | `/dashboard` | KPI 요약, AI 인사이트, 핵심 지표 |
| 데이터 관리 | `/data` | 배출량·ESG·공급망 데이터, 검증, 승인 허브 |
| 배출량 | `/data/emissions/scope1\|2\|3` | Scope 1/2/3 배출량 분석 및 추적 |
| ESG 데이터 | `/data/esg/environment\|governance\|social` | 환경·사회·거버넌스 데이터 입력 및 관리 |
| 공급망 포털 | `/data/supply-chain` | 협력사 관리, ESG 평가, Scope 3 데이터 |
| 데이터 검증 | `/data/verification` | 데이터 유효성 검증 워크플로우 |
| 데이터 승인 | `/data/approval` | 데이터 승인 워크플로우 |
| 분석 | `/analytics` | 배출량 분석, 이상 탐지, 시나리오 |
| 탄소 플로우 | `/analytics/carbon-flow` | 탄소 흐름 시각화 |
| KPI | `/kpi` | KPI 마스터, 목표, 성과, 커버리지 |
| 보고서 | `/reports` | ESG 보고서, 프레임워크(GRI/CSRD/ISSB/K-ESG), 감사 추적 |
| 중요성 평가 | `/materiality` | 중요성 이슈, 매트릭스, 이해관계자 |
| 실행 계획 | `/action` | 감축 목표, 프로젝트, 로드맵, 크레딧 |
| 규정 준수 | `/compliance` | 규정 준수 현황 |
| 설정 | `/settings` | 조직, 사용자, 역할, 통합, 프레임워크 |

## Folder Structure

```
src/
├── app/                        # App Router pages and layout
│   ├── action/                 # 실행 계획 (roadmap, targets, projects, credits)
│   ├── analytics/              # 배출량 분석 (scenarios, anomalies, carbon-flow)
│   ├── api/                    # Next.js API routes (supply-chain vendors)
│   ├── compliance/             # 규정 준수 현황
│   ├── dashboard/              # 메인 대시보드
│   ├── data/                   # 데이터 관리 허브
│   │   ├── approval/           # 승인 관리
│   │   ├── emissions/          # 배출량 데이터 (scope1/scope2/scope3)
│   │   ├── esg/                # ESG 데이터 (environment/governance/social)
│   │   ├── integrations/       # ERP·Excel·IoT 연동
│   │   ├── supply-chain/       # 공급망 (vendors, assessment, risk, submissions 등)
│   │   └── verification/       # 데이터 검증
│   ├── kpi/                    # KPI 관리
│   ├── materiality/            # 중요성 평가
│   ├── reports/                # 보고서 (frameworks, templates, audit-trail, attachments)
│   └── settings/               # 시스템 설정
├── components/
│   ├── ai/                     # AI KPI 카드
│   ├── approval/               # 승인 워크플로우 컴포넌트
│   ├── common/                 # 공통 UI (SubNav, ErrorState 등)
│   ├── dashboard/              # 대시보드 전용 컴포넌트
│   ├── emissions/              # 배출량 컴포넌트
│   ├── environment-data/       # 환경 데이터 컴포넌트
│   ├── esg/                    # ESG 공통 컴포넌트
│   ├── governance-data/        # 거버넌스 데이터 컴포넌트
│   ├── kpi/                    # KPI 컴포넌트
│   ├── layout/                 # Sidebar, PageHeader, TopHeader, Breadcrumb
│   ├── materiality/            # 중요성 평가 컴포넌트
│   ├── reduction/              # 감축 KPI 컴포넌트
│   ├── scope1/                 # Scope 1 컴포넌트
│   ├── scope2/                 # Scope 2 컴포넌트
│   ├── scope3/                 # Scope 3 컴포넌트
│   ├── settings/               # 설정 컴포넌트
│   ├── social-data/            # 소셜 데이터 컴포넌트
│   ├── supplier-portal/        # 공급업체 포털 컴포넌트
│   ├── ui/                     # shadcn 기반 기본 컴포넌트
│   └── validation/             # 검증 워크플로우 컴포넌트
├── lib/
│   ├── format.ts               # 숫자/날짜 포맷 유틸
│   ├── mock/                   # Mock 데이터 (UI import 없음)
│   │   ├── approval-data.ts
│   │   ├── environment-data.ts
│   │   ├── governance-data.ts
│   │   ├── social-data.ts
│   │   ├── supplier-portal.ts
│   │   ├── supply-chain-portal.ts
│   │   ├── validation-data.ts
│   │   └── ...                 # 기타 mock 파일 (emissions, kpi, reports 등)
│   ├── navigation.ts           # 네비게이션 구조 정의 (한글 레이블 + 영문 경로)
│   └── utils.ts
├── services/
│   └── api/                    # API 레이어 (백엔드 연동 시 여기만 교체)
│       ├── index.ts            # 전체 서비스 export
│       ├── emissions.ts
│       ├── dashboard.ts
│       ├── esg.ts
│       ├── supply-chain.ts
│       ├── kpi.ts
│       ├── reports.ts
│       ├── compliance.ts
│       ├── users.ts
│       └── ...
├── stores/
│   └── ui-store.ts             # Zustand UI 상태 (사이드바, 테마 등)
└── types/
    ├── index.ts                # 공통 TypeScript 타입 (Scope, EmissionSummary 등)
    ├── approval-data.ts
    ├── environment-data.ts
    ├── governance-data.ts
    ├── social-data.ts
    ├── supplier-portal.ts
    └── validation-data.ts
```

## 공급망 포털 (Supply Chain Portal)

사이드 메뉴 **데이터 관리 → 공급망** 또는 `/data/supply-chain` 경로로 접근합니다.

| 경로 | 페이지 |
|------|--------|
| `/data/supply-chain` | 포털 대시보드 (요약 카드, Scope 3 완성도 차트) |
| `/data/supply-chain/vendors` | 협력사 관리 (테이블, 검색/필터, 초대·재발송 모달) |
| `/data/supply-chain/invite` | 협력사 초대 (발송 목록, 상태, 재발송) |
| `/data/supply-chain/submissions` | ESG/탄소 데이터 제출 현황 |
| `/data/supply-chain/categories` | Scope 3 카테고리 관리 |
| `/data/supply-chain/assessment` | 협력사 ESG 평가 (ESG 점수 카드, 리스크 뱃지) |
| `/data/supply-chain/verification` | 데이터 검증 (워크플로우, 증빙 파일 목록) |
| `/data/supply-chain/settings` | 포털 설정 |

## ESG 데이터 관리

사이드 메뉴 **데이터 관리 → ESG 데이터** 또는 `/data/esg` 경로로 접근합니다.

| 경로 | 페이지 |
|------|--------|
| `/data/esg/environment` | 환경 데이터 (온실가스, 에너지, 물, 폐기물) |
| `/data/esg/governance` | 거버넌스 데이터 (이사회, 윤리, 리스크) |
| `/data/esg/social` | 소셜 데이터 (인력, 안전, 다양성) |
| `/data/approval` | 데이터 승인 워크플로우 |
| `/data/verification` | 데이터 검증 |

## Route Redirects

이전 경로들은 `next.config.mjs`에서 새 경로로 자동 리다이렉트됩니다.

| 이전 경로 | 새 경로 |
|-----------|---------|
| `/` | `/dashboard` |
| `/esg/*` | `/data/esg/*` |
| `/scope3/*` | `/data/supply-chain/*` |
| `/analytics/scope*` | `/data/emissions/scope*` |
| `/insights/*` | `/analytics/*` |
| `/carbon-flow` | `/analytics/carbon-flow` |
| `/simulator/*` | `/action/*` |
| `/reports/esg-report` | `/reports/frameworks/gri` |

## Backend Integration

- **Types** in `src/types/` are designed to mirror future FastAPI DTOs.
- **API layer** in `src/services/api/` currently returns mock data. Replace each function with `fetch('/api/...')` or your API client; components do not need to change.
- **React Query** is already used for all data; switch `queryFn` to your API and add error/retry as needed.

## Design

- Dark enterprise UI (Apple / Stripe / Linear inspired).
- CSS variables in `globals.css` for theming; `carbon-*` tokens for semantic colors.
- Desktop-first; layout is responsive.
- Font: Pretendard Variable (woff2, locally hosted).
