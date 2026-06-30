import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/nexora/Shell";
import { Card, Pill, SectionHeader, BrandButton, GhostButton } from "@/components/nexora/ui";
import {
  Sparkles, TrendingUp, Clock, Target, Zap, ArrowRight,
  Mail, Calendar, FlaskConical, CheckCircle2, AlertCircle, ClipboardList,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Daily Briefing — Nexora" },
      { name: "description", content: "Your AI-powered morning briefing: priorities, workload matrix, and time optimization." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <Shell
      title="Daily Briefing"
      subtitle="Your AI-orchestrated start to the day"
      actions={<BrandButton><Sparkles className="h-4 w-4" /> Refresh Briefing</BrandButton>}
    >
      {/* Hero briefing */}
      <Card className="relative overflow-hidden p-6 md:p-8">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative">
          <Pill tone="brand"><Sparkles className="mr-1 h-3 w-3" /> AI Morning Briefing</Pill>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight md:text-3xl">
            {greeting}, Alex. Here's your <span className="brand-text">optimized day</span>.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            You have <b className="text-foreground">3 meetings</b>, <b className="text-foreground">2 urgent emails</b>, and <b className="text-foreground">1 deadline approaching</b>. I've blocked focus time at 10:30–12:00 for the Q3 roadmap.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <BrandButton><Zap className="h-4 w-4" /> Start Focus Block</BrandButton>
            <GhostButton>View Full Schedule <ArrowRight className="h-4 w-4" /></GhostButton>
          </div>
        </div>
      </Card>

      {/* Workload matrix */}
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {[
          { label: "Cognitive Load", value: "62%", trend: "+8%", icon: TrendingUp, tone: "brand" as const, note: "Heavier than yesterday" },
          { label: "Tasks Open", value: "14", trend: "-3", icon: Target, tone: "success" as const, note: "On track for week" },
          { label: "Focus Hours", value: "4.5h", trend: "+1.2h", icon: Clock, tone: "brand" as const, note: "Above weekly avg" },
          { label: "Velocity Score", value: "87", trend: "+12", icon: Zap, tone: "success" as const, note: "Top 10% this quarter" },
        ].map((m) => (
          <Card key={m.label} className="p-5">
            <div className="flex items-start justify-between">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{m.label}</div>
              <m.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <div className="text-3xl font-extrabold tracking-tight">{m.value}</div>
              <Pill tone={m.tone}>{m.trend}</Pill>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">{m.note}</div>
          </Card>
        ))}
      </div>

      {/* Two-column: Timeline + AI Optimization */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <SectionHeader eyebrow="Unified Timeline" title="Today's Schedule" action={<GhostButton>Calendar</GhostButton>} />
          <div className="space-y-3">
            {[
              { time: "09:00", title: "Standup — Product Team", type: "Meeting", tone: "brand" as const, icon: Calendar },
              { time: "10:30", title: "Focus Block: Q3 Roadmap draft", type: "Deep Work", tone: "success" as const, icon: Target },
              { time: "13:00", title: "Reply to Client RFP — Acme Corp", type: "Urgent Email", tone: "warning" as const, icon: Mail },
              { time: "14:30", title: "Design Review with Maya", type: "Meeting", tone: "brand" as const, icon: Calendar },
              { time: "16:00", title: "Review research: Market Sizing v3", type: "Research", tone: "neutral" as const, icon: FlaskConical },
              { time: "17:30", title: "Submit weekly status report", type: "Deadline", tone: "danger" as const, icon: AlertCircle },
            ].map((t) => (
              <div key={t.time} className="flex items-center gap-4 rounded-lg border border-border bg-surface-elevated/40 px-4 py-3 transition hover:border-border-active hover:bg-surface-elevated">
                <div className="font-mono text-xs font-semibold text-muted-foreground">{t.time}</div>
                <div className="h-8 w-px bg-border" />
                <t.icon className="h-4 w-4 text-primary" />
                <div className="flex-1 truncate text-sm font-medium">{t.title}</div>
                <Pill tone={t.tone}>{t.type}</Pill>
              </div>
            ))}
          </div>
        </Card>

        <Card className="relative overflow-hidden p-6">
          <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
          <Pill tone="brand"><Sparkles className="mr-1 h-3 w-3" /> AI Strategy</Pill>
          <h3 className="mt-3 text-lg font-bold">Time Optimization</h3>
          <p className="mt-1 text-xs text-muted-foreground">Insights based on your last 14 days.</p>

          <div className="mt-5 space-y-4">
            {[
              { label: "Batch emails 13:00–13:30 instead of throughout the day", gain: "Save 47 min" },
              { label: "Move standup to 9:30 — better focus window before", gain: "+18% focus" },
              { label: "Delegate 'Status report' template to Nexora automation", gain: "Save 32 min" },
            ].map((s, i) => (
              <div key={i} className="rounded-lg border border-border bg-background/40 p-3">
                <div className="text-sm font-medium leading-snug">{s.label}</div>
                <div className="mt-2 flex items-center justify-between">
                  <Pill tone="success"><CheckCircle2 className="mr-1 h-3 w-3" />{s.gain}</Pill>
                  <button className="text-xs font-semibold text-primary hover:underline">Apply</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick module links */}
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { to: "/email", title: "Smart Email Studio", desc: "Draft, rewrite, and personalize.", icon: Mail },
          { to: "/meetings", title: "Meeting Intelligence", desc: "Transcripts → action items.", icon: ClipboardListIcon },
          { to: "/research", title: "Research Hub", desc: "Documents → key insights.", icon: FlaskConical },
          { to: "/tasks", title: "Task Board & Calendar", desc: "Plan, prioritize, focus.", icon: Calendar },
        ].map((m) => (
          <Link key={m.to} to={m.to as never} className="group">
            <Card className="h-full p-5 transition hover:border-border-active hover:bg-surface-elevated/60">
              <m.icon className="h-5 w-5 text-primary" />
              <div className="mt-4 font-semibold">{m.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{m.desc}</div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition group-hover:opacity-100">
                Open <ArrowRight className="h-3 w-3" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </Shell>
  );
}

function ClipboardListIcon(props: React.ComponentProps<typeof Target>) {
  // Just re-use any icon import to satisfy typing — replaced via lucide
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Lucide = require("lucide-react").ClipboardList;
  return <Lucide {...props} />;
}
