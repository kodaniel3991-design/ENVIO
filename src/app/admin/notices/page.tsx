"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pin, Eye, EyeOff, Pencil, Trash2, Plus } from "lucide-react";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

const inputClass =
  "h-8 w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1 text-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring";

const CATEGORY_LABELS: Record<string, string> = {
  general: "일반",
  update: "업데이트",
  maintenance: "점검",
};

interface NoticeItem {
  id: number;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  isPublished: boolean;
  authorName: string;
  publishedAt?: string;
  createdAt: string;
}

const emptyForm = { title: "", content: "", category: "general", isPinned: false, isPublished: false };

export default function AdminNoticesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: notices = [], isLoading } = useQuery<NoticeItem[]>({
    queryKey: ["admin-notices"],
    queryFn: async () => {
      const res = await fetch("/api/admin/notices");
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { action: "update", id: editingId, data } : { action: "create", data }),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notices"] });
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch("/api/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-notices"] }),
  });

  const handleEdit = (n: NoticeItem) => {
    setForm({ title: n.title, content: n.content, category: n.category, isPinned: n.isPinned, isPublished: n.isPublished });
    setEditingId(n.id);
    setShowForm(true);
  };

  return (
    <>
      <PageHeader title="공지사항 관리" description="플랫폼 공지사항을 작성하고 관리합니다.">
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
          className="flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> 공지 작성
        </button>
      </PageHeader>

      {/* 작성/수정 폼 */}
      {showForm && (
        <div className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">{editingId ? "공지 수정" : "새 공지 작성"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">제목 *</label>
                  <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className={inputClass} placeholder="공지 제목" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">카테고리</label>
                  <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className={inputClass}>
                    <option value="general">일반</option>
                    <option value="update">업데이트</option>
                    <option value="maintenance">점검</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">내용 *</label>
                <RichTextEditor
                  content={form.content}
                  onChange={(html) => setForm((p) => ({ ...p, content: html }))}
                  placeholder="공지 내용을 입력하세요"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-xs">
                  <input type="checkbox" checked={form.isPinned} onChange={(e) => setForm((p) => ({ ...p, isPinned: e.target.checked }))} />
                  상단 고정
                </label>
                <label className="flex items-center gap-1.5 text-xs">
                  <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))} />
                  즉시 게시
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => saveMutation.mutate(form)}
                  disabled={!form.title.trim() || !form.content.trim()}
                  className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
                >
                  {editingId ? "수정" : "등록"}
                </button>
                <button onClick={() => { setShowForm(false); setEditingId(null); }} className="rounded-md border px-4 py-2 text-xs hover:bg-muted">취소</button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 공지 목록 */}
      <div className="mt-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              공지 목록 <span className="font-normal text-muted-foreground">({notices.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">불러오는 중...</p>
            ) : notices.length === 0 ? (
              <p className="py-10 text-center text-xs text-muted-foreground">등록된 공지가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {notices.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 rounded-lg border border-border p-4 hover:bg-muted/30">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {n.isPinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">{CATEGORY_LABELS[n.category] ?? n.category}</span>
                        {n.isPublished ? (
                          <Eye className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <h3 className="mt-1 text-sm font-medium">{n.title}</h3>
                      <div className="mt-1 line-clamp-2 text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: n.content }} />
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        {n.authorName} · {new Date(n.createdAt).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button onClick={() => handleEdit(n)} className="rounded border p-1.5 hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => deleteMutation.mutate(n.id)} className="rounded border p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
