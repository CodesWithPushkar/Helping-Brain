import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import ButtonComponent from "../components/ButtonComponent";
import MessageContent from "./MessageContent";
import { ArrowRight, History, Plus, Loader2, Check } from "lucide-react";

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
  noteTitle?: string;
  onAddToNote?: (content: string) => void;
};

export default function ChatSidebar({ pageId, noteTitle, onAddToNote }: ChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatId, setChatId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [addedIndexes, setAddedIndexes] = useState<Set<number>>(new Set());

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<ChatSummary[]>([]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setChatId(null);
    setMessages([]);
    setInput("");
    setHistoryOpen(false);
    setAddedIndexes(new Set());
  }, [pageId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  function startNewChat() {
    setChatId(null);
    setMessages([]);
    setInput("");
    setHistoryOpen(false);
    setAddedIndexes(new Set());
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
      setAddedIndexes(new Set());
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleAddToNote(index: number, content: string) {
    if (!onAddToNote || addedIndexes.has(index)) return;
    onAddToNote(content);
    setAddedIndexes((prev) => new Set(prev).add(index));
  }

  return (
    <div className="relative w-96 shrink-0 h-[calc(100vh-3rem)] sticky top-6 flex flex-col bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-black/[0.06]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#1B1E2A]/35">
            Ask about this note
          </span>
          <div className="flex items-center gap-1">
            <ButtonComponent
              icon={Plus}
              className="!bg-transparent !text-[#1B1E2A]/40 hover:!bg-black/5 !rounded-full !p-1"
              onClick={startNewChat}
            />
            <div className="relative">
              <ButtonComponent
                icon={History}
                className={`!rounded-full !p-1 ${
                  historyOpen
                    ? "!bg-[#1B1E2A] !text-white"
                    : "!bg-transparent !text-[#1B1E2A]/40 hover:!bg-black/5"
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

        <h2 className="font-serif text-lg font-semibold text-[#1B1E2A] leading-snug">
          Chat about {noteTitle?.trim() || "this note"}
        </h2>
        <p className="mt-1 text-xs text-[#1B1E2A]/50 leading-relaxed">
          Helping Brain reads this note (and links) before it answers.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="text-sm text-[#1B1E2A]/40 leading-relaxed mt-2">
            Ask anything about this note. I can pull in linked pages when needed.
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={m.id ?? i} className="flex justify-end">
              <div className="max-w-[85%] bg-[#1B1E2A] text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={m.id ?? i} className="flex flex-col gap-1.5 items-start">
              <div className="flex items-center gap-1.5 text-[11px] text-[#1B1E2A]/40 font-mono">
                <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#1B1E2A]/10 text-[9px] leading-none">
                  +
                </span>
                Helping Brain
              </div>

              <div className="max-w-[92%] bg-[#F5EFDE] text-[#1B1E2A] rounded-2xl rounded-tl-md px-4 py-3">
                <MessageContent content={m.content} />
              </div>

              {onAddToNote && (
                <button
                  onClick={() => handleAddToNote(i, m.content)}
                  disabled={addedIndexes.has(i)}
                  className={`inline-flex items-center gap-1 rounded-full pl-2.5 pr-3 py-1 text-xs font-medium transition-colors ${
                    addedIndexes.has(i)
                      ? "bg-[#1B1E2A] text-white cursor-default"
                      : "bg-white border border-black/10 text-[#1B1E2A] hover:bg-black/[0.03] shadow-sm"
                  }`}
                >
                  {addedIndexes.has(i) ? (
                    <>
                      <Check size={12} /> Added
                    </>
                  ) : (
                    <>
                      <Plus size={12} /> Add to note
                    </>
                  )}
                </button>
              )}
            </div>
          )
        )}

        {sending && (
          <div className="flex flex-col gap-1.5 items-start">
            <div className="flex items-center gap-1.5 text-[11px] text-[#1B1E2A]/40 font-mono">
              <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#1B1E2A]/10 text-[9px] leading-none">
                +
              </span>
              Helping Brain
            </div>
            <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl rounded-tl-md bg-[#F5EFDE] text-[#1B1E2A]/50 text-sm">
              <Loader2 size={14} className="animate-spin" />
              Thinking…
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-black/[0.06] px-4 py-4">
        <div className="flex items-center gap-2 bg-[#F1EEE6] rounded-full pl-4 pr-1.5 py-1.5 border border-transparent focus-within:border-black/10 focus-within:bg-white transition-colors">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a follow-up…"
            className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[#1B1E2A] placeholder:text-[#1B1E2A]/35"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              input.trim() && !sending
                ? "bg-[#1B1E2A] text-white hover:bg-black"
                : "bg-black/5 text-[#1B1E2A]/30"
            }`}
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
          </button>
        </div>
        <p className="mt-2 px-1 text-[11px] text-[#1B1E2A]/35">
          Replies can be added to this note in one tap.
        </p>
      </div>
    </div>
  );
}