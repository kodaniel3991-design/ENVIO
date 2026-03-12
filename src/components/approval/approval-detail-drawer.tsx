"use client";

import { Button } from "@/components/ui/button";
import { ApprovalStatusBadge } from "./approval-status-badge";
import type { ApprovalDataDetail } from "@/types/approval-data";
import { X, FileText, CheckCircle, XCircle, Lock, RotateCcw } from "lucide-react";

interface ApprovalDetailDrawerProps {
  detail: ApprovalDataDetail | null;
  onClose: () => void;
}

/** 승인 상세 드로어 - 행 클릭 시 우측 패널 */
export function ApprovalDetailDrawer({
  detail,
  onClose,
}: ApprovalDetailDrawerProps) {
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
          <h3 className="font-semibold">승인 상세</h3>
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
                <p className="text-xs text-muted-foreground">현재 상태</p>
                <ApprovalStatusBadge status={detail.status} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">제출자</p>
                <p className="font-medium">{detail.submittedBy}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">승인자</p>
                <p className="font-medium">{detail.approver}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">제출일</p>
                <p className="font-medium">{detail.submittedAt}</p>
              </div>
              {detail.approvedAt && (
                <div>
                  <p className="text-xs text-muted-foreground">승인일</p>
                  <p className="font-medium">{detail.approvedAt}</p>
                </div>
              )}
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

          {/* 4) 증빙 파일 목록 */}
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

          {/* 5) 검증 결과 요약 */}
          <div>
            <h4 className="mb-2 text-xs font-medium text-muted-foreground">
              검증 결과 요약
            </h4>
            <ul className="space-y-1 text-sm">
              <li>검증 완료: {detail.verificationSummary.verified ? "예" : "아니오"}</li>
              <li>이상치 해소: {detail.verificationSummary.anomalyResolved ? "예" : "아니오"}</li>
              <li>누락 데이터 보완: {detail.verificationSummary.missingResolved ? "예" : "아니오"}</li>
            </ul>
          </div>

          {/* 6) 승인 코멘트 */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              승인 코멘트
            </label>
            <textarea
              placeholder="승인 사유 또는 반려 사유를 입력하세요..."
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
              rows={3}
              disabled={detail.isLocked}
            />
          </div>

          {/* 7) Lock 상태 */}
          {detail.isLocked && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              <Lock className="h-4 w-4 shrink-0 text-amber-600" />
              <p>
                이 데이터는 최종 확정되어 수정이 잠겨 있습니다. 재수정이 필요한 경우
                Reopen 요청이 필요합니다.
              </p>
            </div>
          )}

          {/* 8) 승인 이력 */}
          <div>
            <h4 className="mb-2 text-xs font-medium text-muted-foreground">
              승인 이력 / 변경 이력
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
          <Button
            variant="outline"
            size="sm"
            disabled={detail.isLocked}
          >
            <CheckCircle className="mr-1 h-3.5 w-3.5" />
            승인
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={detail.isLocked}
          >
            <XCircle className="mr-1 h-3.5 w-3.5" />
            반려
          </Button>
          <Button
            size="sm"
            disabled={detail.isLocked}
          >
            <Lock className="mr-1 h-3.5 w-3.5" />
            최종 확정
          </Button>
          <Button variant="outline" size="sm">
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            재오픈
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </>
  );
}
