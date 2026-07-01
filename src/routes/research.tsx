import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import mammoth from "mammoth/mammoth.browser";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Star,
  Trash2,
  FileUp,
  FileText,
  Loader2,
  Sparkles,
  Copy,
  Download,
  Send,
  Paperclip,
  X,
  Mail,
  ClipboardList,
  CalendarDays,
  RefreshCcw,
  ChevronDown,
} from "lucide-react";

import { Shell } from "@/components/nexora/Shell";
import { Card, Pill, BrandButton, GhostButton } from "@/components/nexora/ui";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  listSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
  addDocument,
  removeDocument,
} from "@/lib/research.functions";
import {
  RESEARCH_MODES,
  COMPLEXITY_LEVELS,
  extractFollowups,
  type ResearchMode,
  type Complexity,
} from "@/lib/research-prompts";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research Lab — Nexora" },
      { name: "description", content: "AI-powered research analyst: summarise, analyse, compare and act on any document." },
    ],
  }),
  component: ResearchPage,
});

type SessionRow = {
  id: string;
  title: string;
  mode: string;
  complexity: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

type DocRow = {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  created_at: string;
};

const MAX_UPLOAD_MB = 20;
const ACCEPT = ".pdf,.docx,.doc,.txt,.md,.markdown,.rtf,.csv,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/csv,application/vnd.openxmlformats-officedocument.presentationml.presentation";

const SUGGESTED_TOPICS = [
  "Summarise this quarter's board deck",
  "Compare two supplier proposals",
  "Extract risks from a project charter",
  "Turn meeting notes into action items",
  "Analyse a competitor's annual report",
  "Draft strategy recommendations from a market study",
];

async function extractText(file: File): Promise<string | null> {
  const name = file.name.toLowerCase();
  const type = file.type;
  try {
    if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".markdown") || name.endsWith(".csv") || type.startsWith("text/")) {
      return (await file.text()).slice(0, 400_000);
    }
    if (name.endsWith(".docx")) {
      const buf = await file.arrayBuffer();
      const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
      return value.slice(0, 400_000);
    }
    if (name.endsWith(".pdf") || type === "application/pdf") {
      // PDFs: pass filename only for now; full parse would need pdf.js. AI can still ask about it via context.
      return `[PDF: ${file.name}. Content will be referenced by filename. Ask the user for a specific section if needed.]`;
    }
    if (name.endsWith(".pptx")) {
      return `[PPTX: ${file.name}. Slide text extraction is limited in-browser.]`;
    }
    return null;
  } catch (e) {
    console.error("extractText error", e);
    return null;
  }
}

function useSessionsQuery() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listSessions();
      setSessions(data as SessionRow[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return { sessions, loading, refresh, setSessions };
}

function ResearchPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  const { sessions, refresh, setSessions } = useSessionsQuery();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [documents, setDocuments] = useState<DocRow[]>([]);
  const [mode, setMode] = useState<ResearchMode>("deep_analysis");
  const [complexity, setComplexity] = useState<Complexity>("professional");
  const [search, setSearch] = useState("");
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setToken(s?.access_token ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load a session
  const loadSession = useCallback(async (id: string) => {
    setLoadingSession(true);
    try {
      const res = await getSession({ data: { sessionId: id } });
      setActiveId(id);
      setMode((res.session.mode as ResearchMode) || "deep_analysis");
      setComplexity((res.session.complexity as Complexity) || "professional");
      setDocuments(res.documents as DocRow[]);
      setInitialMessages(
        (res.messages as { message: UIMessage }[]).map((m) => m.message).filter(Boolean),
      );
    } catch (e) {
      console.error(e);
      toast.error("Couldn't load session");
    } finally {
      setLoadingSession(false);
    }
  }, []);

  // Create new session
  const newSession = useCallback(async () => {
    try {
      const row = await createSession({ data: { title: "New research", mode, complexity } });
      const r = row as SessionRow;
      setSessions((s) => [r, ...s]);
      setActiveId(r.id);
      setInitialMessages([]);
      setDocuments([]);
      setSidebarOpen(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't start a new session");
    }
  }, [mode, complexity, setSessions]);

  // Auto-select or create on load
  useEffect(() => {
    if (!user || activeId) return;
    if (sessions.length) loadSession(sessions[0].id);
  }, [user, sessions, activeId, loadSession]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/research/chat",
        headers: () => (token ? { Authorization: `Bearer ${token}` } : {}),
        body: () => ({ sessionId: activeId, mode, complexity }),
      }),
    [token, activeId, mode, complexity],
  );

  const {
    messages,
    sendMessage,
    status,
    error,
    regenerate,
    setMessages,
    stop,
  } = useChat({
    id: activeId ?? "empty",
    messages: initialMessages,
    transport,
    onError: (e) => {
      console.error(e);
      toast.error(e.message || "AI request failed");
    },
  });

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, setMessages]);

  const isStreaming = status === "streaming" || status === "submitted";

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeId]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      if (!activeId) {
        await newSession();
        // Session id updates async, but useChat needs a real session for the request body.
        // Fetch the just-created session id via a small retry loop is overkill; instead, guard.
        toast.info("Starting a new session — send again");
        return;
      }
      if (!token) {
        toast.error("Please sign in");
        return;
      }
      setInput("");
      await sendMessage({ text });
    },
    [activeId, newSession, token, sendMessage],
  );

  // Files
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!user) return;
      let sessionId = activeId;
      if (!sessionId) {
        const row = await createSession({ data: { title: "New research", mode, complexity } });
        const r = row as SessionRow;
        setSessions((s) => [r, ...s]);
        setActiveId(r.id);
        sessionId = r.id;
      }
      setUploading(true);
      try {
        for (const file of Array.from(files)) {
          if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
            toast.error(`${file.name} exceeds ${MAX_UPLOAD_MB} MB`);
            continue;
          }
          const path = `${user.id}/${sessionId}/${Date.now()}-${file.name}`;
          const { error: upErr } = await supabase.storage
            .from("research-uploads")
            .upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream" });
          if (upErr) {
            toast.error(`Upload failed: ${file.name}`);
            continue;
          }
          const extracted = await extractText(file);
          const doc = await addDocument({
            data: {
              sessionId: sessionId!,
              fileName: file.name,
              mimeType: file.type || "application/octet-stream",
              sizeBytes: file.size,
              storagePath: path,
              extractedText: extracted,
            },
          });
          setDocuments((d) => [...d, doc as DocRow]);
          toast.success(`Added ${file.name}`);
        }
      } finally {
        setUploading(false);
      }
    },
    [activeId, complexity, mode, setSessions, user],
  );

  const deleteDoc = useCallback(async (id: string) => {
    try {
      await removeDocument({ data: { documentId: id } });
      setDocuments((d) => d.filter((x) => x.id !== id));
    } catch (e) {
      console.error(e);
      toast.error("Couldn't remove file");
    }
  }, []);

  const toggleFavorite = useCallback(
    async (id: string, next: boolean) => {
      setSessions((s) => s.map((x) => (x.id === id ? { ...x, is_favorite: next } : x)));
      try {
        await updateSession({ data: { sessionId: id, is_favorite: next } });
      } catch (e) {
        console.error(e);
      }
    },
    [setSessions],
  );

  const renameSession = useCallback(
    async (id: string) => {
      const title = window.prompt("Rename session");
      if (!title) return;
      setSessions((s) => s.map((x) => (x.id === id ? { ...x, title } : x)));
      try {
        await updateSession({ data: { sessionId: id, title } });
      } catch (e) {
        console.error(e);
      }
    },
    [setSessions],
  );

  const removeSession = useCallback(
    async (id: string) => {
      if (!confirm("Delete this research session and its uploads?")) return;
      try {
        await deleteSession({ data: { sessionId: id } });
        setSessions((s) => s.filter((x) => x.id !== id));
        if (activeId === id) {
          setActiveId(null);
          setInitialMessages([]);
          setDocuments([]);
        }
      } catch (e) {
        console.error(e);
        toast.error("Couldn't delete");
      }
    },
    [activeId, setSessions],
  );

  const persistMode = useCallback(
    async (m: ResearchMode) => {
      setMode(m);
      if (activeId) await updateSession({ data: { sessionId: activeId, mode: m } }).catch(() => {});
    },
    [activeId],
  );
  const persistComplexity = useCallback(
    async (c: Complexity) => {
      setComplexity(c);
      if (activeId) await updateSession({ data: { sessionId: activeId, complexity: c } }).catch(() => {});
    },
    [activeId],
  );

  const filteredSessions = useMemo(() => {
    let list = sessions;
    if (showFavOnly) list = list.filter((s) => s.is_favorite);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((s) => s.title.toLowerCase().includes(q));
    return list;
  }, [sessions, search, showFavOnly]);

  const lastAssistantText = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "assistant") {
        return m.parts
          .map((p) => (p.type === "text" ? (p as { text: string }).text : ""))
          .join("");
      }
    }
    return "";
  }, [messages]);

  const followups = useMemo(() => extractFollowups(lastAssistantText), [lastAssistantText]);

  const cleanText = (text: string) => text.replace(/### Follow-up[\s\S]*$/, "").trim();

  const exportMarkdown = () => {
    if (!lastAssistantText) return;
    const blob = new Blob([cleanText(lastAssistantText)], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexora-research-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyResult = async () => {
    if (!lastAssistantText) return;
    await navigator.clipboard.writeText(cleanText(lastAssistantText));
    toast.success("Copied to clipboard");
  };

  const sendToEmail = () => {
    const text = cleanText(lastAssistantText);
    if (text) sessionStorage.setItem("nexora:email-context", text);
    navigate({ to: "/email" });
  };
  const sendToTasks = () => {
    const text = cleanText(lastAssistantText);
    if (text) sessionStorage.setItem("nexora:tasks-context", text);
    navigate({ to: "/tasks" });
  };

  if (authLoading) {
    return (
      <Shell title="Research Lab" subtitle="AI Research Analyst">
        <div className="grid place-items-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      title="Research Lab"
      subtitle="Your AI Research Analyst"
      actions={
        <BrandButton onClick={newSession}>
          <Plus className="h-4 w-4" /> New research
        </BrandButton>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        {/* Sessions sidebar */}
        <aside
          className={`${sidebarOpen ? "fixed inset-0 z-40 block bg-background/95 p-4" : "hidden"} lg:static lg:block`}
        >
          <Card className="flex h-full flex-col p-3 lg:h-[calc(100vh-160px)] lg:sticky lg:top-24">
            <div className="flex items-center justify-between pb-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Research history
              </div>
              <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search history…"
                className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-2 text-xs focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex gap-1 pb-2">
              <button
                onClick={() => setShowFavOnly(false)}
                className={`flex-1 rounded-md px-2 py-1 text-[11px] font-medium ${!showFavOnly ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                All
              </button>
              <button
                onClick={() => setShowFavOnly(true)}
                className={`flex-1 rounded-md px-2 py-1 text-[11px] font-medium ${showFavOnly ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Star className="mr-1 inline h-3 w-3" /> Favorites
              </button>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto pr-1">
              {filteredSessions.length === 0 && (
                <div className="px-2 py-6 text-center text-xs text-muted-foreground">No sessions yet. Start one below.</div>
              )}
              {filteredSessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    loadSession(s.id);
                    setSidebarOpen(false);
                  }}
                  className={`group cursor-pointer rounded-md border p-2 transition ${
                    activeId === s.id
                      ? "border-primary/40 bg-primary/10"
                      : "border-transparent bg-surface-elevated/30 hover:border-border hover:bg-surface-elevated/60"
                  }`}
                >
                  <div className="flex items-start gap-1.5">
                    <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium">{s.title}</div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground">
                        {RESEARCH_MODES[s.mode as ResearchMode]?.label ?? s.mode} ·{" "}
                        {new Date(s.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <div className="flex opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(s.id, !s.is_favorite);
                        }}
                        title="Favorite"
                        className="p-1 text-muted-foreground hover:text-primary"
                      >
                        <Star className={`h-3 w-3 ${s.is_favorite ? "fill-primary text-primary" : ""}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          renameSession(s.id);
                        }}
                        title="Rename"
                        className="p-1 text-muted-foreground hover:text-foreground"
                      >
                        <RefreshCcw className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSession(s.id);
                        }}
                        title="Delete"
                        className="p-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    {s.is_favorite && (
                      <Star className="h-3 w-3 shrink-0 fill-primary text-primary opacity-100 group-hover:opacity-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>

        {/* Main panel */}
        <section className="flex min-h-0 flex-col">
          <button
            onClick={() => setSidebarOpen(true)}
            className="mb-2 inline-flex items-center gap-1 self-start rounded-md border border-border bg-surface-elevated px-2 py-1 text-[11px] font-medium text-muted-foreground lg:hidden"
          >
            <ChevronDown className="h-3 w-3 rotate-90" /> History
          </button>

          {/* Mode / complexity toolbar */}
          <Card className="mb-3 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Mode</span>
              {(Object.keys(RESEARCH_MODES) as ResearchMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => persistMode(m)}
                  className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition ${
                    mode === m
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-surface-elevated text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {RESEARCH_MODES[m].label}
                </button>
              ))}
              <span className="ml-2 hidden text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:inline">
                Explain
              </span>
              <div className="flex overflow-hidden rounded-md border border-border">
                {(Object.keys(COMPLEXITY_LEVELS) as Complexity[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => persistComplexity(c)}
                    className={`px-2 py-1 text-[11px] font-medium transition ${
                      complexity === c ? "bg-primary/20 text-primary" : "bg-surface-elevated text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c[0].toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">{RESEARCH_MODES[mode].description}</div>
          </Card>

          {/* Chat surface */}
          <Card
            className={`relative flex min-h-[420px] flex-1 flex-col overflow-hidden transition ${dragOver ? "ring-2 ring-primary" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
            }}
          >
            <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
              {loadingSession ? (
                <div className="grid place-items-center py-16 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <EmptyState
                  onPick={(t) => send(t)}
                  onUpload={() => document.getElementById("nex-research-file")?.click()}
                />
              ) : (
                <div className="space-y-6">
                  {messages.map((m) => (
                    <MessageBlock key={m.id} m={m} />
                  ))}
                  {isStreaming && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Researching…
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* Result toolbar */}
            {lastAssistantText && !isStreaming && (
              <div className="flex flex-wrap items-center gap-2 border-t border-border bg-surface-elevated/40 px-4 py-2">
                <GhostButton onClick={copyResult}>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </GhostButton>
                <GhostButton onClick={exportMarkdown}>
                  <Download className="h-3.5 w-3.5" /> Export MD
                </GhostButton>
                <GhostButton onClick={() => regenerate()}>
                  <RefreshCcw className="h-3.5 w-3.5" /> Regenerate
                </GhostButton>
                <div className="mx-1 h-4 w-px bg-border" />
                <GhostButton onClick={sendToEmail}>
                  <Mail className="h-3.5 w-3.5" /> Draft email
                </GhostButton>
                <GhostButton onClick={sendToTasks}>
                  <ClipboardList className="h-3.5 w-3.5" /> Create tasks
                </GhostButton>
                <GhostButton onClick={sendToTasks}>
                  <CalendarDays className="h-3.5 w-3.5" /> Schedule
                </GhostButton>
              </div>
            )}

            {/* Follow-ups */}
            {followups.length > 0 && !isStreaming && (
              <div className="border-t border-border bg-surface-elevated/20 px-4 py-3">
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Suggested follow-ups
                </div>
                <div className="flex flex-wrap gap-2">
                  {followups.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => send(f)}
                      className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] text-foreground/90 hover:border-primary hover:text-primary"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="border-t border-destructive/40 bg-destructive/10 px-4 py-2 text-[11px] text-destructive">
                {error.message}
              </div>
            )}

            {/* Composer */}
            <div className="border-t border-border bg-background/50 p-3">
              <div className="rounded-lg border border-border bg-surface p-2 focus-within:border-primary">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  rows={2}
                  placeholder="Ask a research question, paste text, or drop a document…"
                  className="max-h-40 min-h-[48px] w-full resize-none bg-transparent px-2 py-1 text-sm placeholder:text-muted-foreground focus:outline-none"
                />
                <div className="mt-1 flex items-center gap-2">
                  <input
                    id="nex-research-file"
                    type="file"
                    accept={ACCEPT}
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) handleFiles(e.target.files);
                      e.currentTarget.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById("nex-research-file")?.click()}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-elevated px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    <Paperclip className="h-3 w-3" /> Attach
                  </button>
                  {uploading && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
                    </span>
                  )}
                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={stop}
                      className="ml-auto inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" /> Stop
                    </button>
                  ) : (
                    <BrandButton onClick={() => send(input)}>
                      <Send className="h-3.5 w-3.5" /> Send
                    </BrandButton>
                  )}
                </div>
              </div>
              <p className="mt-1.5 px-1 text-[10px] text-muted-foreground">
                Supported: PDF, DOCX, TXT, MD, CSV, PPTX · up to {MAX_UPLOAD_MB} MB · your files stay private to you.
              </p>
            </div>
          </Card>
        </section>

        {/* Right rail: documents + suggested */}
        <aside className="hidden lg:block">
          <Card className="p-3 lg:sticky lg:top-24">
            <div className="flex items-center justify-between pb-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Attached documents
              </div>
              <Pill tone="brand">{documents.length}</Pill>
            </div>
            {documents.length === 0 ? (
              <label
                htmlFor="nex-research-file"
                className="grid cursor-pointer place-items-center rounded-lg border-2 border-dashed border-border px-3 py-6 text-center hover:border-primary"
              >
                <FileUp className="mb-1 h-5 w-5 text-primary" />
                <div className="text-xs font-medium">Drop or upload</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">PDF · DOCX · TXT · MD</div>
              </label>
            ) : (
              <div className="space-y-1.5">
                {documents.map((d) => (
                  <div key={d.id} className="group flex items-center gap-2 rounded-md border border-border bg-surface-elevated/40 p-2">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs">{d.file_name}</div>
                      <div className="text-[10px] text-muted-foreground">{(d.size_bytes / 1024).toFixed(0)} KB</div>
                    </div>
                    <button onClick={() => deleteDoc(d.id)} className="opacity-0 transition group-hover:opacity-100">
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 border-t border-border pt-3">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Trending workplace topics
              </div>
              <div className="flex flex-col gap-1.5">
                {SUGGESTED_TOPICS.slice(0, 4).map((t) => (
                  <button
                    key={t}
                    onClick={() => send(t)}
                    className="rounded-md border border-border bg-surface px-2 py-1.5 text-left text-[11px] hover:border-primary hover:text-primary"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </Shell>
  );
}

function MessageBlock({ m }: { m: UIMessage }) {
  const text = m.parts
    .map((p) => (p.type === "text" ? (p as { text: string }).text : ""))
    .join("");
  const clean = m.role === "assistant" ? text.replace(/### Follow-up[\s\S]*$/, "").trim() : text;
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl brand-gradient px-4 py-2.5 text-sm text-white shadow-[0_4px_16px_-4px_rgba(168,85,247,0.5)]">
          {clean}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg brand-gradient">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1 rounded-2xl border border-border bg-surface-elevated/30 px-4 py-3 text-sm">
        <div className="prose prose-invert prose-sm max-w-none prose-headings:mt-3 prose-headings:mb-1 prose-p:my-1.5 prose-ul:my-1.5 prose-table:my-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{clean || "…"}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onPick, onUpload }: { onPick: (t: string) => void; onUpload: () => void }) {
  return (
    <div className="mx-auto max-w-2xl py-8 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl brand-gradient shadow-[0_8px_32px_-8px_rgba(168,85,247,0.6)]">
        <Sparkles className="h-6 w-6 text-white" />
      </div>
      <h2 className="mt-4 text-xl font-bold tracking-tight">Your AI Research Analyst</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Ask a question, paste text, or drop a document. Nexora will summarise, analyse, compare, and recommend.
      </p>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {SUGGESTED_TOPICS.map((t) => (
          <button
            key={t}
            onClick={() => onPick(t)}
            className="rounded-lg border border-border bg-surface-elevated/40 p-3 text-left text-xs transition hover:border-primary hover:bg-surface-elevated"
          >
            {t}
          </button>
        ))}
      </div>
      <button
        onClick={onUpload}
        className="mt-5 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-elevated px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary"
      >
        <FileUp className="h-3.5 w-3.5" /> Or upload a document
      </button>
    </div>
  );
}
