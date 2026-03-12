# ENVIO – ESG & Carbon Management Platform

Premium enterprise SaaS dashboard for ESG carbon management. Frontend-only implementation with mock data and a clear path to FastAPI backend integration.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui** (Radix-based components)
- **Recharts** for charts
- **Zustand** for client state
- **TanStack React Query** for server state (ready for API swap)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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
| `npm run dev:turbo` | Turbopack 개발 서버 (Windows 파일 잠금 완화) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 빌드 실행 |
| `npm run lint` | ESLint |

## 주요 기능

| 모듈 | 경로 | 설명 |
|------|------|------|
| 대시보드 | `/dashboard` | KPI 요약, AI 인사이트, 핵심 지표 |
| 배출량 분석 | `/analytics` | Scope 1/2/3 배출량 분석, 이상 탐지, 시나리오 |
| 탄소 플로우 | `/carbon-flow` | 탄소 흐름 시각화 |
| ESG 데이터 | `/esg` | 환경·사회·거버넌스 데이터 입력 및 관리 |
| 데이터 관리 | `/data` | 배출량·ESG·공급망 데이터, 검증, 승인 |
| 공급망 포털 | `/scope3`, `/data/supply-chain` | 협력사 관리, Scope 3, ESG 평가 |
| KPI | `/kpi` | KPI 마스터, 목표, 성과, 커버리지 |
| 보고서 | `/reports` | ESG 보고서, 프레임워크(GRI/CSRD/ISSB/K-ESG), 감사 추적 |
| 중요성 평가 | `/materiality` | 중요성 이슈, 매트릭스, 이해관계자 |
| 감축 시뮬레이터 | `/simulator` | 감축 전략 시뮬레이션, 프로젝트 관리 |
| 실행 계획 | `/action` | 로드맵, 목표, 프로젝트, 크레딧 |
| 규정 준수 | `/compliance` | 규정 준수 현황 |
| 설정 | `/settings` | 조직, 사용자, 역할, 통합, 프레임워크 등 |

## Folder Structure

```
src/
├── app/                        # App Router pages and layout
│   ├── action/                 # 실행 계획 (roadmap, targets, projects, credits)
│   ├── analytics/              # 배출량 분석 (scope1/2/3, scenarios, anomalies)
│   ├── api/                    # API routes (공급망 vendors)
│   ├── carbon-flow/            # 탄소 플로우
│   ├── compliance/             # 규정 준수 현황
│   ├── dashboard/              # 메인 대시보드 + 데이터 관리/공급망 서브 페이지
│   ├── data/                   # 데이터 관리
│   │   ├── approval/           # 승인 관리
│   │   ├── emissions/          # 배출량 데이터 (scope1/2/3)
│   │   ├── esg/                # ESG 데이터 (environment/governance/social)
│   │   ├── integrations/       # ERP/Excel/IoT 연동
│   │   ├── supply-chain/       # 공급망 데이터 (vendors, assessment, risk 등)
│   │   └── verification/       # 데이터 검증
│   ├── esg/                    # ESG 페이지 (environment, governance, social, calendar, tasks)
│   ├── insights/               # AI 인사이트 (anomalies, reports, scenarios)
│   ├── kpi/                    # KPI 관리
│   ├── materiality/            # 중요성 평가
│   ├── reports/                # 보고서 (frameworks, templates, audit-trail, attachments)
│   ├── scope3/                 # 공급망 포털 (vendors, invite, submissions 등)
│   ├── settings/               # 시스템 설정
│   └── simulator/              # 감축 시뮬레이터
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
│   ├── portal/                 # 공급망 포털 컴포넌트 (legacy)
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
│   │   └── ...
│   ├── navigation.ts           # 네비게이션 구조 정의
│   └── utils.ts
├── services/
│   └── api/                    # API 레이어 (백엔드 연동 시 여기만 교체)
├── stores/                     # Zustand stores
│   └── ui-store.ts
└── types/
    ├── index.ts                # 공통 TypeScript 타입
    ├── approval-data.ts
    ├── environment-data.ts
    ├── governance-data.ts
    ├── social-data.ts
    ├── supplier-portal.ts
    └── validation-data.ts
```

## 공급망 포털 (Supply Chain Portal)

상단 메뉴 **공급망 포털** 또는 `/scope3` 경로로 접근합니다.

| 경로 | 페이지 |
|------|--------|
| `/scope3` | 포털 대시보드 (요약 카드, Scope3 완성도 차트) |
| `/scope3/vendors` | 협력사 관리 (테이블, 검색/필터, 초대·재발송 모달) |
| `/scope3/invite` | 협력사 초대 (발송 목록, 상태, 재발송) |
| `/scope3/submissions` | ESG/탄소 데이터 제출 현황 |
| `/scope3/categories` | Scope 3 카테고리 관리 |
| `/scope3/assessment` | 협력사 ESG 평가 (ESG 점수 카드, 리스크 뱃지) |
| `/scope3/verification` | 데이터 검증 (워크플로우, 증빙 파일 목록) |
| `/scope3/settings` | 포털 설정 |

## ESG 데이터 관리

| 경로 | 페이지 |
|------|--------|
| `/esg/environment` | 환경 데이터 (온실가스, 에너지, 물, 폐기물) |
| `/esg/governance` | 거버넌스 데이터 (이사회, 윤리, 리스크) |
| `/esg/social` | 소셜 데이터 (인력, 안전, 다양성) |
| `/esg/calendar` | ESG 일정 관리 |
| `/esg/tasks` | ESG 과업 관리 |
| `/data/approval` | 데이터 승인 워크플로우 |
| `/data/verification` | 데이터 검증 |

## Backend Integration

- **Types** in `src/types/` are designed to mirror future FastAPI DTOs.
- **API layer** in `src/services/api/` currently returns mock data. Replace each function with `fetch('/api/...')` or your API client; components do not need to change.
- **React Query** is already used for all data; switch `queryFn` to your API and add error/retry as needed.

## Design

- Dark enterprise UI (Apple / Stripe / Linear inspired).
- CSS variables in `globals.css` for theming; `carbon-*` tokens for semantic colors.
- Desktop-first; layout is responsive.
