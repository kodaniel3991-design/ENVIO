"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAdminOrganizations,
  createOrganization,
  updateOrgStatus,
  updateOrganizationAdmin,
  type AdminOrgItem,
} from "@/services/api/admin";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationBar } from "@/components/common/pagination-bar";
import Link from "next/link";
import { Building2, Users, MapPin } from "lucide-react";

const inputClass =
  "h-8 w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1 text-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring";

const STATUS_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "active", label: "활성" },
  { value: "suspended", label: "정지" },
  { value: "terminated", label: "해지" },
];

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  suspended: "bg-yellow-100 text-yellow-800",
  terminated: "bg-red-100 text-red-800",
};

const STATUS_LABEL: Record<string, string> = {
  active: "활성",
  suspended: "정지",
  terminated: "해지",
};

export default function AdminOrganizationsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<AdminOrgItem>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    organizationName: "",
    industry: "",
    country: "KR",
    businessNumber: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    memo: "",
  });

  const { data: orgs = [], isLoading } = useQuery<AdminOrgItem[]>({
    queryKey: ["admin-organizations", statusFilter, search],
    queryFn: () =>
      getAdminOrganizations({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: search || undefined,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateOrgStatus(id, status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] }),
  });

  const createMutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] });
      setShowCreateModal(false);
      setCreateForm({ organizationName: "", industry: "", country: "KR", businessNumber: "", contactName: "", contactEmail: "", contactPhone: "", memo: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AdminOrgItem> }) =>
      updateOrganizationAdmin(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] });
      setEditingId(null);
    },
  });

  const pagination = usePagination({ totalItems: orgs.length, pageSize: 10 });
  const visibleOrgs = pagination.paginate(orgs);

  const summaryCards = useMemo(() => {
    const total = orgs.length;
    const active = orgs.filter((o) => o.status === "active").length;
    const suspended = orgs.filter((o) => o.status === "suspended").length;
    const terminated = orgs.filter((o) => o.status === "terminated").length;
    return { total, active, suspended, terminated };
  }, [orgs]);

  const handleEditStart = (org: AdminOrgItem) => {
    setEditingId(org.id);
    setEditForm({
      organizationName: org.organizationName,
      businessNumber: org.businessNumber ?? "",
      contactName: org.contactName ?? "",
      contactEmail: org.contactEmail ?? "",
      contactPhone: org.contactPhone ?? "",
      memo: org.memo ?? "",
    });
  };

  const handleEditSave = () => {
    if (!editingId) return;
    updateMutation.mutate({ id: editingId, data: editForm });
  };

  return (
    <>
      <PageHeader
        title="기업 관리"
        description="가입 기업의 상태를 관리하고 정보를 수정합니다."
      >
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          + 기업 등록
        </button>
      </PageHeader>

      {/* 요약 카드 */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        {[
          { label: "전체 기업", value: summaryCards.total, color: "text-foreground" },
          { label: "활성", value: summaryCards.active, color: "text-green-600" },
          { label: "정지", value: summaryCards.suspended, color: "text-yellow-600" },
          { label: "해지", value: summaryCards.terminated, color: "text-red-600" },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-3 py-4">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 필터 */}
      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-col space-y-2 pb-3">
            <CardTitle className="text-sm font-semibold">
              기업 목록 <span className="font-normal text-muted-foreground">({orgs.length})</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="검색 (기업명/사업자번호/이메일)"
                className={inputClass + " max-w-xs"}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={inputClass + " w-28"}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">불러오는 중...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs" aria-label="기업 목록">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2 pr-2 font-medium">기업명</th>
                      <th className="pb-2 pr-2 font-medium">사업자번호</th>
                      <th className="pb-2 pr-2 font-medium">업종</th>
                      <th className="pb-2 pr-2 font-medium">담당자</th>
                      <th className="pb-2 pr-2 font-medium">연락처</th>
                      <th className="w-16 pb-2 pr-2 text-center font-medium">
                        <Users className="inline h-3.5 w-3.5" />
                      </th>
                      <th className="w-16 pb-2 pr-2 text-center font-medium">
                        <MapPin className="inline h-3.5 w-3.5" />
                      </th>
                      <th className="w-20 pb-2 pr-2 font-medium">상태</th>
                      <th className="w-28 pb-2 pr-2 font-medium">가입일</th>
                      <th className="w-32 pb-2 font-medium">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {visibleOrgs.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-10 text-center text-muted-foreground">
                          표시할 기업이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      visibleOrgs.map((org) => {
                        const isEditing = editingId === org.id;
                        return (
                          <tr key={org.id} className="align-middle hover:bg-muted/50">
                            <td className="py-2 pr-2 font-medium">
                              {isEditing ? (
                                <input
                                  value={editForm.organizationName ?? ""}
                                  onChange={(e) =>
                                    setEditForm((p) => ({ ...p, organizationName: e.target.value }))
                                  }
                                  className={inputClass}
                                />
                              ) : (
                                <Link
                                  href={`/admin/organizations/${org.id}`}
                                  className="hover:text-primary hover:underline"
                                >
                                  {org.organizationName}
                                </Link>
                              )}
                            </td>
                            <td className="py-2 pr-2 text-muted-foreground">
                              {isEditing ? (
                                <input
                                  value={editForm.businessNumber ?? ""}
                                  onChange={(e) =>
                                    setEditForm((p) => ({ ...p, businessNumber: e.target.value }))
                                  }
                                  className={inputClass}
                                />
                              ) : (
                                org.businessNumber ?? "-"
                              )}
                            </td>
                            <td className="py-2 pr-2">{org.industry ?? "-"}</td>
                            <td className="py-2 pr-2">
                              {isEditing ? (
                                <input
                                  value={editForm.contactName ?? ""}
                                  onChange={(e) =>
                                    setEditForm((p) => ({ ...p, contactName: e.target.value }))
                                  }
                                  className={inputClass}
                                />
                              ) : (
                                org.contactName ?? "-"
                              )}
                            </td>
                            <td className="py-2 pr-2">
                              {isEditing ? (
                                <input
                                  value={editForm.contactEmail ?? ""}
                                  onChange={(e) =>
                                    setEditForm((p) => ({ ...p, contactEmail: e.target.value }))
                                  }
                                  className={inputClass}
                                />
                              ) : (
                                org.contactEmail ?? "-"
                              )}
                            </td>
                            <td className="py-2 pr-2 text-center">{org.userCount}</td>
                            <td className="py-2 pr-2 text-center">{org.worksiteCount}</td>
                            <td className="py-2 pr-2">
                              <span
                                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  STATUS_BADGE[org.status] ?? "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {STATUS_LABEL[org.status] ?? org.status}
                              </span>
                            </td>
                            <td className="py-2 pr-2 text-muted-foreground">
                              {new Date(org.createdAt).toLocaleDateString("ko-KR")}
                            </td>
                            <td className="py-2">
                              {isEditing ? (
                                <div className="flex gap-1">
                                  <button
                                    onClick={handleEditSave}
                                    className="rounded bg-primary px-2 py-1 text-[10px] text-primary-foreground"
                                  >
                                    저장
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="rounded border px-2 py-1 text-[10px]"
                                  >
                                    취소
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleEditStart(org)}
                                    className="rounded border px-2 py-1 text-[10px] hover:bg-muted"
                                  >
                                    수정
                                  </button>
                                  {org.status === "active" && (
                                    <button
                                      onClick={() =>
                                        statusMutation.mutate({ id: org.id, status: "suspended" })
                                      }
                                      className="rounded border border-yellow-300 px-2 py-1 text-[10px] text-yellow-700 hover:bg-yellow-50"
                                    >
                                      정지
                                    </button>
                                  )}
                                  {org.status === "suspended" && (
                                    <>
                                      <button
                                        onClick={() =>
                                          statusMutation.mutate({ id: org.id, status: "active" })
                                        }
                                        className="rounded border border-green-300 px-2 py-1 text-[10px] text-green-700 hover:bg-green-50"
                                      >
                                        활성화
                                      </button>
                                      <button
                                        onClick={() =>
                                          statusMutation.mutate({ id: org.id, status: "terminated" })
                                        }
                                        className="rounded border border-red-300 px-2 py-1 text-[10px] text-red-700 hover:bg-red-50"
                                      >
                                        해지
                                      </button>
                                    </>
                                  )}
                                  {org.status === "terminated" && (
                                    <button
                                      onClick={() =>
                                        statusMutation.mutate({ id: org.id, status: "active" })
                                      }
                                      className="rounded border border-green-300 px-2 py-1 text-[10px] text-green-700 hover:bg-green-50"
                                    >
                                      재활성화
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                <PaginationBar pagination={pagination} totalItems={orgs.length} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 기업 등록 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">기업 등록</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">기업명 *</label>
                <input
                  autoFocus
                  value={createForm.organizationName}
                  onChange={(e) => setCreateForm((p) => ({ ...p, organizationName: e.target.value }))}
                  className={inputClass}
                  placeholder="기업명을 입력하세요"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">업종</label>
                <input
                  value={createForm.industry}
                  onChange={(e) => setCreateForm((p) => ({ ...p, industry: e.target.value }))}
                  className={inputClass}
                  placeholder="예: 제조업"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">사업자번호</label>
                <input
                  value={createForm.businessNumber}
                  onChange={(e) => setCreateForm((p) => ({ ...p, businessNumber: e.target.value }))}
                  className={inputClass}
                  placeholder="000-00-00000"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">담당자명</label>
                <input
                  value={createForm.contactName}
                  onChange={(e) => setCreateForm((p) => ({ ...p, contactName: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">담당자 이메일</label>
                <input
                  value={createForm.contactEmail}
                  onChange={(e) => setCreateForm((p) => ({ ...p, contactEmail: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">담당자 전화번호</label>
                <input
                  value={createForm.contactPhone}
                  onChange={(e) => setCreateForm((p) => ({ ...p, contactPhone: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">국가</label>
                <input
                  value={createForm.country}
                  onChange={(e) => setCreateForm((p) => ({ ...p, country: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">메모</label>
                <input
                  value={createForm.memo}
                  onChange={(e) => setCreateForm((p) => ({ ...p, memo: e.target.value }))}
                  className={inputClass}
                  placeholder="비고 사항"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-md border px-4 py-2 text-xs font-medium hover:bg-muted"
              >
                취소
              </button>
              <button
                onClick={() => createMutation.mutate(createForm)}
                disabled={!createForm.organizationName.trim() || createMutation.isPending}
                className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {createMutation.isPending ? "등록 중..." : "등록"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
