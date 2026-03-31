"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Power, PowerOff, Eye, Save, RotateCcw } from "lucide-react";

const inputClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring";

interface ChatbotConfigData {
  id?: number;
  projectId: string;
  botName: string;
  theme: string;
  placeholder: string;
  welcomeMessage: string;
  ragNamespace: string;
  chatApiUrl: string;
  confirmApiUrl: string;
  isEnabled: boolean;
  position: string;
}

const defaultConfig: ChatbotConfigData = {
  projectId: "esg-on",
  botName: "ESG_On 어시스턴트",
  theme: "light",
  placeholder: "예: Scope 2 배출량 산출 방식, 활동자료 템플릿...",
  welcomeMessage: "안녕하세요. ESG 배출량·활동자료·보고 항목 관련 질문을 도와드릴게요.",
  ragNamespace: "esg-on-docs",
  chatApiUrl: "",
  confirmApiUrl: "",
  isEnabled: false,
  position: "bottom-right",
};

export default function AdminChatbotPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ChatbotConfigData>(defaultConfig);
  const [showPreview, setShowPreview] = useState(false);

  const { data: config, isLoading } = useQuery<ChatbotConfigData | null>({
    queryKey: ["admin-chatbot"],
    queryFn: async () => {
      const res = await fetch("/api/admin/chatbot");
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  // config 로드 시 form 초기화
  useEffect(() => {
    if (config) {
      setForm({
        projectId: config.projectId ?? defaultConfig.projectId,
        botName: config.botName ?? defaultConfig.botName,
        theme: config.theme ?? "light",
        placeholder: config.placeholder ?? "",
        welcomeMessage: config.welcomeMessage ?? "",
        ragNamespace: config.ragNamespace ?? "",
        chatApiUrl: config.chatApiUrl ?? "",
        confirmApiUrl: config.confirmApiUrl ?? "",
        isEnabled: config.isEnabled ?? false,
        position: config.position ?? "bottom-right",
      });
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async (data: ChatbotConfigData) => {
      const res = await fetch("/api/admin/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", data }),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-chatbot"] }),
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle" }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      setForm((p) => ({ ...p, isEnabled: data.isEnabled }));
      queryClient.invalidateQueries({ queryKey: ["admin-chatbot"] });
    },
  });

  const handleSave = () => saveMutation.mutate(form);
  const handleReset = () => setForm(defaultConfig);

  if (isLoading) {
    return (
      <>
        <PageHeader title="챗봇 관리" />
        <p className="mt-8 text-sm text-muted-foreground">불러오는 중...</p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="챗봇 관리"
        description="ESG On 챗봇의 연동 설정과 표시 옵션을 관리합니다."
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview((p) => !p)}
            className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted"
          >
            <Eye className="h-3.5 w-3.5" /> {showPreview ? "미리보기 닫기" : "미리보기"}
          </button>
          <button
            onClick={() => toggleMutation.mutate()}
            className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium ${
              form.isEnabled
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
          >
            {form.isEnabled ? (
              <><PowerOff className="h-3.5 w-3.5" /> 챗봇 OFF</>
            ) : (
              <><Power className="h-3.5 w-3.5" /> 챗봇 ON</>
            )}
          </button>
        </div>
      </PageHeader>

      {/* 상태 배너 */}
      <div className={`mt-6 flex items-center gap-3 rounded-lg border-2 px-4 py-3 ${
        form.isEnabled ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50"
      }`}>
        <Bot className={`h-6 w-6 ${form.isEnabled ? "text-green-600" : "text-gray-400"}`} />
        <div>
          <p className={`text-sm font-semibold ${form.isEnabled ? "text-green-800" : "text-gray-600"}`}>
            {form.isEnabled ? "챗봇이 활성화되어 있습니다" : "챗봇이 비활성화 상태입니다"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {form.isEnabled
              ? "사용자 화면 우측 하단에 챗봇 위젯이 표시됩니다."
              : "활성화하면 사용자 화면에 챗봇이 나타납니다."}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* 설정 폼 (2칸) */}
        <div className="space-y-6 lg:col-span-2">
          {/* 기본 연동 정보 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">연동 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    projectId <span className="text-muted-foreground">(API 요청에 사용)</span>
                  </label>
                  <input
                    value={form.projectId}
                    onChange={(e) => setForm((p) => ({ ...p, projectId: e.target.value }))}
                    className={inputClass}
                    placeholder="esg-on"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    RAG namespace <span className="text-muted-foreground">(표시·설정용)</span>
                  </label>
                  <input
                    value={form.ragNamespace}
                    onChange={(e) => setForm((p) => ({ ...p, ragNamespace: e.target.value }))}
                    className={inputClass}
                    placeholder="esg-on-docs"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    chat API URL <span className="text-muted-foreground">(비우면 기본값)</span>
                  </label>
                  <input
                    value={form.chatApiUrl}
                    onChange={(e) => setForm((p) => ({ ...p, chatApiUrl: e.target.value }))}
                    className={inputClass}
                    placeholder="/api/chat 또는 https://..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    confirm API URL <span className="text-muted-foreground">(선택)</span>
                  </label>
                  <input
                    value={form.confirmApiUrl}
                    onChange={(e) => setForm((p) => ({ ...p, confirmApiUrl: e.target.value }))}
                    className={inputClass}
                    placeholder="/api/chat/confirm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* UI 설정 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">UI 설정</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">봇 이름 (botName)</label>
                  <input
                    value={form.botName}
                    onChange={(e) => setForm((p) => ({ ...p, botName: e.target.value }))}
                    className={inputClass}
                    placeholder="ESG_On 어시스턴트"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">테마</label>
                  <select
                    value={form.theme}
                    onChange={(e) => setForm((p) => ({ ...p, theme: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">위젯 위치</label>
                  <select
                    value={form.position}
                    onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="bottom-right">우측 하단</option>
                    <option value="bottom-left">좌측 하단</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">입력창 placeholder</label>
                  <input
                    value={form.placeholder}
                    onChange={(e) => setForm((p) => ({ ...p, placeholder: e.target.value }))}
                    className={inputClass}
                    placeholder="예: Scope 2 배출량 산출 방식..."
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">환영 메시지 (welcomeMessage)</label>
                  <textarea
                    value={form.welcomeMessage}
                    onChange={(e) => setForm((p) => ({ ...p, welcomeMessage: e.target.value }))}
                    className={inputClass + " h-20 resize-y"}
                    placeholder="안녕하세요. ESG 배출량·활동자료·보고 항목 관련 질문을 도와드릴게요."
                  />
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={!form.projectId.trim() || saveMutation.isPending}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-5 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saveMutation.isPending ? "저장 중..." : "적용하기"}
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 rounded-md border px-4 py-2 text-xs font-medium hover:bg-muted"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> 초기화
                </button>
                {saveMutation.isSuccess && (
                  <span className="self-center text-xs text-green-600">저장되었습니다.</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 미리보기 (1칸) */}
        <div>
          {showPreview && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">미리보기</CardTitle>
              </CardHeader>
              <CardContent>
                <ChatbotPreview config={form} />
              </CardContent>
            </Card>
          )}

          {/* 연동 상태 */}
          <Card className={showPreview ? "mt-6" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">연동 상태</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <StatusRow label="projectId" value={form.projectId || "-"} ok={!!form.projectId} />
              <StatusRow label="chatApiUrl" value={form.chatApiUrl || "(기본값)"} ok={true} />
              <StatusRow label="ragNamespace" value={form.ragNamespace || "-"} ok={!!form.ragNamespace} />
              <StatusRow label="챗봇 상태" value={form.isEnabled ? "활성" : "비활성"} ok={form.isEnabled} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

/** 챗봇 위젯 미리보기 */
function ChatbotPreview({ config }: { config: ChatbotConfigData }) {
  const isDark = config.theme === "dark";

  return (
    <div className={`rounded-xl border-2 overflow-hidden ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-border"}`}>
      {/* 헤더 */}
      <div className={`flex items-center gap-2 px-4 py-3 ${isDark ? "bg-gray-800" : "bg-primary/10"}`}>
        <Bot className={`h-5 w-5 ${isDark ? "text-green-400" : "text-primary"}`} />
        <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-foreground"}`}>
          {config.botName || "챗봇"}
        </span>
        <div className="ml-auto flex h-2 w-2 rounded-full bg-green-500" />
      </div>

      {/* 대화 영역 */}
      <div className={`px-4 py-4 ${isDark ? "text-gray-200" : ""}`} style={{ minHeight: 160 }}>
        {config.welcomeMessage && (
          <div className={`mb-3 rounded-lg px-3 py-2 text-xs ${isDark ? "bg-gray-700" : "bg-muted"}`}>
            {config.welcomeMessage}
          </div>
        )}
        <div className={`rounded-lg px-3 py-2 text-xs ${isDark ? "bg-blue-900/40 text-blue-200" : "bg-primary/10 text-primary"} ml-auto max-w-[80%]`}>
          Scope 2 배출량은 어떻게 산출하나요?
        </div>
      </div>

      {/* 입력 영역 */}
      <div className={`border-t px-3 py-2.5 ${isDark ? "border-gray-700" : "border-border"}`}>
        <div className={`flex items-center rounded-lg border px-3 py-2 text-xs ${isDark ? "border-gray-600 bg-gray-800 text-gray-400" : "border-input text-muted-foreground"}`}>
          {config.placeholder || "메시지를 입력하세요..."}
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`flex items-center gap-1 font-mono ${ok ? "text-green-600" : "text-muted-foreground"}`}>
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${ok ? "bg-green-500" : "bg-gray-300"}`} />
        {value}
      </span>
    </div>
  );
}
