"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

const inputClass =
  "h-8 w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1 text-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring";

interface TicketItem {
  id: number;
  subject: string;
  content: string;
  category: string;
  status: string;
  priority: string;
  requesterName: string;
  requesterEmail?: string;
  assigneeName?: string;
  reply?: string;
  repliedAt?: string;
  createdAt: string;
}

const STATUS_TABS = [
  { value: "all", label: "전체" },
  { value: "open", label: "접수" },
  { value: "in_progress", label: "처리중" },
  { value: "resolved", label: "해결" },
  { value: "closed", label: "종료" },
];

const STATUS_BADGE: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};
const STATUS_LABEL: Record<string, string> = { open: "접수", in_progress: "처리중", resolved: "해결", closed: "종료" };
const PRIORITY_BADGE: Record<string, string> = { low: "text-gray-500", normal: "text-blue-600", high: "text-orange-600", urgent: "text-red-600" };
const PRIORITY_LABEL: Record<string, string> = { low: "낮음", normal: "보통", high: "높음", urgent: "긴급" };
const CATEGORY_LABEL: Record<string, string> = { general: "일반", bug: "버그", feature: "기능 요청", billing: "결제" };

export default function AdminSupportPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: tickets = [], isLoading } = useQuery<TicketItem[]>({
    queryKey: ["admin-support", statusFilter],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (statusFilter !== "all") sp.set("status", statusFilter);
      const res = await fetch(`/api/admin/support-tickets?${sp.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ id, reply }: { id: number; reply: string }) => {
      const res = await fetch("/api/admin/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reply", id, reply }),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support"] });
      setSelectedTicket(null);
      setReplyText("");
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: string }) => {
      const res = await fetch("/api/admin/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support"] });
      setSelectedTicket(null);
    },
  });

  const openCount = tickets.filter((t) => t.status === "open").length;

  return (
    <>
      <PageHeader title="고객 문의 관리" description="고객 문의를 접수하고 응답합니다." />

      {/* 요약 */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        {[
          { label: "전체", value: tickets.length, Icon: MessageSquare, color: "" },
          { label: "접수 (미처리)", value: openCount, Icon: AlertTriangle, color: openCount > 0 ? "text-red-600" : "" },
          { label: "처리중", value: tickets.filter((t) => t.status === "in_progress").length, Icon: Clock, color: "text-yellow-600" },
          { label: "해결", value: tickets.filter((t) => t.status === "resolved").length, Icon: CheckCircle2, color: "text-green-600" },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-3 py-4">
              <c.Icon className={`h-5 w-5 text-muted-foreground ${c.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* 티켓 목록 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-col space-y-2 pb-3">
              <CardTitle className="text-sm font-semibold">문의 목록</CardTitle>
              <div className="flex rounded-md border border-border">
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      statusFilter === tab.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">불러오는 중...</p>
              ) : tickets.length === 0 ? (
                <p className="py-10 text-center text-xs text-muted-foreground">문의가 없습니다.</p>
              ) : (
                <div className="space-y-1">
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => { setSelectedTicket(t); setReplyText(t.reply ?? ""); }}
                      className={`cursor-pointer rounded-md px-3 py-2.5 transition-colors ${
                        selectedTicket?.id === t.id ? "bg-accent" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[t.status] ?? ""}`}>
                          {STATUS_LABEL[t.status] ?? t.status}
                        </span>
                        <span className={`text-[10px] font-medium ${PRIORITY_BADGE[t.priority] ?? ""}`}>
                          {PRIORITY_LABEL[t.priority] ?? t.priority}
                        </span>
                        <span className="rounded bg-muted px-1 py-0.5 text-[9px]">{CATEGORY_LABEL[t.category] ?? t.category}</span>
                      </div>
                      <p className="mt-1 text-xs font-medium">{t.subject}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{t.requesterName} · {new Date(t.createdAt).toLocaleDateString("ko-KR")}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 상세 / 답변 */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                {selectedTicket ? "문의 상세" : "문의를 선택하세요"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedTicket ? (
                <p className="py-10 text-center text-xs text-muted-foreground">왼쪽 목록에서 문의를 선택하세요.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium">{selectedTicket.subject}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {selectedTicket.requesterName} ({selectedTicket.requesterEmail ?? "-"})
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-3 text-xs whitespace-pre-wrap">{selectedTicket.content}</div>

                  {selectedTicket.reply && (
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground">답변 ({selectedTicket.assigneeName})</p>
                      <div className="mt-1 rounded-md border border-primary/20 bg-primary/5 p-3 text-xs whitespace-pre-wrap">{selectedTicket.reply}</div>
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-muted-foreground">답변 작성</label>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className={inputClass + " h-24 resize-y"}
                      placeholder="답변을 입력하세요"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => replyMutation.mutate({ id: selectedTicket.id, reply: replyText })}
                      disabled={!replyText.trim()}
                      className="rounded bg-primary px-3 py-1.5 text-[10px] font-medium text-primary-foreground disabled:opacity-50"
                    >
                      답변 저장
                    </button>
                    {selectedTicket.status !== "resolved" && (
                      <button
                        onClick={() => statusMutation.mutate({ id: selectedTicket.id, action: "resolve" })}
                        className="rounded border border-green-300 px-3 py-1.5 text-[10px] text-green-700 hover:bg-green-50"
                      >
                        해결
                      </button>
                    )}
                    {selectedTicket.status !== "closed" && (
                      <button
                        onClick={() => statusMutation.mutate({ id: selectedTicket.id, action: "close" })}
                        className="rounded border px-3 py-1.5 text-[10px] hover:bg-muted"
                      >
                        종료
                      </button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
