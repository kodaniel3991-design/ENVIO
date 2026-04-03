"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Leaf, Users, Scale, Plus, Save, X, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationBar } from "@/components/common/pagination-bar";

interface CatalogItem {
  id: number;
  esgDomain: string;
  group: string;
  name: string;
  description: string;
  reason: string;
  criteria: string;
  frameworks: string[];
  priority: "critical" | "recommended";
  sortOrder: number;
  active: boolean;
}

const DOMAIN_TABS = [
  { key: "all", label: "전체" },
  { key: "environmental", label: "환경 (E)", icon: Leaf, color: "text-green-600" },
  { key: "social", label: "사회 (S)", icon: Users, color: "text-blue-600" },
  { key: "governance", label: "거버넌스 (G)", icon: Scale, color: "text-amber-700" },
];

const DOMAIN_OPTIONS = [
  { value: "environmental", label: "환경 (E)" },
  { value: "social", label: "사회 (S)" },
  { value: "governance", label: "거버넌스 (G)" },
];

const FRAMEWORK_OPTIONS = ["GRI", "ISSB", "CDP", "K-ESG", "TCFD"];

const inputClass =
  "h-8 w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1 text-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring";

const emptyForm: Omit<CatalogItem, "id"> = {
  esgDomain: "environmental",
  group: "",
  name: "",
  description: "",
  reason: "",
  criteria: "",
  frameworks: [],
  priority: "recommended",
  sortOrder: 0,
  active: true,
};

async function fetchCatalog(domain?: string, search?: string): Promise<CatalogItem[]> {
  const params = new URLSearchParams();
  if (domain && domain !== "all") params.set("domain", domain);
  if (search) params.set("search", search);
  const res = await fetch(`/api/admin/kpi-catalog?${params}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function upsertItem(item: Partial<CatalogItem>) {
  const res = await fetch("/api/admin/kpi-catalog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "upsert", item }),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function deleteItem(id: number) {
  const res = await fetch("/api/admin/kpi-catalog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete", id }),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function toggleActive(id: number) {
  const res = await fetch("/api/admin/kpi-catalog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "toggle-active", id }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export default function AdminKpiCatalogPage() {
  const queryClient = useQueryClient();
  const [domain, setDomain] = useState("all");
  const [search, setSearch] = useState("");

  const { data: items = [], isLoading } = useQuery<CatalogItem[]>({
    queryKey: ["admin-kpi-catalog", domain, search],
    queryFn: () => fetchCatalog(domain, search),
  });

  const upsertMutation = useMutation({
    mutationFn: upsertItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-kpi-catalog"] });
      toast.success("저장되었습니다.");
      setEditingId(null);
      setShowAddForm(false);
    },
    onError: () => toast.error("저장에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-kpi-catalog"] });
      toast.success("삭제되었습니다.");
    },
    onError: () => toast.error("삭제에 실패했습니다."),
  });

  const toggleMutation = useMutation({
    mutationFn: toggleActive,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-kpi-catalog"] }),
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const counts = useMemo(() => ({
    total: items.length,
    env: items.filter((i) => i.esgDomain === "environmental").length,
    soc: items.filter((i) => i.esgDomain === "social").length,
    gov: items.filter((i) => i.esgDomain === "governance").length,
    active: items.filter((i) => i.active).length,
  }), [items]);

  const pagination = usePagination({ totalItems: items.length, pageSize: 20 });
  const visibleItems = pagination.paginate(items);

  const startEdit = (item: CatalogItem) => {
    setForm({
      esgDomain: item.esgDomain,
      group: item.group,
      name: item.name,
      description: item.description,
      reason: item.reason,
      criteria: item.criteria,
      frameworks: item.frameworks,
      priority: item.priority,
      sortOrder: item.sortOrder,
      active: item.active,
    });
    setEditingId(item.id);
    setShowAddForm(false);
  };

  const startAdd = () => {
    setForm({ ...emptyForm });
    setShowAddForm(true);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.group.trim()) {
      toast.error("그룹과 항목명은 필수입니다.");
      return;
    }
    upsertMutation.mutate(editingId ? { ...form, id: editingId } : form);
  };

  const toggleFramework = (fw: string) => {
    setForm((p) => ({
      ...p,
      frameworks: p.frameworks.includes(fw)
        ? p.frameworks.filter((f) => f !== fw)
        : [...p.frameworks, fw],
    }));
  };

  const isEditing = showAddForm || editingId !== null;

  return (
    <>
      <PageHeader
        title="KPI 카탈로그 관리"
        description="플랫폼 전체 KPI 항목을 관리합니다. 위자드 KPI 추천의 기초 데이터입니다."
      />

      {/* 요약 */}
      <div className="mt-6 grid grid-cols-5 gap-4">
        {[
          { label: "전체", value: counts.total, color: "text-foreground" },
          { label: "환경(E)", value: counts.env, Icon: Leaf, color: "text-green-600" },
          { label: "사회(S)", value: counts.soc, Icon: Users, color: "text-blue-600" },
          { label: "거버넌스(G)", value: counts.gov, Icon: Scale, color: "text-amber-700" },
          { label: "활성", value: counts.active, color: "text-primary" },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-3 py-4">
              {"Icon" in c && c.Icon && <c.Icon className="h-5 w-5 text-muted-foreground" />}
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 필터 + 목록 */}
      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-col space-y-3 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">KPI 항목 목록</CardTitle>
              <Button size="sm" onClick={startAdd} disabled={isEditing}>
                <Plus className="mr-1 h-4 w-4" /> 추가
              </Button>
            </div>
            {/* 도메인 탭 + 검색 */}
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                {DOMAIN_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setDomain(tab.key)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      domain === tab.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="검색 (항목명/그룹/설명)"
                className={inputClass + " max-w-xs"}
              />
            </div>
          </CardHeader>
          <CardContent>
            {/* 추가/수정 폼 */}
            {isEditing && (
              <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                <p className="text-xs font-semibold text-primary">
                  {editingId ? "KPI 수정" : "새 KPI 추가"}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">도메인 *</label>
                    <select value={form.esgDomain} onChange={(e) => setForm((p) => ({ ...p, esgDomain: e.target.value }))} className={inputClass}>
                      {DOMAIN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">그룹 *</label>
                    <input value={form.group} onChange={(e) => setForm((p) => ({ ...p, group: e.target.value }))} placeholder="예: 탄소/기후" className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">항목명 *</label>
                    <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="예: 온실가스 배출량" className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">설명</label>
                    <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">요구 기준</label>
                    <input value={form.criteria} onChange={(e) => setForm((p) => ({ ...p, criteria: e.target.value }))} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">선정 사유</label>
                  <input value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">우선순위</label>
                    <div className="flex gap-1.5">
                      {(["critical", "recommended"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, priority: p }))}
                          className={cn(
                            "rounded-md border px-3 py-1 text-xs font-medium transition-colors",
                            form.priority === p
                              ? p === "critical"
                                ? "border-destructive bg-destructive/10 text-destructive"
                                : "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {p === "critical" ? "필수 (Critical)" : "추천 (Recommended)"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">프레임워크</label>
                  <div className="flex gap-1.5">
                    {FRAMEWORK_OPTIONS.map((fw) => (
                      <button
                        key={fw}
                        type="button"
                        onClick={() => toggleFramework(fw)}
                        className={cn(
                          "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                          form.frameworks.includes(fw)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {fw}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={upsertMutation.isPending}>
                    <Save className="mr-1 h-3.5 w-3.5" /> 저장
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setShowAddForm(false); }}>
                    <X className="mr-1 h-3.5 w-3.5" /> 취소
                  </Button>
                </div>
              </div>
            )}

            {isLoading ? (
              <p className="text-sm text-muted-foreground">불러오는 중...</p>
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">등록된 KPI 항목이 없습니다.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="w-16 pb-2 pr-2 font-medium">도메인</th>
                        <th className="w-20 pb-2 pr-2 font-medium">그룹</th>
                        <th className="w-40 pb-2 pr-2 font-medium">항목명</th>
                        <th className="pb-2 pr-2 font-medium">설명</th>
                        <th className="w-32 pb-2 pr-2 font-medium">프레임워크</th>
                        <th className="w-14 pb-2 pr-2 font-medium">구분</th>
                        <th className="w-14 pb-2 pr-2 font-medium">활성</th>
                        <th className="w-20 pb-2 font-medium">작업</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {visibleItems.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2 pr-2">
                            <span className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-bold",
                              item.esgDomain === "environmental" ? "bg-green-100 text-green-700" :
                              item.esgDomain === "social" ? "bg-blue-100 text-blue-700" :
                              "bg-amber-100 text-amber-700"
                            )}>
                              {item.esgDomain === "environmental" ? "E" : item.esgDomain === "social" ? "S" : "G"}
                            </span>
                          </td>
                          <td className="py-2 pr-2 text-muted-foreground">{item.group}</td>
                          <td className="py-2 pr-2 font-medium">{item.name}</td>
                          <td className="py-2 pr-2 text-muted-foreground truncate max-w-[300px]">{item.description}</td>
                          <td className="py-2 pr-2">
                            <div className="flex flex-wrap gap-0.5">
                              {item.frameworks.map((fw) => (
                                <span key={fw} className="rounded bg-primary/10 px-1 py-0.5 text-[9px] font-bold text-primary">{fw}</span>
                              ))}
                            </div>
                          </td>
                          <td className="py-2 pr-2">
                            <span className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-bold",
                              item.priority === "critical"
                                ? "bg-destructive/15 text-destructive"
                                : "bg-muted text-muted-foreground"
                            )}>
                              {item.priority === "critical" ? "필수" : "추천"}
                            </span>
                          </td>
                          <td className="py-2 pr-2">
                            <button
                              onClick={() => toggleMutation.mutate(item.id)}
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                                item.active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                              )}
                            >
                              {item.active ? "활성" : "비활성"}
                            </button>
                          </td>
                          <td className="py-2">
                            <div className="flex gap-1">
                              <button onClick={() => startEdit(item)} className="rounded p-1 hover:bg-muted" title="수정">
                                <Pencil className="h-3 w-3 text-muted-foreground" />
                              </button>
                              <button
                                onClick={() => { if (confirm(`"${item.name}" 항목을 삭제하시겠습니까?`)) deleteMutation.mutate(item.id); }}
                                className="rounded p-1 hover:bg-destructive/10"
                                title="삭제"
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationBar pagination={pagination} totalItems={items.length} />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
