import { useState } from "react";
import { MessageSquare, X, Send, Sparkles } from "lucide-react";

type Msg = { role: "user" | "ai"; text: string };

const SEEDED: Msg[] = [
  { role: "ai", text: "Hi Alex — I'm Nexora. I can draft emails, summarize meetings, prioritize your day, or pull insights from research. What's on your mind?" },
];

function reply(input: string): string {
  const t = input.toLowerCase();
  if (t.includes("email")) return "I'll open the Smart Email Studio with a Formal tone and Manager audience. Want me to pre-load context from your latest research?";
  if (t.includes("meeting")) return "Drop a transcript in the Meeting Intelligence Lab and I'll extract owners, deadlines, and priority tags within seconds.";
  if (t.includes("task") || t.includes("today")) return "You have 3 meetings, 2 urgent emails, and 1 deadline approaching. Recommended focus block: 10:30–12:00 on the Q3 roadmap.";
  if (t.includes("research") || t.includes("summarize")) return "Upload a PDF or paste a URL in the Research Hub. I'll generate a Key Insight matrix and strategic recommendations.";
  return "Got it. I'll handle the context switching — tell me the outcome you want and I'll coordinate across modules.";
}

export function ChatbotOverlay() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(SEEDED);
  const [text, setText] = useState("");

  function send() {
    const v = text.trim();
    if (!v) return;
    setMsgs((m) => [...m, { role: "user", text: v }]);
    setText("");
    setTimeout(() => setMsgs((m) => [...m, { role: "ai", text: reply(v) }]), 450);
  }

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
        <div className="fixed bottom-24 right-6 z-40 flex h-[560px] w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_24px_64px_-16px_rgba(0,0,0,0.7)]">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg brand-gradient">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Nexora Assistant</div>
              <div className="text-[11px] text-muted-foreground">Context-aware · Always available</div>
            </div>
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">Online</span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "brand-gradient text-white"
                    : "bg-surface-elevated text-foreground"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-primary">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask Nexora anything…"
                className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
              />
              <button onClick={send} className="grid h-8 w-8 place-items-center rounded-md brand-gradient text-white">
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">AI-generated. Always review before sending.</p>
          </div>
        </div>
      )}
    </>
  );
}
