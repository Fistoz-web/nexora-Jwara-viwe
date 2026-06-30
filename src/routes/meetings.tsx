import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/nexora/Shell";
import { Card, Pill, SectionHeader, BrandButton, GhostButton } from "@/components/nexora/ui";
import { Upload, Sparkles, Clock, User, AlertTriangle, FileAudio, FileText } from "lucide-react";

export const Route = createFileRoute("/meetings")({
  head: () => ({ meta: [{ title: "Meeting Intelligence Lab — Nexora" }, { name: "description", content: "Upload transcripts and extract action items, owners, and deadlines." }] }),
  component: Meetings,
});

const SAMPLE = [
  { owner: "Maya Patel", task: "Finalize Q3 roadmap deck with cross-functional inputs", due: "Fri", priority: "High" as const, source: "Standup" },
  { owner: "Alex Morgan", task: "Send Acme RFP follow-up incorporating pricing v2", due: "Tomorrow", priority: "Urgent" as const, source: "Client sync" },
  { owner: "Jordan Lee", task: "Spec out onboarding analytics events", due: "Next Tue", priority: "Medium" as const, source: "Product review" },
  { owner: "Sam Rivera", task: "Investigate latency spike in /api/search", due: "Today", priority: "Urgent" as const, source: "Eng sync" },
  { owner: "Priya N.", task: "Draft FAQ for upcoming launch", due: "Next Mon", priority: "Low" as const, source: "Marketing" },
];

function Meetings() {
  const [hasResult, setHasResult] = useState(false);
  const [processing, setProcessing] = useState(false);

  function simulate() {
    setProcessing(true);
    setTimeout(() => { setProcessing(false); setHasResult(true); }, 900);
  }

  return (
    <Shell
      title="Meeting Intelligence Lab"
      subtitle="Drop a transcript — get structured outcomes in seconds"
      actions={<BrandButton onClick={simulate}><Sparkles className="h-4 w-4" /> Re-run Analysis</BrandButton>}
    >
      {/* Drop zone */}
      <Card className="relative overflow-hidden p-8">
        <div className="absolute inset-0 ambient-grid opacity-50" />
        <div className="relative grid place-items-center rounded-xl border-2 border-dashed border-border-active bg-background/50 px-6 py-12 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full brand-gradient">
            <Upload className="h-6 w-6 text-white" />
          </div>
          <h3 className="mt-4 text-lg font-bold">Drop transcript, audio, or paste notes</h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">Supports .txt, .md, .docx, .mp3, .m4a, .vtt — or paste raw notes from any meeting platform.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <BrandButton onClick={simulate}><FileText className="h-4 w-4" /> Use sample transcript</BrandButton>
            <GhostButton><FileAudio className="h-4 w-4" /> Upload audio</GhostButton>
          </div>
          {processing && (
            <div className="mt-6 flex items-center gap-2 text-xs text-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              Nexora is extracting owners, deadlines, and priority tags…
            </div>
          )}
        </div>
      </Card>

      {/* Summary cards */}
      {hasResult && (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Card className="p-5">
              <Pill tone="brand">Summary</Pill>
              <h3 className="mt-3 text-base font-bold">Q3 Sync — Product & Eng</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Team aligned on top-3 priorities for Q3: launch onboarding v2, fix latency in search, and close Acme deal. Two blockers raised; mitigation owners assigned.
              </p>
            </Card>
            <Card className="p-5">
              <Pill tone="success">Decisions</Pill>
              <ul className="mt-3 space-y-2 text-sm">
                <li>• Ship onboarding v2 by end of August.</li>
                <li>• Acme RFP response goes out Tuesday.</li>
                <li>• Pause work on Reports v3 until Sept.</li>
              </ul>
            </Card>
            <Card className="p-5">
              <Pill tone="warning"><AlertTriangle className="mr-1 h-3 w-3" /> Risks</Pill>
              <ul className="mt-3 space-y-2 text-sm">
                <li>• Search latency unresolved — needs owner.</li>
                <li>• Design capacity tight through August.</li>
              </ul>
            </Card>
          </div>

          {/* Action Item Matrix */}
          <div className="mt-8">
            <SectionHeader eyebrow="Action Items" title="Structured Owner Matrix" action={<GhostButton>Export CSV</GhostButton>} />
            <Card>
              <div className="grid grid-cols-12 border-b border-border px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <div className="col-span-5">Task</div>
                <div className="col-span-2">Owner</div>
                <div className="col-span-2">Due</div>
                <div className="col-span-2">Priority</div>
                <div className="col-span-1">Source</div>
              </div>
              {SAMPLE.map((a, i) => (
                <div key={i} className="grid grid-cols-12 items-center border-b border-border px-5 py-4 text-sm last:border-0 hover:bg-surface-elevated/40">
                  <div className="col-span-5 font-medium">{a.task}</div>
                  <div className="col-span-2 flex items-center gap-2 text-muted-foreground">
                    <User className="h-3.5 w-3.5" />{a.owner}
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />{a.due}
                  </div>
                  <div className="col-span-2">
                    <Pill tone={a.priority === "Urgent" ? "danger" : a.priority === "High" ? "warning" : a.priority === "Medium" ? "brand" : "neutral"}>{a.priority}</Pill>
                  </div>
                  <div className="col-span-1 text-xs text-muted-foreground">{a.source}</div>
                </div>
              ))}
            </Card>
          </div>
        </>
      )}
    </Shell>
  );
}
