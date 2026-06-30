import { Link, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import {
  LayoutDashboard,
  Mail,
  ClipboardList,
  FlaskConical,
  CalendarDays,
  Settings,
  Search,
  Bell,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { ChatbotOverlay } from "./ChatbotOverlay";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/", label: "Daily Briefing", icon: LayoutDashboard, exact: true },
  { to: "/email", label: "Smart Email Studio", icon: Mail },
  { to: "/meetings", label: "Meeting Intelligence", icon: ClipboardList },
  { to: "/research", label: "Research Hub", icon: FlaskConical },
  { to: "/tasks", label: "Task Board & Calendar", icon: CalendarDays },
];

export function Shell({ children, title, subtitle, actions }: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background ambient-grid text-foreground">
      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-[260px] shrink-0 border-r border-border bg-surface/80 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex h-16 items-center justify-between px-5">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg brand-gradient shadow-[0_0_24px_-4px_rgba(168,85,247,0.55)]">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold tracking-tight">NEXORA</div>
                <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Workplace OS</div>
              </div>
            </Link>
            <button onClick={() => setOpen(false)} className="lg:hidden text-muted-foreground"><X className="h-5 w-5" /></button>
          </div>

          <nav className="px-3 py-2">
            <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Workspace</div>
            {NAV.map((item) => {
              const active = item.exact ? path === item.to : path.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to as never}
                  onClick={() => setOpen(false)}
                  className={`group mb-0.5 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-surface-elevated text-foreground shadow-[inset_0_0_0_1px_rgba(168,85,247,0.25)]"
                      : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                  <span className="flex-1">{item.label}</span>
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(168,85,247,0.8)]" />}
                </Link>
              );
            })}
          </nav>

          <div className="absolute inset-x-3 bottom-3 rounded-xl border border-border bg-surface-elevated/60 p-3">
            <div className="flex items-center gap-2 text-xs">
              <div className="h-8 w-8 shrink-0 rounded-full brand-gradient grid place-items-center text-xs font-bold text-white">AM</div>
              <div className="min-w-0">
                <div className="truncate font-medium">Alex Morgan</div>
                <div className="truncate text-[11px] text-muted-foreground">Product Manager</div>
              </div>
              <Settings className="ml-auto h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </aside>

        {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/60 lg:hidden" />}

        {/* Main */}
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border bg-background/70 backdrop-blur-xl">
            <div className="flex h-16 items-center gap-4 px-4 md:px-8">
              <button onClick={() => setOpen(true)} className="lg:hidden"><Menu className="h-5 w-5" /></button>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-base font-semibold tracking-tight md:text-lg">{title}</h1>
                {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
              </div>
              <div className="relative hidden md:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  placeholder="Ask Nexora or search…"
                  className="h-9 w-72 rounded-md border border-border bg-surface pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button className="relative grid h-9 w-9 place-items-center rounded-md border border-border bg-surface text-muted-foreground hover:text-foreground">
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
              </button>
              {actions}
            </div>
          </header>
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
      <ChatbotOverlay />
    </div>
  );
}
