"use client";

import { DashboardSlot } from "@/app/dashboard-slot";

/** 대시보드 라우트: 클라이언트 전용으로 렌더해 서버 500 방지. 실제 UI는 ContentSwitcher → DashboardPageClient에서 표시 */
export default function DashboardRoutePage() {
  return <DashboardSlot />;
}
