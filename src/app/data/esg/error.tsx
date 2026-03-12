"use client";

import { useEffect } from "react";

/** ESG 데이터(환경/사회/거버넌스) 세그먼트 전용 에러 경계. 청크 로드 실패 시에도 안정적으로 표시 */
export default function EsgDataError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("ESG data segment error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-lg font-semibold text-destructive">
        ESG 데이터를 불러올 수 없습니다
      </h2>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        {error?.message || "일시적인 오류가 발생했습니다. 새로고침 후 다시 시도해 주세요."}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        다시 시도
      </button>
    </div>
  );
}
