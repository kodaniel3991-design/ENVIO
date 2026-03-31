"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateOrgStatus } from "@/services/api/admin";
import {
  Building2,
  Users,
  MapPin,
  ArrowLeft,
  Factory,
  Mail,
  Phone,
  FileText,
} from "lucide-react";

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

const USER_STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  invited: "bg-blue-100 text-blue-800",
  disabled: "bg-gray-100 text-gray-800",
};
const USER_STATUS_LABEL: Record<string, string> = {
  active: "활성",
  invited: "초대",
  disabled: "비활성",
};

interface OrgDetail {
  id: number;
  organizationName: string;
  address: string;
  addressDetail?: string;
  industry?: string;
  country?: string;
  employeeCount?: string;
  revenue?: string;
  status: string;
  businessNumber?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  memo?: string;
  scope1Enabled: boolean;
  scope2Enabled: boolean;
  scope3Enabled: boolean;
  createdAt: string;
  worksites: {
    id: string;
    name: string;
    address: string;
    isDefault: boolean;
    facilityCount: number;
    employeeCount: number;
    facilitiesByScope: Record<number, number>;
  }[];
  users: {
    id: string;
    name: string;
    email: string;
    department?: string;
    jobTitle?: string;
    roleName?: string;
    status: string;
    approvalStatus: string;
    lastLoginAt?: string;
  }[];
}

export default function AdminOrgDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const orgId = Number(params.id);

  const { data: org, isLoading } = useQuery<OrgDetail>({
    queryKey: ["admin-org-detail", orgId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/organizations/${orgId}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ status }: { status: string }) => updateOrgStatus(orgId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-org-detail", orgId] });
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] });
    },
  });

  if (isLoading || !org) {
    return (
      <>
        <PageHeader title="기업 상세" />
        <p className="mt-8 text-sm text-muted-foreground">불러오는 중...</p>
      </>
    );
  }

  const totalFacilities = org.worksites.reduce((a, w) => a + w.facilityCount, 0);
  const totalEmployees = org.worksites.reduce((a, w) => a + w.employeeCount, 0);

  return (
    <>
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/organizations")}
              className="rounded-md p-1 hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span>{org.organizationName}</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[org.status] ?? ""}`}
            >
              {STATUS_LABEL[org.status] ?? org.status}
            </span>
          </div>
        }
        description={`사업자번호: ${org.businessNumber ?? "-"} · 업종: ${org.industry ?? "-"} · 가입일: ${new Date(org.createdAt).toLocaleDateString("ko-KR")}`}
      >
        <div className="flex gap-2">
          {org.status === "active" && (
            <button
              onClick={() => statusMutation.mutate({ status: "suspended" })}
              className="rounded-md border border-yellow-300 px-3 py-1.5 text-xs font-medium text-yellow-700 hover:bg-yellow-50"
            >
              정지
            </button>
          )}
          {org.status === "suspended" && (
            <>
              <button
                onClick={() => statusMutation.mutate({ status: "active" })}
                className="rounded-md border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50"
              >
                활성화
              </button>
              <button
                onClick={() => statusMutation.mutate({ status: "terminated" })}
                className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
              >
                해지
              </button>
            </>
          )}
          {org.status === "terminated" && (
            <button
              onClick={() => statusMutation.mutate({ status: "active" })}
              className="rounded-md border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50"
            >
              재활성화
            </button>
          )}
        </div>
      </PageHeader>

      {/* 요약 카드 */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniCard icon={MapPin} label="사업장" value={org.worksites.length} />
        <MiniCard icon={Users} label="사용자" value={org.users.length} />
        <MiniCard icon={Factory} label="배출원" value={totalFacilities} />
        <MiniCard icon={Users} label="직원" value={totalEmployees} />
      </div>

      {/* 기업 정보 + 담당자 */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">기업 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <InfoRow label="주소" value={org.address + (org.addressDetail ? ` ${org.addressDetail}` : "")} />
            <InfoRow label="국가" value={org.country} />
            <InfoRow label="종업원 수" value={org.employeeCount} />
            <InfoRow label="매출" value={org.revenue} />
            <InfoRow
              label="Scope"
              value={[
                org.scope1Enabled && "1",
                org.scope2Enabled && "2",
                org.scope3Enabled && "3",
              ]
                .filter(Boolean)
                .join(", ")}
            />
            {org.contractStartDate && (
              <InfoRow
                label="계약 기간"
                value={`${new Date(org.contractStartDate).toLocaleDateString("ko-KR")} ~ ${org.contractEndDate ? new Date(org.contractEndDate).toLocaleDateString("ko-KR") : "미정"}`}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">담당자 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{org.contactName ?? "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{org.contactEmail ?? "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{org.contactPhone ?? "-"}</span>
            </div>
            {org.memo && (
              <div className="flex items-start gap-2">
                <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{org.memo}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 사업장 목록 */}
      <div className="mt-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              사업장 <span className="font-normal text-muted-foreground">({org.worksites.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {org.worksites.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">등록된 사업장이 없습니다.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 pr-2 font-medium">사업장명</th>
                    <th className="pb-2 pr-2 font-medium">주소</th>
                    <th className="w-16 pb-2 pr-2 text-center font-medium">기본</th>
                    <th className="w-20 pb-2 pr-2 text-center font-medium">배출원</th>
                    <th className="w-20 pb-2 pr-2 text-center font-medium">직원</th>
                    <th className="pb-2 font-medium">Scope 분포</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {org.worksites.map((w) => (
                    <tr key={w.id} className="hover:bg-muted/50">
                      <td className="py-2 pr-2 font-medium">{w.name}</td>
                      <td className="py-2 pr-2 text-muted-foreground">{w.address || "-"}</td>
                      <td className="py-2 pr-2 text-center">
                        {w.isDefault ? <span className="text-primary">Y</span> : "-"}
                      </td>
                      <td className="py-2 pr-2 text-center">{w.facilityCount}</td>
                      <td className="py-2 pr-2 text-center">{w.employeeCount}</td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          {[1, 2, 3].map((s) => {
                            const cnt = w.facilitiesByScope[s] ?? 0;
                            return cnt > 0 ? (
                              <span
                                key={s}
                                className="rounded bg-muted px-1.5 py-0.5 text-[10px]"
                              >
                                S{s}: {cnt}
                              </span>
                            ) : null;
                          })}
                          {Object.keys(w.facilitiesByScope).length === 0 && (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 사용자 목록 */}
      <div className="mt-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              사용자 <span className="font-normal text-muted-foreground">({org.users.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {org.users.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">등록된 사용자가 없습니다.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 pr-2 font-medium">이름</th>
                    <th className="pb-2 pr-2 font-medium">이메일</th>
                    <th className="pb-2 pr-2 font-medium">부서</th>
                    <th className="pb-2 pr-2 font-medium">직책</th>
                    <th className="pb-2 pr-2 font-medium">역할</th>
                    <th className="w-16 pb-2 pr-2 font-medium">상태</th>
                    <th className="w-28 pb-2 font-medium">최근 로그인</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {org.users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/50">
                      <td className="py-2 pr-2 font-medium">{u.name}</td>
                      <td className="py-2 pr-2 text-muted-foreground">{u.email}</td>
                      <td className="py-2 pr-2">{u.department ?? "-"}</td>
                      <td className="py-2 pr-2">{u.jobTitle ?? "-"}</td>
                      <td className="py-2 pr-2">{u.roleName ?? "-"}</td>
                      <td className="py-2 pr-2">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${USER_STATUS_BADGE[u.status] ?? ""}`}
                        >
                          {USER_STATUS_LABEL[u.status] ?? u.status}
                        </span>
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("ko-KR") : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function MiniCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex">
      <span className="w-24 shrink-0 font-medium text-muted-foreground">{label}</span>
      <span>{value || "-"}</span>
    </div>
  );
}
