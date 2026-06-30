import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/nexora/Shell";
import {
  Sparkles, Zap, ArrowRight, Mail, Calendar, FlaskConical, ClipboardList,
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

type TimelineItem = {
  time: string;
  title: string;
  meta: string;
  state: "done" | "active" | "upcoming";
};

const TIMELINE: TimelineItem[] = [
  { time: "09:00 – 09:30", title: "Standup — Product Team", meta: "Done · Notes saved", state: "done" },
  { time: "09:00 – 11:30", title: "Deep Work: Q3 Roadmap draft", meta: "AI-optimized focus slot", state: "active" },
  { time: "13:00 – 13:45", title: "Reply to Acme RFP", meta: "Urgent · Draft ready in Email Studio", state: "upcoming" },
  { time: "14:30 – 15:00", title: "Design Review with Maya", meta: "Agenda auto-prepared", state: "upcoming" },
  { time: "17:30 – 18:00", title: "Weekly status report", meta: "Deadline · 1 template available", state: "upcoming" },
];

const METRICS = [
  { label: "Cognitive Load", value: "62%", footer: null, progress: 62 },
  { label: "Tasks Open", value: "14", footer: { text: "−3 from yesterday", tone: "success" as const } },
  { label: "Focus Hours", value: "4.5h", footer: { text: "Target: 6.0h", tone: "muted" as const } },
  { label: "Velocity Score", value: "87", footer: { text: "Top 10% this quarter", tone: "brand" as const } },
];

const QUICK_LINKS = [
  { to: "/email", label: "Email", icon: Mail },
  { to: "/meetings", label: "Meetings", icon: ClipboardList },
  { to: "/research", label: "Research", icon: FlaskConical },
  { to: "/tasks", label: "Tasks", icon: Calendar },
];

function Dashboard() {
  return (
    <Shell title="Daily Briefing" subtitle="Your AI-orchestrated start to the day">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Hero: AI Morning Briefing */}
        <section className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-surface/70 p-6 backdrop-blur-xl md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 bottom-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />
              <h1 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Morning Briefing</h1>
            </div>
            <p className="mt-3 max-w-2xl text-xl font-medium leading-tight md:text-2xl">
              Good morning, Alex. Your peak cognitive window is{" "}
              <span className="text-primary">09:00 – 11:30</span>. Focus on the Q3 roadmap draft before your 13:00 client reply.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-[0_8px_24px_-8px_rgba(168,85,247,0.7)] transition hover:brightness-110">
                <Zap className="h-3.5 w-3.5" /> Start Deep Work
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-foreground transition hover:bg-white/[0.07]">
                Review Plan
              </button>
            </div>
          </div>
        </section>

        {/* Metric grid — 2 cols mobile, 4 cols desktop */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {METRICS.map((m) => (
            <div key={m.label} className="flex flex-col rounded-xl border border-white/[0.05] bg-surface/50 p-4 backdrop-blur-sm transition hover:border-white/[0.12] hover:bg-surface/70">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{m.label}</span>
              <span className="mt-1 text-xl font-bold md:text-2xl">{m.value}</span>
              {m.progress !== undefined && (
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full bg-primary shadow-[0_0_8px_rgba(168,85,247,0.6)]" style={{ width: `${m.progress}%` }} />
                </div>
              )}
              {m.footer && (
                <span className={`mt-2 text-[10px] ${
                  m.footer.tone === "success" ? "text-success" :
                  m.footer.tone === "brand" ? "text-primary" :
                  "text-muted-foreground"
                }`}>
                  {m.footer.text}
                </span>
              )}
            </div>
          ))}
        </section>

        {/* Two-column: Timeline + AI Strategy */}
        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Timeline */}
          <div className="flex flex-col gap-4">
            <header className="flex items-end justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Timeline</h2>
              <span className="text-xs font-medium text-primary">Today</span>
            </header>
            <div className="relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/[0.08]" />
              <ul className="space-y-5">
                {TIMELINE.map((t) => (
                  <li key={t.title} className="relative flex flex-col pl-8">
                    {t.state === "active" ? (
                      <span className="absolute left-0 top-1.5 grid h-4 w-4 place-items-center rounded-full border-4 border-background bg-primary shadow-[0_0_12px_var(--color-primary)]" />
                    ) : t.state === "done" ? (
                      <span className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-4 border-background bg-success/80" />
                    ) : (
                      <span className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-4 border-background bg-white/[0.12]" />
                    )}
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t.time}</span>
                    <span className={`mt-0.5 text-sm font-medium ${t.state === "upcoming" ? "text-muted-foreground" : "text-foreground"}`}>
                      {t.title}
                    </span>
                    <span className="mt-0.5 text-xs italic text-muted-foreground/80">{t.meta}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI Strategy panel */}
          <aside className="flex flex-col gap-4">
            <section className="rounded-2xl border border-primary/20 bg-gradient-to-r from-surface to-primary/[0.08] p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold uppercase tracking-wider">Optimization Strategy</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    We found a 45-min gap. Moving non-critical emails to 16:30 would recover{" "}
                    <span className="font-medium text-foreground">12% more energy</span> for the afternoon sprint.
                  </p>
                  <button className="mt-3 text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
                    Apply strategy →
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/[0.05] bg-surface/50 p-5 backdrop-blur-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider">Smart suggestions</h3>
              <ul className="mt-3 space-y-3 text-xs">
                {[
                  { body: "Batch emails 13:00–13:30", gain: "+47m" },
                  { body: "Move standup to 9:30", gain: "+18% focus" },
                  { body: "Delegate weekly status template", gain: "+32m" },
                ].map((s) => (
                  <li key={s.body} className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2">
                    <span className="min-w-0 truncate text-muted-foreground">{s.body}</span>
                    <span className="shrink-0 font-mono text-[10px] font-semibold text-success">{s.gain}</span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </section>

        {/* Module quick-links */}
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Jump to module</h2>
          <div className="grid grid-cols-4 gap-2 md:gap-3">
            {QUICK_LINKS.map((q) => (
              <Link
                key={q.to}
                to={q.to as never}
                className="group flex flex-col items-center gap-2"
              >
                <div className="grid aspect-square w-full place-items-center rounded-2xl border border-white/[0.05] bg-surface/50 backdrop-blur-sm transition group-hover:border-primary/40 group-hover:bg-surface/80 group-hover:shadow-[0_0_24px_-12px_var(--color-primary)] md:max-w-[88px]">
                  <q.icon className="h-5 w-5 text-muted-foreground transition group-hover:text-primary" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground md:text-xs">{q.label}</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="flex justify-end pb-2">
          <Link to="/tasks" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary">
            Open full planner <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </Shell>
  );
}
