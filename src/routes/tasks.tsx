import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/nexora/Shell";
import { Card, Pill, SectionHeader, BrandButton, GhostButton } from "@/components/nexora/ui";
import { Plus, Zap, Clock } from "lucide-react";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "Task Board & Calendar — Nexora" }, { name: "description", content: "Plan, prioritize, and block focus time." }] }),
  component: Tasks,
});

type Task = { id: string; title: string; status: "todo" | "doing" | "done"; priority: "Urgent" | "High" | "Med" | "Low"; due?: string };
const SEED: Task[] = [
  { id: "1", title: "Finalize Q3 roadmap deck", status: "doing", priority: "High", due: "Fri" },
  { id: "2", title: "Reply to Acme RFP", status: "todo", priority: "Urgent", due: "Tomorrow" },
  { id: "3", title: "Review design system tokens", status: "todo", priority: "Med", due: "Mon" },
  { id: "4", title: "Investigate /api/search latency", status: "doing", priority: "Urgent", due: "Today" },
  { id: "5", title: "Submit weekly status report", status: "todo", priority: "High", due: "Today" },
  { id: "6", title: "Ship onboarding v2 spec", status: "done", priority: "High" },
  { id: "7", title: "Sync with Maya on roadmap", status: "done", priority: "Med" },
];

const COLS: { id: Task["status"]; label: string; tone: "neutral" | "brand" | "success" }[] = [
  { id: "todo", label: "To Do", tone: "neutral" },
  { id: "doing", label: "In Progress", tone: "brand" },
  { id: "done", label: "Done", tone: "success" },
];

const HOURS = Array.from({ length: 10 }, (_, i) => 8 + i);
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

type Block = { day: number; start: number; len: number; title: string; tone: "brand" | "success" | "warning" | "neutral" };
const BLOCKS: Block[] = [
  { day: 0, start: 9, len: 1, title: "Standup", tone: "brand" },
  { day: 0, start: 10, len: 2, title: "Focus: Q3 deck", tone: "success" },
  { day: 1, start: 13, len: 1, title: "Acme call", tone: "warning" },
  { day: 2, start: 9, len: 2, title: "Focus: Roadmap", tone: "success" },
  { day: 3, start: 14, len: 1, title: "Design review", tone: "brand" },
  { day: 4, start: 11, len: 2, title: "Focus: Writing", tone: "success" },
  { day: 4, start: 15, len: 1, title: "Status report", tone: "warning" },
];

function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(SEED);
  const [focusLen, setFocusLen] = useState(90);

  function move(id: string, dir: 1 | -1) {
    setTasks((ts) => ts.map((t) => {
      if (t.id !== id) return t;
      const order: Task["status"][] = ["todo", "doing", "done"];
      const idx = order.indexOf(t.status);
      const next = Math.max(0, Math.min(2, idx + dir));
      return { ...t, status: order[next] };
    }));
  }

  return (
    <Shell
      title="Task Board & Calendar Planner"
      subtitle="Plan, prioritize, and let Nexora protect your focus time"
      actions={<BrandButton><Plus className="h-4 w-4" /> New Task</BrandButton>}
    >
      {/* Focus block slider */}
      <Card className="relative overflow-hidden p-5">
        <div className="absolute inset-0 ambient-grid opacity-40" />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg brand-gradient"><Zap className="h-4 w-4 text-white" /></div>
            <div>
              <div className="text-sm font-bold">Smart Focus Block</div>
              <div className="text-xs text-muted-foreground">Nexora finds the best slot in your day</div>
            </div>
          </div>
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-mono font-semibold text-primary">{focusLen} min</span>
            </div>
            <input
              type="range" min={30} max={180} step={15}
              value={focusLen} onChange={(e) => setFocusLen(Number(e.target.value))}
              className="mt-2 w-full accent-[oklch(0.65_0.24_305)]"
            />
          </div>
          <BrandButton><Clock className="h-4 w-4" /> Schedule Block</BrandButton>
        </div>
      </Card>

      {/* Kanban Board */}
      <div className="mt-8">
        <SectionHeader eyebrow="Board" title="Tasks" />
        <div className="grid gap-4 md:grid-cols-3">
          {COLS.map((col) => {
            const items = tasks.filter((t) => t.status === col.id);
            return (
              <Card key={col.id} className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pill tone={col.tone}>{col.label}</Pill>
                    <span className="text-xs text-muted-foreground">{items.length}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {items.map((t) => (
                    <div key={t.id} className="rounded-lg border border-border bg-surface-elevated/50 p-3">
                      <div className="text-sm font-medium leading-snug">{t.title}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Pill tone={t.priority === "Urgent" ? "danger" : t.priority === "High" ? "warning" : t.priority === "Med" ? "brand" : "neutral"}>{t.priority}</Pill>
                          {t.due && <span className="text-[11px] text-muted-foreground">· {t.due}</span>}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => move(t.id, -1)} disabled={col.id === "todo"} className="rounded border border-border px-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30">←</button>
                          <button onClick={() => move(t.id, 1)} disabled={col.id === "done"} className="rounded border border-border px-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30">→</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">No tasks</div>}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Week Calendar */}
      <div className="mt-8">
        <SectionHeader eyebrow="Calendar" title="This Week" action={
          <div className="flex gap-1 rounded-md border border-border bg-surface p-1 text-xs">
            <button className="rounded bg-surface-elevated px-3 py-1 font-medium">Week</button>
            <button className="rounded px-3 py-1 text-muted-foreground">Day</button>
            <button className="rounded px-3 py-1 text-muted-foreground">Month</button>
          </div>
        } />
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[64px_repeat(5,1fr)] border-b border-border bg-surface-elevated/40">
            <div />
            {DAYS.map((d) => (
              <div key={d} className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">{d}</div>
            ))}
          </div>
          <div className="relative">
            {HOURS.map((h) => (
              <div key={h} className="grid grid-cols-[64px_repeat(5,1fr)] border-b border-border last:border-0">
                <div className="px-2 py-3 text-right font-mono text-[10px] text-muted-foreground">{h.toString().padStart(2, "0")}:00</div>
                {DAYS.map((_, dIdx) => (
                  <div key={dIdx} className="relative h-14 border-l border-border">
                    {BLOCKS.filter((b) => b.day === dIdx && b.start === h).map((b, i) => {
                      const tones: Record<string, string> = {
                        brand: "bg-primary/20 border-primary/40 text-foreground",
                        success: "bg-success/15 border-success/40 text-foreground",
                        warning: "bg-warning/15 border-warning/40 text-foreground",
                        neutral: "bg-surface-elevated border-border text-muted-foreground",
                      };
                      return (
                        <div key={i}
                          style={{ height: `${b.len * 56 - 6}px` }}
                          className={`absolute inset-x-1.5 top-1.5 rounded-md border px-2 py-1.5 text-[11px] font-medium leading-tight ${tones[b.tone]}`}
                        >
                          {b.title}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-primary/60" /> Meeting</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-success/70" /> Focus block</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-warning/70" /> Deadline / urgent</span>
        </div>
      </div>

      {/* Productivity coaching */}
      <Card className="mt-8 p-5">
        <SectionHeader eyebrow="Productivity Coach" title="Weekly review" />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { k: "Tasks completed", v: "23", note: "+18% vs last week" },
            { k: "Avg focus block", v: "78 min", note: "Above target of 60 min" },
            { k: "Meetings", v: "11", note: "−2 vs last week" },
          ].map((m) => (
            <div key={m.k} className="rounded-lg border border-border bg-background/40 p-4">
              <div className="text-xs text-muted-foreground">{m.k}</div>
              <div className="mt-1 text-2xl font-extrabold">{m.v}</div>
              <div className="mt-1 text-xs text-success">{m.note}</div>
            </div>
          ))}
        </div>
      </Card>
    </Shell>
  );
}
