"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore, type Industry } from "../wizard-store";
import { getAiRecommendation } from "@/lib/ai-recommendations";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const INDUSTRIES: Industry[] = ["자동차", "제조", "건설", "IT/소프트웨어", "금융", "유통", "에너지", "화학", "식품", "기타"];
const COUNTRIES = ["대한민국", "미국", "일본", "중국", "독일", "기타"];
const EMPLOYEE_RANGES = ["50명 미만", "50~300명", "300~1,000명", "1,000~5,000명", "5,000명 이상"];
const REVENUE_RANGES = ["50억 미만", "50~300억", "300~1000억", "1000억~1조", "1조 이상", "비공개"];

export default function OrganizationPage() {
  const router = useRouter();
  const { state, hydrated, updateOrganization, markStepComplete } = useWizardStore();
  const org = state.organization;

  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState<string[] | null>(null);
  const restoredRef = useRef(false);

  // DB에서 기존 조직 정보 복원 (localStorage가 비어있을 때)
  useEffect(() => {
    if (!hydrated || restoredRef.current) return;
    if (org.companyName) { restoredRef.current = true; return; }

    restoredRef.current = true;
    fetch("/api/organization")
      .then((r) => r.json())
      .then((data) => {
        if (!data.organizationName || data.organizationName === "조직") return;
        updateOrganization({
          companyName: data.organizationName,
          industry: (data.industry as Industry) || "",
          country: data.country || "대한민국",
          employeeCount: data.employeeCount || "",
          revenue: data.revenue || "",
        });
      })
      .catch(() => {});
  }, [hydrated, org.companyName, updateOrganization]);

  const handleIndustryChange = (industry: Industry) => {
    updateOrganization({ industry });
    if (!industry) { setAiPreview(null); return; }
    setAiLoading(true);
    setAiPreview(null);
    // AI 추천 시뮬레이션 (실제 Claude API 호출로 교체 가능)
    setTimeout(() => {
      const rec = getAiRecommendation(industry);
      if (rec) setAiPreview(rec.kpi.environmental.slice(0, 3));
      setAiLoading(false);
    }, 800);
  };

  const handleNext = async () => {
    await fetch("/api/organization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationName: org.companyName,
        industry: org.industry,
        country: org.country,
        employeeCount: org.employeeCount,
        revenue: org.revenue || null,
      }),
    });
    markStepComplete(1);
    router.push("/getting-started/facility");
  };

  const isValid = org.companyName.trim() && org.industry && org.country && org.employeeCount;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6">
        <h2 className="text-base font-bold text-foreground">① 조직 설정</h2>
        <p className="text-sm text-muted-foreground">기본 조직 정보를 입력해 주세요.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* 회사명 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            회사명 <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={org.companyName}
            onChange={(e) => updateOrganization({ companyName: e.target.value })}
            placeholder="예: (주)그린테크"
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* 국가 / 지역 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            국가 / 지역 <span className="text-destructive">*</span>
          </label>
          <select
            value={org.country}
            onChange={(e) => updateOrganization({ country: e.target.value })}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary transition-colors"
          >
            {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* 산업군 — AI 핵심 포인트 */}
        <div className="col-span-full flex flex-col gap-1.5">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            산업군 <span className="text-destructive">*</span>
            <span className="flex items-center gap-1 text-[11px] font-normal text-carbon-success">
              <Sparkles className="h-3 w-3" /> 선택 시 KPI 자동 추천
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind}
                onClick={() => handleIndustryChange(ind)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm transition-all",
                  org.industry === ind
                    ? "border-primary bg-primary/10 font-semibold text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {ind}
              </button>
            ))}
          </div>

          {/* AI 추천 미리보기 */}
          {aiLoading && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              AI가 {org.industry} 산업 맞춤 KPI를 분석 중입니다...
            </div>
          )}
          {!aiLoading && aiPreview && (
            <div className="mt-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3">
              <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-carbon-success">
                <Sparkles className="h-3 w-3" /> AI 추천 KPI 미리보기 ({org.industry})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {aiPreview.map((kpi) => (
                  <span
                    key={kpi}
                    className="rounded-full border border-primary/30 bg-card px-2.5 py-0.5 text-xs text-primary"
                  >
                    {kpi}
                  </span>
                ))}
                <span className="rounded-full border border-primary/30 bg-card px-2.5 py-0.5 text-xs text-muted-foreground">
                  +더보기 (④ KPI 단계에서 확인)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 직원 수 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            직원 수 <span className="text-destructive">*</span>
          </label>
          <select
            value={org.employeeCount}
            onChange={(e) => updateOrganization({ employeeCount: e.target.value })}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary transition-colors"
          >
            <option value="">선택해 주세요</option>
            {EMPLOYEE_RANGES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>

        {/* 매출 규모 (선택) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            매출 규모 <span className="text-xs text-muted-foreground">(선택)</span>
          </label>
          <select
            value={org.revenue}
            onChange={(e) => updateOrganization({ revenue: e.target.value })}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary transition-colors"
          >
            <option value="">선택 안 함</option>
            {REVENUE_RANGES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleNext}
          disabled={!isValid}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-40 hover:opacity-90"
        >
          다음: 사업장 설정 <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
