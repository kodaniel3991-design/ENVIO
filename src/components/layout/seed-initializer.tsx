"use client";

import { useEffect, useRef } from "react";

/**
 * 앱 최초 로드 시 배출계수 시드 데이터를 자동 투입합니다.
 * 이미 시드된 경우 API가 skip하므로 중복 실행 안전합니다.
 */
export function SeedInitializer() {
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    fetch("/api/emission-factors/seed", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.created > 0) {
          console.log(`[SeedInitializer] 배출계수 ${data.created}건 시드 완료`);
        }
      })
      .catch(() => {
        // 시드 실패는 무시 (하드코딩 fallback 사용)
      });
  }, []);

  return null;
}
