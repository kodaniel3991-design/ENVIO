"use client";

import { Button } from "@/components/ui/button";
import { SupplierStatusBadge } from "./supplier-status-badge";
import { TierBadge } from "./tier-badge";
import { SubmissionStatusBadge } from "./submission-status-badge";
import { SupplierRiskBadge } from "./supplier-risk-badge";
import { EsgScoreIndicator } from "./esg-score-indicator";
import type { SupplierDetail } from "@/types/supplier-portal";
import { X, FileText, Send, RefreshCw, ExternalLink } from "lucide-react";

interface SupplierPortalDetailDrawerProps {
  detail: SupplierDetail | null;
  onClose: () => void;
}

/** 협력사 상세 드로어 - 행 클릭 시 우측 패널 */
export function SupplierPortalDetailDrawer({
  detail,
  onClose,
}: SupplierPortalDetailDrawerProps) {
  if (!detail) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-blue-500/20 bg-blue-500/5 p-4">
          <h3 className="font-semibold">협력사 상세</h3>
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
                <p className="text-xs text-muted-foreground">협력사명</p>
                <p className="font-medium">{detail.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">이메일</p>
                <p className="font-medium">{detail.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">담당자</p>
                <p className="font-medium">{detail.contactName ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">상태</p>
                <SupplierStatusBadge status={detail.status} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tier</p>
                <TierBadge tier={detail.tier} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">카테고리</p>
                <p className="font-medium">{detail.category ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">연계 사업장 / 구매조직</p>
                <p className="font-medium">{detail.linkedSite ?? "—"}</p>
              </div>
            </div>
          </div>

          {/* 2) 참여 현황 */}
          <div>
            <h4 className="mb-2 text-xs font-medium text-muted-foreground">
              참여 현황
            </h4>
            <ul className="space-y-1 text-sm">
              <li>초대일: {detail.invitedAt ?? "—"}</li>
              <li>최근 응답일: {detail.lastResponseAt ?? "—"}</li>
              <li>제출 상태: <SubmissionStatusBadge status={detail.submissionStatus} /></li>
              <li>리마인드 횟수: {detail.remindCount ?? 0}회</li>
            </ul>
          </div>

          {/* 3) ESG / 리스크 */}
          <div>
            <h4 className="mb-2 text-xs font-medium text-muted-foreground">
              ESG / 리스크 정보
            </h4>
            <div className="space-y-2 rounded-lg border border-border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span>ESG 점수</span>
                <EsgScoreIndicator score={detail.esgScore} showBar={true} />
              </div>
              <div className="flex items-center justify-between">
                <span>리스크 수준</span>
                <SupplierRiskBadge level={detail.riskLevel} />
              </div>
              {detail.riskReasons && detail.riskReasons.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">주요 리스크 사유</p>
                  <ul className="mt-1 list-inside list-disc text-xs">
                    {detail.riskReasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                최근 평가일: {detail.lastAssessedAt ?? "—"}
              </p>
            </div>
          </div>

          {/* 4) Scope 3 연계 */}
          {detail.scope3Categories && detail.scope3Categories.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                Scope 3 연계 정보
              </h4>
              <ul className="space-y-1 text-sm">
                <li>연결된 카테고리: {detail.scope3Categories.join(", ")}</li>
                <li>추정 기여도: {detail.scope3Contribution ?? "—"}</li>
                <li>제출 데이터: {detail.submissionCount ?? 0}건</li>
                <li>증빙 파일: {detail.evidenceCount ?? 0}개</li>
              </ul>
            </div>
          )}

          {/* 5) 커뮤니케이션 이력 */}
          <div>
            <h4 className="mb-2 text-xs font-medium text-muted-foreground">
              커뮤니케이션 이력
            </h4>
            <ul className="space-y-1 text-sm">
              {detail.communicationHistory.map((h, i) => (
                <li key={i}>
                  {h.date} {h.action}
                </li>
              ))}
            </ul>
          </div>

          {/* 6) 메모 */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              메모 / 코멘트
            </label>
            <textarea
              placeholder="협력사 관련 메모..."
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
              rows={3}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border p-4">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Send className="mr-1 h-3.5 w-3.5" />
            초대 발송
          </Button>
          <Button variant="outline" size="sm" className="border-blue-500/30">
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            리마인드 발송
          </Button>
          <Button variant="outline" size="sm">
            <ExternalLink className="mr-1 h-3.5 w-3.5" />
            데이터 보기
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </>
  );
}
