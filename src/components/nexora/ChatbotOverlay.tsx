import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Plus,
  Loader2,
  Copy,
  RefreshCcw,
  Trash2,
  Pencil,
  History,
  AlertTriangle,
  Square,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  listConversations,
  getConversation,
  createConversation,
  renameConversation,
  deleteConversation,
} from "@/lib/chat.functions";

type ConversationRow = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

function messageText(m: UIMessage): string {
  return (m.parts ?? [])
    .map((p) => (p.type === "text" ? (p as { text: string }).text : ""))
    .join("");
}

export function ChatbotOverlay() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setToken(s?.access_token ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshConversations = useCallback(async () => {
    if (!user) return [] as ConversationRow[];
    try {
      const rows = (await listConversations()) as ConversationRow[];
      setConversations(rows);
      return rows;
    } catch (e) {
      console.error(e);
      return [] as ConversationRow[];
    }
  }, [user]);

  const openConversation = useCallback(async (id: string) => {
    setBusy(true);
    try {
      const res = await getConversation({ data: { conversationId: id } });
      setActiveId(id);
      setInitialMessages(
        (res.messages as unknown as { message: UIMessage }[]).map((m) => m.message).filter(Boolean),
      );
      setShowHistory(false);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't load that conversation");
    } finally {
      setBusy(false);
    }
  }, []);

  const startConversation = useCallback(async () => {
    try {
      const row = (await createConversation({ data: {} })) as ConversationRow;
      setConversations((c) => [row, ...c]);
      setActiveId(row.id);
      setInitialMessages([]);
      setShowHistory(false);
      setTimeout(() => inputRef.current?.focus(), 60);
      return row.id;
    } catch (e) {
      console.error(e);
      toast.error("Couldn't start a new conversation");
      return null;
    }
  }, []);

  // On first open with a signed-in user, load history and resume the latest thread.
  useEffect(() => {
    if (!open || !user || activeId) return;
    (async () => {
      const rows = await refreshConversations();
      if (rows.length) await openConversation(rows[0].id);
      else await startConversation();
    })();
  }, [open, user, activeId, refreshConversations, openConversation, startConversation]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: (): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {}),
        body: () => ({ conversationId: activeId }),
      }),
    [token, activeId],
  );

  const { messages, sendMessage, status, error, regenerate, setMessages, stop } = useChat({
    id: activeId ?? "nexora-empty",
    messages: initialMessages,
    transport,
    onError: (e) => console.error("Nexora AI error", e),
    onFinish: () => {
      refreshConversations();
    },
  });

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, setMessages]);

  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming, error]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    if (!user || !token) {
      toast.error("Please sign in to use Nexora AI");
      return;
    }
    let id = activeId;
    if (!id) id = await startConversation();
    if (!id) return;
    setInput("");
    await sendMessage({ text });
  }, [input, isStreaming, user, token, activeId, startConversation, sendMessage]);

  const copyMessage = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  const rename = async (row: ConversationRow) => {
    const title = window.prompt("Rename conversation", row.title);
    if (!title) return;
    setConversations((c) => c.map((x) => (x.id === row.id ? { ...x, title } : x)));
    try {
      await renameConversation({ data: { conversationId: row.id, title } });
    } catch (e) {
      console.error(e);
      toast.error("Couldn't rename");
    }
  };

  const remove = async (row: ConversationRow) => {
    if (!confirm("Delete this conversation?")) return;
    try {
      await deleteConversation({ data: { conversationId: row.id } });
      setConversations((c) => c.filter((x) => x.id !== row.id));
      if (activeId === row.id) {
        setActiveId(null);
        setInitialMessages([]);
      }
    } catch (e) {
      console.error(e);
      toast.error("Couldn't delete");
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full brand-gradient text-white shadow-[0_8px_32px_-8px_rgba(168,85,247,0.7)] transition hover:scale-105"
        aria-label="Open Nexora assistant"
      >
        {open ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 flex h-[600px] max-h-[calc(100vh-8rem)] w-[400px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_24px_64px_-16px_rgba(0,0,0,0.7)]">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg brand-gradient">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">Nexora Assistant</div>
              <div className="truncate text-[11px] text-muted-foreground">
                {isStreaming ? "Generating…" : "AI workplace assistant"}
              </div>
            </div>
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition hover:bg-surface-elevated hover:text-foreground"
              aria-label="Conversation history"
            >
              <History className="h-4 w-4" />
            </button>
            <button
              onClick={startConversation}
              className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition hover:bg-surface-elevated hover:text-foreground"
              aria-label="New conversation"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {showHistory && (
            <div className="max-h-56 overflow-y-auto border-b border-border bg-background/60 p-2">
              {conversations.length === 0 && (
                <p className="px-2 py-3 text-xs text-muted-foreground">No conversations yet.</p>
              )}
              {conversations.map((c) => (
                <div
                  key={c.id}
                  className={`group flex items-center gap-1 rounded-md px-2 py-1.5 text-xs ${
                    c.id === activeId ? "bg-primary/15 text-primary" : "hover:bg-surface-elevated"
                  }`}
                >
                  <button
                    onClick={() => openConversation(c.id)}
                    className="min-w-0 flex-1 truncate text-left"
                  >
                    {c.title}
                  </button>
                  <button onClick={() => rename(c)} aria-label="Rename" className="opacity-60 hover:opacity-100">
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button onClick={() => remove(c)} aria-label="Delete" className="opacity-60 hover:opacity-100">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {!user && (
              <div className="rounded-xl border border-border bg-surface-elevated p-3 text-xs text-muted-foreground">
                Sign in to chat with Nexora — your conversations are saved privately to your account.
              </div>
            )}

            {user && messages.length === 0 && !busy && (
              <div className="rounded-xl bg-surface-elevated p-3 text-sm leading-relaxed text-muted-foreground">
                Ask me anything about your work — drafting emails, preparing for meetings, organising
                your day, or thinking through a decision.
              </div>
            )}

            {busy && (
              <div className="grid place-items-center py-6 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}

            {messages.map((m) => {
              const text = messageText(m);
              return (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      m.role === "user" ? "brand-gradient text-white" : "bg-surface-elevated text-foreground"
                    }`}
                  >
                    {m.role === "user" ? (
                      <span className="whitespace-pre-wrap">{text}</span>
                    ) : (
                      <>
                        <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-background prose-pre:text-xs prose-headings:mt-3 prose-headings:mb-1 prose-p:my-1.5 prose-li:my-0.5">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
                        </div>
                        {text && !isStreaming && (
                          <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                            <button
                              onClick={() => copyMessage(text)}
                              className="flex items-center gap-1 text-[10px] hover:text-foreground"
                            >
                              <Copy className="h-3 w-3" /> Copy
                            </button>
                            <button
                              onClick={() => regenerate()}
                              className="flex items-center gap-1 text-[10px] hover:text-foreground"
                            >
                              <RefreshCcw className="h-3 w-3" /> Regenerate
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {isStreaming && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl bg-surface-elevated px-3 py-2.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-foreground">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-destructive" />
                <div className="flex-1">
                  <p>Unable to connect to Nexora AI right now. Please try again.</p>
                  <button
                    onClick={() => regenerate()}
                    className="mt-1.5 flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    <RefreshCcw className="h-3 w-3" /> Retry
                  </button>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border p-3">
            <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-primary">
              <textarea
                ref={inputRef}
                value={input}
                rows={1}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask Nexora anything…"
                className="max-h-28 flex-1 resize-none bg-transparent py-1 text-sm placeholder:text-muted-foreground focus:outline-none"
              />
              {isStreaming ? (
                <button
                  onClick={() => stop()}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground"
                  aria-label="Stop generating"
                >
                  <Square className="h-3 w-3" />
                </button>
              ) : (
                <button
                  onClick={send}
                  disabled={!input.trim()}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md brand-gradient text-white disabled:opacity-40"
                  aria-label="Send"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              AI-generated. Always review before sending.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
