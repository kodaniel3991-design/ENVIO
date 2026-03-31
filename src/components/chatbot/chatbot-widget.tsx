"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bot, X, Send, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatbotConfig {
  enabled: boolean;
  projectId?: string;
  botName?: string;
  theme?: string;
  placeholder?: string;
  welcomeMessage?: string;
  chatApiUrl?: string;
  position?: string;
}

interface Message {
  role: "user" | "bot";
  content: string;
}

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: config } = useQuery<ChatbotConfig>({
    queryKey: ["chatbot-config"],
    queryFn: async () => {
      const res = await fetch("/api/chatbot/config");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // 비활성화 시 아무것도 렌더하지 않음
  if (!config?.enabled) return null;

  const isDark = config.theme === "dark";
  const isRight = config.position !== "bottom-left";

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const apiUrl = config.chatApiUrl || "/api/chat";
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          projectId: config.projectId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "bot", content: data.reply ?? data.message ?? "응답을 받지 못했습니다." },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "bot", content: "오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "서버에 연결할 수 없습니다." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 플로팅 버튼만 (닫혀있을 때)
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105",
          isDark ? "bg-gray-800 text-green-400" : "bg-primary text-primary-foreground",
          isRight ? "bottom-6 right-6" : "bottom-6 left-6"
        )}
        title={config.botName ?? "챗봇"}
      >
        <Bot className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col overflow-hidden rounded-xl border-2 shadow-2xl transition-all",
        minimized ? "h-12" : "h-[500px]",
        "w-[380px]",
        isDark ? "border-gray-700 bg-gray-900 text-gray-100" : "border-border bg-card text-foreground",
        isRight ? "bottom-6 right-6" : "bottom-6 left-6"
      )}
    >
      {/* 헤더 */}
      <div
        className={cn(
          "flex shrink-0 items-center gap-2 px-4 py-3 cursor-pointer",
          isDark ? "bg-gray-800" : "bg-primary/10"
        )}
        onClick={() => setMinimized((p) => !p)}
      >
        <Bot className={cn("h-5 w-5", isDark ? "text-green-400" : "text-primary")} />
        <span className="flex-1 text-sm font-semibold">{config.botName ?? "챗봇"}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setMinimized((p) => !p); }}
            className="rounded p-1 hover:bg-black/10"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); setMinimized(false); }}
            className="rounded p-1 hover:bg-black/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {/* 환영 메시지 */}
            {config.welcomeMessage && messages.length === 0 && (
              <div className={cn("rounded-lg px-3 py-2 text-sm", isDark ? "bg-gray-700" : "bg-muted")}>
                {config.welcomeMessage}
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                  msg.role === "user"
                    ? cn("ml-auto", isDark ? "bg-blue-900/50 text-blue-100" : "bg-primary/10 text-primary")
                    : cn(isDark ? "bg-gray-700" : "bg-muted")
                )}
              >
                {msg.content}
              </div>
            ))}

            {loading && (
              <div className={cn("rounded-lg px-3 py-2 text-sm", isDark ? "bg-gray-700" : "bg-muted")}>
                <span className="animate-pulse">응답 생성 중...</span>
              </div>
            )}
          </div>

          {/* 입력 영역 */}
          <div className={cn("shrink-0 border-t px-3 py-2.5", isDark ? "border-gray-700" : "border-border")}>
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={config.placeholder ?? "메시지를 입력하세요..."}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-sm outline-none",
                  isDark
                    ? "border-gray-600 bg-gray-800 placeholder:text-gray-500"
                    : "border-input bg-background placeholder:text-muted-foreground"
                )}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                  isDark
                    ? "bg-green-600 text-white hover:bg-green-500 disabled:bg-gray-700"
                    : "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
                )}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
