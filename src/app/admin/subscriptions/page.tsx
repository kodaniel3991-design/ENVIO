"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Plus, Users, MapPin } from "lucide-react";

const inputClass =
  "h-8 w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1 text-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring";

interface PlanItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  maxUsers: number;
  maxWorksites: number;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  subscriberCount: number;
}

interface SubItem {
  id: number;
  organizationId: number;
  organizationName: string;
  planId: number;
  planName: string;
  planCode: string;
  status: string;
  startDate: string;
  endDate?: string;
  memo?: string;
  createdAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  expired: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
};
const STATUS_LABEL: Record<string, string> = { active: "활성", expired: "만료", cancelled: "취소" };

const emptyPlanForm = { code: "", name: "", description: "", monthlyPrice: 0, maxUsers: 5, maxWorksites: 1, isActive: true, sortOrder: 0 };

export default function AdminSubscriptionsPage() {
  const queryClient = useQueryClient();
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [planForm, setPlanForm] = useState(emptyPlanForm);
  const [tab, setTab] = useState<"plans" | "subscriptions">("plans");

  const { data: plans = [] } = useQuery<PlanItem[]>({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const res = await fetch("/api/admin/subscriptions?type=plans");
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const { data: subs = [] } = useQuery<SubItem[]>({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/subscriptions?type=subscriptions");
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const planMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upsert-plan", data: { ...data, id: editingPlanId } }),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      setShowPlanForm(false);
      setEditingPlanId(null);
      setPlanForm(emptyPlanForm);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel-subscription", id }),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] }),
  });

  const handleEditPlan = (p: PlanItem) => {
    setPlanForm({ code: p.code, name: p.name, description: p.description ?? "", monthlyPrice: p.monthlyPrice, maxUsers: p.maxUsers, maxWorksites: p.maxWorksites, isActive: p.isActive, sortOrder: p.sortOrder });
    setEditingPlanId(p.id);
    setShowPlanForm(true);
  };

  return (
    <>
      <PageHeader title="구독 / 요금제 관리" description="요금제 플랜과 기업별 구독 현황을 관리합니다." />

      {/* 탭 */}
      <div className="mt-6 flex rounded-md border border-border w-fit">
        {[
          { key: "plans" as const, label: "요금제 플랜" },
          { key: "subscriptions" as const, label: "구독 현황" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "plans" && (
        <div className="mt-6">
          {/* 플랜 등록 폼 */}
          {showPlanForm && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">{editingPlanId ? "플랜 수정" : "새 플랜 등록"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">코드 *</label>
                    <input value={planForm.code} onChange={(e) => setPlanForm((p) => ({ ...p, code: e.target.value }))} className={inputClass} placeholder="starter" disabled={!!editingPlanId} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">플랜명 *</label>
                    <input value={planForm.name} onChange={(e) => setPlanForm((p) => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="스타터" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">월 요금 (원)</label>
                    <input type="number" value={planForm.monthlyPrice} onChange={(e) => setPlanForm((p) => ({ ...p, monthlyPrice: Number(e.target.value) }))} className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">순서</label>
                    <input type="number" value={planForm.sortOrder} onChange={(e) => setPlanForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))} className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">최대 사용자</label>
                    <input type="number" value={planForm.maxUsers} onChange={(e) => setPlanForm((p) => ({ ...p, maxUsers: Number(e.target.value) }))} className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">최대 사업장</label>
                    <input type="number" value={planForm.maxWorksites} onChange={(e) => setPlanForm((p) => ({ ...p, maxWorksites: Number(e.target.value) }))} className={inputClass} />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">설명</label>
                    <input value={planForm.description} onChange={(e) => setPlanForm((p) => ({ ...p, description: e.target.value }))} className={inputClass} />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => planMutation.mutate(planForm)} disabled={!planForm.code || !planForm.name} className="rounded bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50">
                    {editingPlanId ? "수정" : "등록"}
                  </button>
                  <button onClick={() => { setShowPlanForm(false); setEditingPlanId(null); }} className="rounded border px-4 py-2 text-xs hover:bg-muted">취소</button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 플랜 카드 */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">요금제 플랜 ({plans.length})</h3>
            <button
              onClick={() => { setShowPlanForm(true); setEditingPlanId(null); setPlanForm(emptyPlanForm); }}
              className="flex items-center gap-1 rounded border px-3 py-1.5 text-xs hover:bg-muted"
            >
              <Plus className="h-3.5 w-3.5" /> 플랜 추가
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => (
              <Card key={p.id} className={!p.isActive ? "opacity-50" : ""}>
                <CardContent className="py-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">{p.name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{p.code}</p>
                    </div>
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-2xl font-bold">
                    {p.monthlyPrice === 0 ? "무료" : `${p.monthlyPrice.toLocaleString()}원`}
                    {p.monthlyPrice > 0 && <span className="text-xs font-normal text-muted-foreground">/월</span>}
                  </p>
                  {p.description && <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>}
                  <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{p.maxUsers}명</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.maxWorksites}개</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">구독 {p.subscriberCount}건</span>
                    <button onClick={() => handleEditPlan(p)} className="rounded border px-2 py-1 text-[10px] hover:bg-muted">수정</button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "subscriptions" && (
        <div className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">기업별 구독 현황 ({subs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {subs.length === 0 ? (
                <p className="py-10 text-center text-xs text-muted-foreground">구독 내역이 없습니다.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2 pr-2 font-medium">기업</th>
                      <th className="pb-2 pr-2 font-medium">플랜</th>
                      <th className="w-20 pb-2 pr-2 font-medium">상태</th>
                      <th className="pb-2 pr-2 font-medium">시작일</th>
                      <th className="pb-2 pr-2 font-medium">종료일</th>
                      <th className="w-20 pb-2 font-medium">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {subs.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/50">
                        <td className="py-2 pr-2 font-medium">{s.organizationName}</td>
                        <td className="py-2 pr-2">{s.planName}</td>
                        <td className="py-2 pr-2">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[s.status] ?? ""}`}>
                            {STATUS_LABEL[s.status] ?? s.status}
                          </span>
                        </td>
                        <td className="py-2 pr-2 text-muted-foreground">{new Date(s.startDate).toLocaleDateString("ko-KR")}</td>
                        <td className="py-2 pr-2 text-muted-foreground">{s.endDate ? new Date(s.endDate).toLocaleDateString("ko-KR") : "-"}</td>
                        <td className="py-2">
                          {s.status === "active" && (
                            <button
                              onClick={() => cancelMutation.mutate(s.id)}
                              className="rounded border border-red-300 px-2 py-1 text-[10px] text-red-700 hover:bg-red-50"
                            >
                              취소
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
