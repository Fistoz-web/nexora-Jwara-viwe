import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-surface ${className}`}>{children}</div>;
}

export function SectionHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{eyebrow}</div>}
        <h2 className="mt-0.5 text-base font-semibold tracking-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "brand" | "success" | "warning" | "danger" }) {
  const tones: Record<string, string> = {
    neutral: "bg-surface-elevated text-muted-foreground",
    brand: "bg-primary/15 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-destructive/15 text-destructive",
  };
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tones[tone]}`}>{children}</span>;
}

type BtnProps = { children: ReactNode; onClick?: () => void; className?: string; disabled?: boolean; type?: "button" | "submit" };

/** The single primary action on a page. */
export function BrandButton({ children, onClick, className = "", disabled, type = "button" }: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

/** Secondary actions — visibly quieter than the primary one. */
export function GhostButton({ children, onClick, className = "", disabled, type = "button" }: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-9 items-center gap-2 rounded-md border border-border bg-transparent px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-surface-elevated disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export type Crumb = { label: string; to?: string; onClick?: () => void };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      {items.map((c, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          {c.to ? (
            <Link to={c.to as never} className="hover:text-foreground">{c.label}</Link>
          ) : c.onClick ? (
            <button onClick={c.onClick} className="hover:text-foreground">{c.label}</button>
          ) : (
            <span className={i === items.length - 1 ? "text-foreground" : ""}>{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/** Answers: Where am I? What can I do here? What should I do next? */
export function PageHeader({ title, tagline, description, primary, secondary, breadcrumbs }: {
  title: string;
  tagline: string;
  description?: string;
  primary?: ReactNode;
  secondary?: ReactNode;
  breadcrumbs?: Crumb[];
}) {
  return (
    <div className="mb-6">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm font-medium text-foreground/90">{tagline}</p>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {(primary || secondary) && (
          <div className="flex flex-wrap items-center gap-2">
            {secondary}
            {primary}
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ title, body, action, examples }: {
  title: string;
  body: string;
  action?: ReactNode;
  examples?: { label: string; onClick: () => void }[];
}) {
  return (
    <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
      {examples && examples.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {examples.map((e) => (
            <button key={e.label} onClick={e.onClick} className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-foreground">
              {e.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
