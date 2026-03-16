"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError } from "@/lib/api";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            /** 5분간 fresh 유지 — mock 환경에서는 길게, 실서버에서는 조정 */
            staleTime: 5 * 60 * 1000,
            /** 10분간 캐시 보존 (비활성 쿼리) */
            gcTime: 10 * 60 * 1000,
            /**
             * 스마트 재시도:
             * - 스키마 불일치(SCHEMA_MISMATCH): 재시도 무의미 → 즉시 실패
             * - 4xx 클라이언트 에러: 재시도 무의미 → 즉시 실패
             * - 5xx 서버 에러 / 네트워크: 최대 2회 재시도
             */
            retry: (failureCount, error) => {
              if (error instanceof ApiError) {
                if (error.code === "SCHEMA_MISMATCH") return false;
                if (error.status != null && error.status >= 400 && error.status < 500) return false;
              }
              return failureCount < 2;
            },
            /** 포커스 복귀 시 자동 재요청 비활성 (대시보드 깜빡임 방지) */
            refetchOnWindowFocus: false,
          },
          mutations: {
            /** mutation 에러는 재시도 안 함 (idempotency 보장 불가) */
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
