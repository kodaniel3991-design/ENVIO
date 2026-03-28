"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { ValidationSummaryCards } from "@/components/validation/validation-summary-cards";
import { ValidationAiInsight } from "@/components/validation/validation-ai-insight";
import { ValidationFilters } from "@/components/validation/validation-filters";
import { ValidationDataTable } from "@/components/validation/validation-data-table";
import { ValidationDetailDrawer } from "@/components/validation/validation-detail-drawer";
import { ValidationWorkflowSection } from "@/components/validation/validation-workflow-section";
import { ValidationQualityCards } from "@/components/validation/validation-quality-cards";
import type {
  ValidationDataRow,
  ValidationDataDetail,
  ValidationSummaryItem,
  ValidationWorkflowStep,
  ValidationQualityScore,
  ValidationAiInsight as AiInsightType,
} from "@/types/validation-data";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle, Loader2 } from "lucide-react";

// API에서 가져온 데이터를 ValidationDataRow로 변환
function toValidationRow(raw: any): ValidationDataRow {
  return {
    id: raw.id,
    status: raw.status ?? "submitted",
    scope: raw.scope ?? "Scope 1",
    category: raw.category ?? "",
    emissionSource: raw.emissionSource ?? "",
    site: raw.site ?? "",
    period: raw.period ?? "",
    activityAmount: raw.activityAmount ?? "0",
    emissions: raw.emissions ?? "0",
    evidenceCount: raw.evidenceCount ?? 0,
    aiVerification: raw.aiVerification ?? "normal",
    submittedBy: raw.submittedBy ?? "-",
    submittedAt: raw.submittedAt
      ? new Date(raw.submittedAt).toLocaleDateString("ko-KR")
      : "-",
    dataSource: raw.dataSource ?? "Manual",
  };
}

// 검증 데이터에서 요약 KPI 생성
function buildSummary(rows: ValidationDataRow[]): ValidationSummaryItem[] {
  const submitted = rows.filter((r) => r.status === "submitted").length;
  const underReview = rows.filter((r) => r.status === "under_review").length;
  const verified = rows.filter((r) => r.status === "verified").length;
  const needsEvidence = rows.filter((r) => r.status === "needs_evidence").length;
  const anomaly = rows.filter((r) => r.aiVerification === "anomaly").length;
  const total = rows.length;
  const completionRate = total > 0 ? Math.round((verified / total) * 100) : 0;

  return [
    { id: "pending", label: "검증 대기", value: submitted, unit: "건", subLabel: "제출 후 검토 전" },
    { id: "review", label: "검토 중", value: underReview, unit: "건", subLabel: "현재 검토 진행" },
    { id: "anomaly", label: "이상 항목", value: anomaly, unit: "건", subLabel: "AI 이상 감지" },
    { id: "evidence", label: "증빙 필요", value: needsEvidence, unit: "건", subLabel: "추가 증빙 요청" },
    { id: "verified", label: "검증 완료", value: verified, unit: "건", subLabel: "검토 확정" },
    { id: "rate", label: "완료율", value: `${completionRate}%`, subLabel: `전체 ${total}건 중` },
  ];
}

// 워크플로우 단계 생성
function buildWorkflow(rows: ValidationDataRow[]): ValidationWorkflowStep[] {
  return [
    { id: "submitted", label: "제출됨", count: rows.filter((r) => r.status === "submitted").length, description: "데이터가 제출된 상태" },
    { id: "under_review", label: "검토 중", count: rows.filter((r) => r.status === "under_review").length, description: "담당자가 검토 중" },
    { id: "verified", label: "검증 완료", count: rows.filter((r) => r.status === "verified").length, description: "검증이 확정된 상태" },
  ];
}

// 데이터 품질 점수 생성
function buildQuality(rows: ValidationDataRow[]): ValidationQualityScore[] {
  const total = rows.length || 1;
  const hasActivity = rows.filter((r) => parseFloat(r.activityAmount) > 0).length;
  const hasEmission = rows.filter((r) => parseFloat(r.emissions) > 0).length;
  const noAnomaly = rows.filter((r) => r.aiVerification === "normal").length;

  const completeness = Math.round((hasActivity / total) * 100);
  const accuracy = Math.round((noAnomaly / total) * 100);
  const consistency = Math.round((hasEmission / total) * 100);
  const overall = Math.round((completeness + accuracy + consistency) / 3);

  return [
    { id: "completeness", label: "데이터 완전성", value: completeness, description: "활동량이 입력된 비율" },
    { id: "accuracy", label: "정확성", value: accuracy, description: "AI 이상 없는 비율" },
    { id: "consistency", label: "일관성", value: consistency, description: "배출량이 산정된 비율" },
    { id: "overall", label: "종합 점수", value: overall, description: "평균 품질 점수" },
  ];
}

// AI 인사이트 생성
function buildAiInsight(rows: ValidationDataRow[]): AiInsightType {
  const anomalies = rows.filter((r) => r.aiVerification === "anomaly");
  const missing = rows.filter((r) => r.aiVerification === "missing_risk");
  const hasAnomaly = anomalies.length > 0 || missing.length > 0;

  const alerts: string[] = [];
  if (anomalies.length > 0) alerts.push(`${anomalies.length}건의 배출 데이터에서 이상치가 감지되었습니다.`);
  if (missing.length > 0) alerts.push(`${missing.length}건의 데이터에 누락 위험이 있습니다.`);
  if (!hasAnomaly) alerts.push("현재 제출된 데이터에 특이 사항이 없습니다.");

  return {
    alerts,
    possibleCauses: hasAnomaly ? ["전년 대비 활동량 급변", "입력 단위 오류 가능성", "누락된 월별 데이터"] : [],
    suggestedActions: hasAnomaly ? ["이상 항목의 원본 데이터 확인", "담당자에게 증빙 요청", "전년도 데이터와 비교 검토"] : ["정기 검토 일정에 따라 검증을 진행하세요."],
    hasAnomaly,
  };
}

export default function ValidationPage() {
  const queryClient = useQueryClient();
  const [selectedRow, setSelectedRow] = useState<ValidationDataRow | null>(null);

  // DB에서 검증 목록 로드
  const { data: rawValidations = [], isLoading } = useQuery<any[]>({
    queryKey: ["validations"],
    queryFn: () => fetch("/api/validations?type=validations").then((r) => r.json()),
    staleTime: 1000 * 30,
  });

  const rows = useMemo(() => rawValidations.map(toValidationRow), [rawValidations]);
  const summary = useMemo(() => buildSummary(rows), [rows]);
  const workflow = useMemo(() => buildWorkflow(rows), [rows]);
  const quality = useMemo(() => buildQuality(rows), [rows]);
  const aiInsight = useMemo(() => buildAiInsight(rows), [rows]);

  // 상태 변경 뮤테이션
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch("/api/validations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-status", id, status }),
      });
      if (!res.ok) throw new Error("상태 변경 실패");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["validations"] });
    },
  });

  const handleStatusChange = useCallback((id: string, status: string) => {
    statusMutation.mutate({ id, status });
  }, [statusMutation]);

  // 일괄 검증 완료
  const handleBulkVerify = useCallback(() => {
    const submitted = rows.filter((r) => r.status === "under_review");
    if (submitted.length === 0) return;
    submitted.forEach((r) => statusMutation.mutate({ id: r.id, status: "verified" }));
  }, [rows, statusMutation]);

  // 상세 드로어용 데이터 (간이 구성)
  const detail: ValidationDataDetail | null = useMemo(() => {
    if (!selectedRow) return null;
    const yearNum = parseInt(selectedRow.period) || new Date().getFullYear();
    return {
      ...selectedRow,
      year: yearNum,
      monthlyData: [],
      emissionFactor: { value: 0, unit: "-", source: "-", baseYear: String(yearNum) },
      evidenceFiles: [],
      aiResultText: selectedRow.aiVerification === "anomaly" ? "전년도 동월 대비 이상 변동 감지" : undefined,
      changeHistory: [
        { date: selectedRow.submittedAt, action: "데이터 제출", by: selectedRow.submittedBy },
      ],
    };
  }, [selectedRow]);

  return (
    <>
      <PageHeader
        title="데이터 검증"
        description="제출된 Scope 1, 2, 3 배출 데이터를 검토하고 이상치, 누락, 증빙 상태를 확인합니다."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={handleBulkVerify}
            disabled={statusMutation.isPending}
          >
            {statusMutation.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-1.5 h-4 w-4" />
            )}
            검토 중 → 일괄 검증완료
          </Button>
        </div>
      </PageHeader>

      <div className="mt-8 space-y-8">
        {/* 1. Summary KPI */}
        <section>
          <h2 className="sr-only">검증 운영 현황</h2>
          <ValidationSummaryCards items={summary} />
        </section>

        {/* 2. AI Validation Insight */}
        <section>
          <ValidationAiInsight data={aiInsight} />
        </section>

        {/* 3. Filter Bar */}
        <section>
          <ValidationFilters />
        </section>

        {/* 4. Validation Data Table */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            검증 대상 목록 {isLoading && <span className="text-xs text-muted-foreground">(로딩 중...)</span>}
          </h2>
          <ValidationDataTable
            rows={rows}
            onRowClick={setSelectedRow}
            onStatusChange={handleStatusChange}
          />
        </section>

        {/* 5. Detail Drawer */}
        {selectedRow && (
          <ValidationDetailDrawer
            detail={detail}
            onClose={() => setSelectedRow(null)}
          />
        )}

        {/* 6. Validation Workflow */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            검토 워크플로우
          </h2>
          <ValidationWorkflowSection steps={workflow} />
        </section>

        {/* 7. Data Quality */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            데이터 품질
          </h2>
          <ValidationQualityCards items={quality} />
        </section>
      </div>
    </>
  );
}
