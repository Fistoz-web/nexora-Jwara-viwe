import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/nexora/Shell";
import { Card, Pill, SectionHeader, BrandButton, GhostButton } from "@/components/nexora/ui";
import { FileUp, Sparkles, Lightbulb, TrendingUp, Mail, FileText, Link2 } from "lucide-react";

export const Route = createFileRoute("/research")({
  head: () => ({ meta: [{ title: "Research Hub — Nexora" }, { name: "description", content: "Ingest documents and generate strategic insights." }] }),
  component: Research,
});

const INSIGHTS = [
  { title: "Market is consolidating around 3 vendors", body: "Top 3 vendors now hold 62% share, up from 41% YoY. Mid-market segment remains fragmented.", tag: "Market" },
  { title: "Buyer urgency centers on compliance", body: "78% of mentions in analyst reports cite SOC 2 + data residency as gating criteria.", tag: "Buyer" },
  { title: "Pricing power lies in workflow depth", body: "Vendors with >5 connected modules command 2.1x ARPU vs. point solutions.", tag: "Pricing" },
  { title: "Onboarding is the #1 churn vector", body: "Time-to-first-value < 7 days correlates with 3x lower 90-day churn.", tag: "Retention" },
];

function Research() {
  const [loaded, setLoaded] = useState(false);
  const nav = useNavigate();

  return (
    <Shell
      title="Research Hub"
      subtitle="From raw documents to strategic recommendations"
      actions={<BrandButton onClick={() => setLoaded(true)}><Sparkles className="h-4 w-4" /> Analyze</BrandButton>}
    >
      {/* Ingestion slot */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <SectionHeader eyebrow="Ingest" title="Add documents or URLs" />
          <div className="rounded-xl border-2 border-dashed border-border-active bg-background/40 px-6 py-10 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full brand-gradient">
              <FileUp className="h-5 w-5 text-white" />
            </div>
            <p className="mt-3 text-sm font-medium">Drop PDFs, DOCX, MD, or paste a URL</p>
            <p className="mt-1 text-xs text-muted-foreground">Multi-format ingestion · Up to 25 MB per file</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <BrandButton onClick={() => setLoaded(true)}><FileText className="h-4 w-4" /> Use sample report</BrandButton>
              <GhostButton><Link2 className="h-4 w-4" /> Paste URL</GhostButton>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeader eyebrow="Sources" title="Library" />
          <div className="space-y-2">
            {[
              { name: "Forrester_WaveAI_2026.pdf", size: "4.2 MB", date: "Jun 12" },
              { name: "Gartner_HypeCycle_Productivity.pdf", size: "8.1 MB", date: "Jun 09" },
              { name: "Acme — internal market memo.docx", size: "612 KB", date: "Jun 02" },
            ].map((f) => (
              <div key={f.name} className="flex items-center gap-3 rounded-md border border-border bg-surface-elevated/40 p-3">
                <FileText className="h-4 w-4 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{f.name}</div>
                  <div className="text-[11px] text-muted-foreground">{f.size} · {f.date}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {loaded && (
        <>
          {/* Insight cards */}
          <div className="mt-8">
            <SectionHeader eyebrow="Key Insights" title="What matters in this material" />
            <div className="grid gap-4 md:grid-cols-2">
              {INSIGHTS.map((ins) => (
                <Card key={ins.title} className="p-5">
                  <div className="flex items-center justify-between">
                    <Pill tone="brand"><Lightbulb className="mr-1 h-3 w-3" />{ins.tag}</Pill>
                    <span className="font-mono text-[10px] text-muted-foreground">conf · 0.92</span>
                  </div>
                  <h3 className="mt-3 text-base font-bold">{ins.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ins.body}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Strategic recommendation */}
          <Card className="relative mt-8 overflow-hidden p-6">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative">
              <Pill tone="brand"><TrendingUp className="mr-1 h-3 w-3" /> Strategic Recommendation</Pill>
              <h3 className="mt-3 text-xl font-bold">Pursue depth-over-breadth: invest in 2 deep workflow integrations rather than 6 shallow ones.</h3>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                Insights suggest pricing power and retention both compound with workflow depth. Recommend prioritizing the email + calendar integration spine, deferring lower-leverage connectors to Q4.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <BrandButton onClick={() => nav({ to: "/email" })}><Mail className="h-4 w-4" /> Draft Executive Email</BrandButton>
                <GhostButton>Export to Notion</GhostButton>
                <GhostButton>Share with team</GhostButton>
              </div>
            </div>
          </Card>
        </>
      )}
    </Shell>
  );
}
