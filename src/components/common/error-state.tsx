"use client";

import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = "데이터를 불러오는 중 오류가 발생했습니다.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
      <span>{message}</span>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          다시 시도
        </Button>
      )}
    </div>
  );
}

