import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/nexora/Shell";
import { Card, Pill, SectionHeader, BrandButton, GhostButton } from "@/components/nexora/ui";
import { Sparkles, Copy, RotateCcw, Wand2, Check, FileText } from "lucide-react";

export const Route = createFileRoute("/email")({
  head: () => ({ meta: [{ title: "Smart Email Studio — Nexora" }, { name: "description", content: "Generate, rewrite, and personalize emails with AI." }] }),
  component: EmailStudio,
});

const TONES = ["Formal", "Casual", "Persuasive", "Friendly", "Concise"] as const;
const AUDIENCES = ["Client", "Manager", "Team", "Cross-Functional", "Executive"] as const;

const HISTORY = [
  { subject: "Q3 Roadmap Alignment", to: "Maya Patel", tone: "Formal", date: "Today, 9:14 AM" },
  { subject: "Acme Corp RFP — Follow-up", to: "j.lin@acme.com", tone: "Persuasive", date: "Yesterday" },
  { subject: "Interview Invitation — Sr. Designer", to: "candidates", tone: "Friendly", date: "Mon" },
  { subject: "Weekly Status — Eng", to: "leadership", tone: "Concise", date: "Last Fri" },
];

function generate(ctx: string, tone: string, audience: string) {
  return `Subject: ${ctx.slice(0, 56) || "Quick update"}

Hi ${audience === "Client" ? "team" : "there"},

I wanted to share a brief update on ${ctx || "the project"}. Based on our recent progress and the priorities we discussed, here's where things stand and what I'd propose as next steps.

• Status: On track against the agreed milestones.
• Risks: Two minor blockers identified, mitigation plan attached.
• Ask: A 15-minute review this week to confirm direction.

${tone === "Persuasive" ? "Aligning on this now will save significant rework later — happy to walk you through it." : tone === "Casual" ? "Let me know what works on your end!" : "Please let me know if any adjustments are needed."}

Best,
Alex`;
}

function EmailStudio() {
  const [tone, setTone] = useState<string>("Formal");
  const [audience, setAudience] = useState<string>("Manager");
  const [ctx, setCtx] = useState("Q3 roadmap progress, two blockers, request a review meeting this week");
  const [output, setOutput] = useState<string>("");
  const [copied, setCopied] = useState(false);

  function onGenerate() {
    setOutput("");
    setTimeout(() => setOutput(generate(ctx, tone, audience)), 350);
  }
  function copy() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Shell
      title="Smart Email Studio"
      subtitle="Configure tone & context — Nexora drafts the rest"
      actions={<BrandButton onClick={onGenerate}><Sparkles className="h-4 w-4" /> Generate with Nexora</BrandButton>}
    >
      {/* Prompt config bar */}
      <Card className="p-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tone</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button key={t} onClick={() => setTone(t)} className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${tone === t ? "border-primary bg-primary/15 text-primary" : "border-border bg-surface-elevated text-muted-foreground hover:text-foreground"}`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Audience</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {AUDIENCES.map((a) => (
                <button key={a} onClick={() => setAudience(a)} className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${audience === a ? "border-primary bg-primary/15 text-primary" : "border-border bg-surface-elevated text-muted-foreground hover:text-foreground"}`}>{a}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Core Context</label>
          <textarea
            value={ctx}
            onChange={(e) => setCtx(e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-md border border-border bg-background p-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            placeholder="What's the email about? Key points, recipient context, desired outcome…"
          />
        </div>
      </Card>

      {/* Split editor */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <SectionHeader eyebrow="Draft View" title="Editable Source" />
            <Pill tone="brand">Markdown</Pill>
          </div>
          <textarea
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            rows={18}
            placeholder="Configure the prompt and click Generate to populate."
            className="w-full rounded-md border border-border bg-background p-4 font-mono text-xs leading-relaxed placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <div className="mt-3 flex gap-2">
            <GhostButton onClick={onGenerate}><RotateCcw className="h-3.5 w-3.5" /> Regenerate</GhostButton>
            <GhostButton onClick={() => setOutput("")}>Clear</GhostButton>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <SectionHeader eyebrow="Rendered Output" title="Polished Preview" />
            <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-elevated px-2.5 py-1.5 text-xs font-medium hover:border-primary hover:text-primary">
              {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
            </button>
          </div>
          <div className="min-h-[420px] whitespace-pre-wrap rounded-md border border-border bg-background p-5 text-sm leading-relaxed">
            {output || <span className="text-muted-foreground">Your AI-generated email will appear here. Always review before sending.</span>}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Wand2 className="h-3.5 w-3.5 text-primary" /> AI-assisted draft · {tone} · {audience}
          </div>
        </Card>
      </div>

      {/* History */}
      <div className="mt-8">
        <SectionHeader eyebrow="Repository" title="Historical Drafts" />
        <Card>
          <div className="grid grid-cols-12 border-b border-border px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <div className="col-span-5">Subject</div>
            <div className="col-span-3">Recipient</div>
            <div className="col-span-2">Tone</div>
            <div className="col-span-2 text-right">Date</div>
          </div>
          {HISTORY.map((h, i) => (
            <div key={i} className="grid grid-cols-12 items-center border-b border-border px-5 py-3 text-sm last:border-0 hover:bg-surface-elevated/40">
              <div className="col-span-5 flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />{h.subject}</div>
              <div className="col-span-3 text-muted-foreground">{h.to}</div>
              <div className="col-span-2"><Pill tone="brand">{h.tone}</Pill></div>
              <div className="col-span-2 text-right text-xs text-muted-foreground">{h.date}</div>
            </div>
          ))}
        </Card>
      </div>
    </Shell>
  );
}
