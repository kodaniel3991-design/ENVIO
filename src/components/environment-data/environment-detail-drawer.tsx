"use client";

import { Button } from "@/components/ui/button";
import { DataStatusBadge } from "./data-status-badge";
import { formatNumber } from "@/lib/format";
import type { EnvironmentDataDetail } from "@/types/environment-data";
import { X, FileText, Edit, CheckCircle } from "lucide-react";

interface EnvironmentDetailDrawerProps {
  detail: EnvironmentDataDetail | null;
  onClose: () => void;
}

/** 테이블 행 클릭 시 우측 슬라이드 패널 */
export function EnvironmentDetailDrawer({
  detail,
  onClose,
}: EnvironmentDetailDrawerProps) {
  if (!detail) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-border bg-card shadow-xl flex flex-col">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-semibold">지표 상세</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <p className="text-xs text-muted-foreground">지표명</p>
            <p className="font-medium">{detail.indicatorName}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {detail.category} · {detail.period}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-muted-foreground">값</p>
              <p className="font-semibold tabular-nums">
                {formatNumber(detail.value, detail.unit === "%" ? 1 : 0)}{" "}
                {detail.unit}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">상태</p>
              <DataStatusBadge status={detail.status} />
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">데이터 출처</p>
            <p className="text-sm">{detail.source}</p>
          </div>
          {detail.aiAnalysis && (
            <div className="rounded-lg bg-violet-500/10 p-3 text-sm">
              <p className="mb-1 font-medium text-violet-700 dark:text-violet-300">
                AI 분석 결과
              </p>
              <p className="text-muted-foreground">{detail.aiAnalysis}</p>
            </div>
          )}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              증빙 파일 ({detail.evidenceFiles.length})
            </p>
            {detail.evidenceFiles.length > 0 ? (
              <ul className="space-y-1">
                {detail.evidenceFiles.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    {f.name}
                    <span className="text-xs">({f.uploadedAt})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">증빙 파일 없음</p>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              변경 이력
            </p>
            <ul className="space-y-2">
              {detail.changeHistory.map((h, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span>{h.action}</span>
                  <span className="text-muted-foreground">
                    {h.date}
                    {h.by ? ` · ${h.by}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex gap-2 border-t border-border p-4">
          <Button variant="outline" size="sm" className="flex-1">
            <Edit className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button size="sm" className="flex-1">
            <CheckCircle className="mr-1 h-3.5 w-3.5" />
            Verify
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </>
  );
}
