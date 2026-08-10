import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import ButtonComponent from "../components/ButtonComponent";
import { Send, History, Plus, Sparkles, Loader2 } from "lucide-react";

type Role = "user" | "assistant";

type ChatMessage = {
  id?: number;
  role: Role;
  content: string;
};

type ChatSummary = {
  id: number;
  title: string;
  created_at: string;
};

type ChatSidebarProps = {
  pageId: string | number;
};

export default function ChatSidebar({ pageId }: ChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatId, setChatId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<ChatSummary[]>([]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setChatId(null);
    setMessages([]);
    setInput("");
    setHistoryOpen(false);
  }, [pageId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  function startNewChat() {
    setChatId(null);
    setMessages([]);
    setInput("");
    setHistoryOpen(false);
  }

  async function loadHistory() {
    const token = localStorage.getItem("token");
    setHistoryLoading(true);
    try {
      const res = await api.get(`/ai/chats?page_id=${pageId}`, {
        headers: { Authorization: token },
      });
      setHistory(res.data.chats);
    } catch (err) {
      console.error("Failed to load chat history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }

  function toggleHistory() {
    const next = !historyOpen;
    setHistoryOpen(next);
    if (next) loadHistory();
  }

  async function openChat(id: number) {
    const token = localStorage.getItem("token");
    try {
      const res = await api.get(`/ai/chat/${id}`, {
        headers: { Authorization: token },
      });
      const chat = res.data.chat;
      setChatId(chat.id);
      setMessages(
        chat.messages.map((m: ChatMessage) => ({ id: m.id, role: m.role, content: m.content }))
      );
      setHistoryOpen(false);
    } catch (err) {
      console.error("Failed to open chat:", err);
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    const token = localStorage.getItem("token");

    try {
      if (chatId === null) {
        const res = await api.post(
          "/ai/newchat",
          { message: text, page_id: Number(pageId) },
          { headers: { Authorization: token } }
        );
        const chat = res.data.chat;
        setChatId(chat.id);
        setMessages(
          chat.messages.map((m: ChatMessage) => ({ id: m.id, role: m.role, content: m.content }))
        );
      } else {
        const res = await api.post(
          `/ai/chat/${chatId}`,
          { message: text, page_id: Number(pageId) },
          { headers: { Authorization: token } }
        );
        const assistantMessage = res.data.assistantMessage as ChatMessage;
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong sending that. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="relative w-80 shrink-0 h-[calc(100vh-3rem)] sticky top-6 flex flex-col bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06]">
        <div className="flex items-center gap-2 text-[#1B1E2A]">
          <Sparkles size={16} className="text-[#E2A63B]" />
          <span className="text-sm font-semibold">Helping Brain</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ButtonComponent
            icon={Plus}
            className="!bg-transparent !text-[#1B1E2A]/60 hover:!bg-black/5 !rounded-full !p-1.5"
            onClick={startNewChat}
          />
          <div className="relative">
            <ButtonComponent
              icon={History}
              className={`!rounded-full !p-1.5 ${
                historyOpen
                  ? "!bg-[#1B1E2A] !text-white"
                  : "!bg-transparent !text-[#1B1E2A]/60 hover:!bg-black/5"
              }`}
              onClick={toggleHistory}
            />

            {historyOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-black/10 shadow-xl p-2 z-10 max-h-72 overflow-y-auto">
                {historyLoading && (
                  <div className="px-2 py-3 text-sm text-[#1B1E2A]/40">Loading…</div>
                )}
                {!historyLoading && history.length === 0 && (
                  <div className="px-2 py-3 text-sm text-[#1B1E2A]/40">No past chats yet</div>
                )}
                {!historyLoading &&
                  history.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => openChat(c.id)}
                      className={`w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-black/5 ${
                        c.id === chatId ? "bg-[#FAF8F3] font-medium" : ""
                      }`}
                    >
                      {c.title}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="text-sm text-[#1B1E2A]/40 leading-relaxed mt-2">
            Ask anything about this note. I can pull in linked pages when needed.
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={m.id ?? i}
            className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === "user"
                ? "self-end bg-[#1B1E2A] text-white rounded-br-sm"
                : "self-start bg-[#FAF8F3] text-[#1B1E2A] rounded-bl-sm"
            }`}
          >
            {m.content}
          </div>
        ))}

        {sending && (
          <div className="self-start flex items-center gap-1.5 px-3 py-2 rounded-2xl rounded-bl-sm bg-[#FAF8F3] text-[#1B1E2A]/50 text-sm">
            <Loader2 size={14} className="animate-spin" />
            Thinking…
          </div>
        )}
      </div>

      <div className="border-t border-black/[0.06] p-3">
        <div className="flex items-end gap-2 bg-[#FAF8F3] rounded-xl px-3 py-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this note…"
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none text-sm text-[#1B1E2A] placeholder:text-[#1B1E2A]/35 max-h-28"
          />
          <ButtonComponent
            icon={Send}
            className={`!rounded-full !p-1.5 shrink-0 ${
              input.trim() && !sending
                ? "!bg-[#1B1E2A] !text-white hover:!bg-black"
                : "!bg-black/5 !text-[#1B1E2A]/30"
            }`}
            onClick={sendMessage}
          />
        </div>
      </div>
    </div>
  );
}