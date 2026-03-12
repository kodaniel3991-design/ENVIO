"use client";

import { Button } from "@/components/ui/button";
import { ValidationStatusBadge } from "./validation-status-badge";
import { ValidationAiBadge } from "./validation-ai-badge";
import type { ValidationDataDetail } from "@/types/validation-data";
import { X, FileText, Play, MessageSquare, CheckCircle } from "lucide-react";

interface ValidationDetailDrawerProps {
  detail: ValidationDataDetail | null;
  onClose: () => void;
}

/** 검증 상세 리뷰 드로어 - 행 클릭 시 우측 패널 */
export function ValidationDetailDrawer({
  detail,
  onClose,
}: ValidationDetailDrawerProps) {
  if (!detail) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-semibold">검증 상세</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          {/* 1) 기본 정보 */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">
              기본 정보
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Scope</p>
                <p className="font-medium">{detail.scope}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">카테고리</p>
                <p className="font-medium">{detail.category}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">배출원</p>
                <p className="font-medium">{detail.emissionSource}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">사업장</p>
                <p className="font-medium">{detail.site}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">연도 / 월</p>
                <p className="font-medium">
                  {detail.year}
                  {detail.month ? ` / ${detail.month}월` : ""}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">상태</p>
                <ValidationStatusBadge status={detail.status} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">제출자</p>
                <p className="font-medium">{detail.submittedBy}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">제출일</p>
                <p className="font-medium">{detail.submittedAt}</p>
              </div>
            </div>
          </div>

          {/* 2) 월별 데이터 요약 */}
          {detail.monthlyData && detail.monthlyData.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                월별 데이터 요약
              </h4>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-2 py-1.5 text-left font-medium">월</th>
                      <th className="px-2 py-1.5 text-right">활동량</th>
                      <th className="px-2 py-1.5 text-right">배출량</th>
                      <th className="px-2 py-1.5 text-center">이상</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.monthlyData.slice(0, 12).map((m) => (
                      <tr key={m.month} className="border-t border-border/50">
                        <td className="px-2 py-1.5">{m.month}월</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">
                          {typeof m.activityAmount === "number"
                            ? m.activityAmount.toLocaleString()
                            : m.activityAmount}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums">
                          {m.emissions}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {m.isAnomaly ? (
                            <span className="text-amber-600">●</span>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3) 배출계수 정보 */}
          <div>
            <h4 className="mb-2 text-xs font-medium text-muted-foreground">
              배출계수 정보
            </h4>
            <div className="rounded-lg border border-border p-3 text-sm">
              <p>
                계수값: {detail.emissionFactor.value} {detail.emissionFactor.unit}
              </p>
              <p className="mt-1 text-muted-foreground">
                출처: {detail.emissionFactor.source} · 기준년도:{" "}
                {detail.emissionFactor.baseYear}
              </p>
            </div>
          </div>

          {/* 4) 데이터 출처 */}
          <div>
            <p className="text-xs text-muted-foreground">데이터 출처</p>
            <p className="text-sm font-medium">{detail.dataSource}</p>
          </div>

          {/* 5) 증빙 파일 목록 */}
          <div>
            <h4 className="mb-2 text-xs font-medium text-muted-foreground">
              증빙 파일 목록
            </h4>
            {detail.evidenceFiles.length > 0 ? (
              <ul className="space-y-1">
                {detail.evidenceFiles.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    {f.name}
                    {f.uploadedAt && (
                      <span className="text-xs">({f.uploadedAt})</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">증빙 파일 없음</p>
            )}
          </div>

          {/* 6) AI 검증 결과 */}
          {detail.aiResultText && (
            <div className="rounded-lg bg-violet-500/10 p-3 text-sm">
              <p className="mb-1 font-medium text-violet-700 dark:text-violet-300">
                AI 검증 결과
              </p>
              <p className="text-muted-foreground">{detail.aiResultText}</p>
              <div className="mt-2">
                <ValidationAiBadge result={detail.aiVerification} />
              </div>
            </div>
          )}

          {/* 7) 검토 코멘트 */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              검토 코멘트
            </label>
            <textarea
              placeholder="검토 시 코멘트를 입력하세요..."
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
              rows={3}
            />
          </div>

          {/* 8) 변경 이력 */}
          <div>
            <h4 className="mb-2 text-xs font-medium text-muted-foreground">
              변경 이력
            </h4>
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
        <div className="flex flex-wrap gap-2 border-t border-border p-4">
          <Button variant="outline" size="sm">
            <Play className="mr-1 h-3.5 w-3.5" />
            검토 시작
          </Button>
          <Button variant="outline" size="sm">
            <MessageSquare className="mr-1 h-3.5 w-3.5" />
            수정 요청
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="mr-1 h-3.5 w-3.5" />
            증빙 요청
          </Button>
          <Button size="sm">
            <CheckCircle className="mr-1 h-3.5 w-3.5" />
            검증 완료
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </>
  );
}
