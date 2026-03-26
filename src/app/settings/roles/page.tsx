"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RoleItem } from "@/types";
import { getRoles, saveRoles } from "@/services/api";
import { Plus, Save, Trash2 } from "lucide-react";

const inputClass =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring";

export default function RolesPage() {
  const queryClient = useQueryClient();
  const { data: roles, isLoading } = useQuery({
    queryKey: ["settings-roles"],
    queryFn: getRoles,
  });

  const saveMutation = useMutation({
    mutationFn: saveRoles,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["settings-roles"] }),
  });

  const [list, setList] = useState<RoleItem[]>([]);
  useEffect(() => {
    if (roles) setList(roles.map((r: any) => ({ ...r })));
  }, [roles]);

  const handleAdd = () => {
    setList((prev) => [
      ...prev,
      { id: `r-${Date.now()}`, name: "", description: "", systemCode: "" },
    ]);
  };

  const handleRemove = (id: string) => {
    setList((prev) => prev.filter((r) => r.id !== id));
  };

  const handleChange = (id: string, field: keyof RoleItem, value: string) => {
    setList((prev) =>
      prev.map((r: any) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleSave = async () => {
    const toSave = list
      .filter((r) => r.name.trim() !== "")
      .map((r: any) => ({
        ...r,
        name: r.name.trim(),
        description: r.description?.trim() || undefined,
        systemCode: r.systemCode?.trim() || undefined,
      }));
    await saveMutation.mutateAsync(toSave);
    setList(toSave);
  };

  return (
    <>
      <PageHeader
        title="권한 관리"
        description="역할(role) 목록을 관리합니다. 사용자 관리에서 역할을 할당할 수 있습니다."
      />
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">역할 목록</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleAdd} disabled={isLoading}>
              <Plus className="mr-1 h-4 w-4" /> 추가
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isLoading || saveMutation.isPending}>
              <Save className="mr-1 h-4 w-4" />
              {saveMutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">불러오는 중...</p>
          ) : list.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              등록된 역할이 없습니다. &quot;추가&quot;로 역할을 등록하세요.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="w-44 pb-2 pr-2 font-medium">역할명</th>
                    <th className="min-w-[260px] pb-2 pr-2 font-medium">설명</th>
                    <th className="w-44 pb-2 pr-2 font-medium">System Code</th>
                    <th className="w-12 pb-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {list.map((r: any) => (
                    <tr key={r.id}>
                      <td className="py-2 pr-2">
                        <input
                          value={r.name}
                          onChange={(e) => handleChange(r.id, "name", e.target.value)}
                          placeholder="역할명"
                          className={inputClass}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          value={r.description ?? ""}
                          onChange={(e) =>
                            handleChange(r.id, "description", e.target.value)
                          }
                          placeholder="설명"
                          className={inputClass}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          value={r.systemCode ?? ""}
                          onChange={(e) =>
                            handleChange(r.id, "systemCode", e.target.value)
                          }
                          placeholder="예: Admin"
                          className={inputClass}
                        />
                      </td>
                      <td className="py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => handleRemove(r.id)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
