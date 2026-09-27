import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import {
  Home, MessageSquare, History, Mail, ClipboardList, CheckSquare, CalendarDays,
  FlaskConical, FileText, Star, BarChart3, Bookmark, Settings, HelpCircle,
  LogOut, LogIn, Sparkles, Menu, X, Send,
} from "lucide-react";
import { ChatbotOverlay } from "./ChatbotOverlay";
import { useAuth } from "@/hooks/use-auth";
import { askNexora } from "@/lib/nexora-bus";
import { toast } from "sonner";

type NavItem = {
  to: string;
  label: string;
  icon: typeof Home;
  search?: Record<string, string>;
};
type NavGroup = { label?: string; items: NavItem[] };

const NAV: NavGroup[] = [
  { items: [{ to: "/", label: "Home", icon: Home }] },
  {
    label: "AI Workspace",
    items: [
      { to: "/chat", label: "AI Chat", icon: MessageSquare },
      { to: "/chat", label: "Recent Conversations", icon: History, search: { view: "history" } },
    ],
  },
  {
    label: "Work",
    items: [
      { to: "/email", label: "Email Studio", icon: Mail },
      { to: "/meetings", label: "Meeting Intelligence", icon: ClipboardList },
      { to: "/tasks", label: "Tasks", icon: CheckSquare },
      { to: "/tasks", label: "Calendar", icon: CalendarDays, search: { view: "calendar" } },
    ],
  },
  {
    label: "Research",
    items: [
      { to: "/research", label: "Research Lab", icon: FlaskConical },
      { to: "/research", label: "Documents", icon: FileText, search: { panel: "documents" } },
      { to: "/research", label: "Saved Research", icon: Star, search: { panel: "saved" } },
    ],
  },
  {
    label: "Personal",
    items: [
      { to: "/productivity", label: "Productivity", icon: BarChart3 },
      { to: "/saved", label: "Saved Items", icon: Bookmark },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/settings", label: "Settings", icon: Settings },
      { to: "/help", label: "Help", icon: HelpCircle },
    ],
  },
];

const MOBILE_TABS: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/email", label: "Email", icon: Mail },
  { to: "/research", label: "Research", icon: FlaskConical },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
];

export function Shell({ children, title }: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const location = useRouterState({ select: (s) => s.location });
  const path = location.pathname;
  const search = (location.search ?? {}) as Record<string, unknown>;
  const [open, setOpen] = useState(false);
  const [ask, setAsk] = useState("");
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Guest";
  const roleText = user ? (profile?.role || "Member") : "Not signed in";
  const initials = displayName.slice(0, 2).toUpperCase();

  const isActive = (item: NavItem) => {
    const samePath = item.to === "/" ? path === "/" : path === item.to;
    if (!samePath) return false;
    const keys = ["view", "panel"];
    return keys.every((k) => (item.search?.[k] ?? undefined) === (search[k] ?? undefined));
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/auth" });
  };

  const submitAsk = () => {
    const t = ask.trim();
    if (!t) return;
    askNexora(t, { send: true });
    setAsk("");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="flex">
        <aside className={`fixed inset-y-0 left-0 z-50 flex w-[260px] shrink-0 flex-col border-r border-border bg-surface transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex h-14 items-center justify-between px-5">
            <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
              <div className="grid h-7 w-7 place-items-center rounded-md bg-primary">
                <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold tracking-tight">NEXORA</span>
            </Link>
            <button onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center text-muted-foreground lg:hidden" aria-label="Close menu"><X className="h-5 w-5" /></button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 pb-4">
            {NAV.map((group, gi) => (
              <div key={gi} className="mt-3 first:mt-1">
                {group.label && <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{group.label}</div>}
                {group.items.map((item) => {
                  const active = isActive(item);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      to={item.to as never}
                      search={(item.search ?? {}) as never}
                      onClick={() => setOpen(false)}
                      className={`flex min-h-9 items-center gap-3 rounded-md px-3 py-1.5 text-sm transition ${
                        active ? "bg-surface-elevated font-medium text-foreground" : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2 text-xs">
              <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-elevated text-xs font-bold">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{displayName}</div>
                <div className="truncate text-[11px] text-muted-foreground">{roleText}</div>
              </div>
              {user ? (
                <button onClick={handleSignOut} title="Sign out" aria-label="Sign out" className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-surface-elevated hover:text-foreground">
                  <LogOut className="h-4 w-4" />
                </button>
              ) : (
                <Link to="/auth" className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground">
                  <LogIn className="h-3 w-3" /> Sign in
                </Link>
              )}
            </div>
          </div>
        </aside>

        {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-background/70 lg:hidden" />}

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border bg-background/95">
            <div className="flex h-14 items-center gap-3 px-4 md:px-8">
              <button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center lg:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
              <div className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground lg:hidden">{title}</div>
              <form
                onSubmit={(e) => { e.preventDefault(); submitAsk(); }}
                className="relative ml-auto hidden md:block"
              >
                <input
                  value={ask}
                  onChange={(e) => setAsk(e.target.value)}
                  placeholder="Ask Nexora anything…"
                  className="h-9 w-80 rounded-md border border-border bg-surface pl-3 pr-10 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <button type="submit" aria-label="Ask Nexora" className="absolute right-1 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-primary">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </header>
          <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-surface lg:hidden">
        {MOBILE_TABS.map((t) => {
          const active = t.to === "/" ? path === "/" : path === t.to;
          return (
            <Link key={t.to} to={t.to as never} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}>
              <t.icon className="h-5 w-5" />
              {t.label}
            </Link>
          );
        })}
      </nav>

      <ChatbotOverlay />
    </div>
  );
}
