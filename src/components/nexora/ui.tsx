import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-surface/80 backdrop-blur-sm shadow-[var(--shadow-soft)] ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</div>}
        <h2 className="mt-1 text-xl font-bold tracking-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "brand" | "success" | "warning" | "danger" }) {
  const tones: Record<string, string> = {
    neutral: "bg-surface-elevated text-muted-foreground",
    brand: "bg-primary/15 text-primary ring-1 ring-inset ring-primary/30",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-destructive/15 text-destructive",
  };
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tones[tone]}`}>{children}</span>;
}

export function BrandButton({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_24px_-6px_rgba(168,85,247,0.6)] transition hover:brightness-110 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition hover:border-border-active hover:bg-surface-elevated ${className}`}
    >
      {children}
    </button>
  );
}
