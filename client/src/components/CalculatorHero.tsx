import type { ReactNode } from "react";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

interface CalculatorHeroProps {
  /** Breadcrumb category label, e.g. "Finance" / "Math" / "Islamic & Planning". */
  category?: string;
  title: string;
  subtitle?: string;
  /** Short facts shown as one muted line under the description, e.g. ["2026 rates", "Runs in browser"]. */
  badges?: string[];
  /** Optional headline answer rendered beside the title on desktop (see HeadlineResult). */
  result?: ReactNode;
}

/**
 * Page header shared by every calculator: breadcrumb, title, one-line
 * description, and (on desktop) the headline answer. Flat and light so the
 * form is the first thing that carries weight on the page.
 */
export function CalculatorHero({ category, title, subtitle, badges, result }: CalculatorHeroProps) {
  return (
    <section className="hk-pagehead print:hidden">
      <div className={`hk-container py-8 md:py-10 grid items-end gap-8 ${result ? "md:grid-cols-[minmax(0,1fr)_340px]" : ""}`}>
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            {category && (
              <>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{category}</span>
              </>
            )}
          </nav>
          <h1 className="text-[28px] sm:text-[34px] font-semibold leading-[1.15] tracking-[-0.015em] break-words">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 max-w-[62ch] text-base sm:text-[17px] leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          )}
          {badges && badges.length > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">{badges.join(" · ")}</p>
          )}
        </div>
        {result && <div className="hidden md:block">{result}</div>}
      </div>
    </section>
  );
}

interface HeadlineResultProps {
  label: string;
  value: string;
  note?: string;
  /** Optional 0–100 bar under the value. `color` overrides the accent. */
  progress?: { pct: number; color?: string };
}

/** The single headline answer for a calculator: label, big figure, one line of context. */
export function HeadlineResult({ label, value, note, progress }: HeadlineResultProps) {
  return (
    <div className="rounded-xl border bg-background p-5" aria-live="polite">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-display text-[32px] lg:text-4xl font-semibold leading-tight tabular-nums break-words">
        {value}
      </p>
      {progress && (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${Math.max(0, Math.min(100, progress.pct))}%`, ...(progress.color ? { background: progress.color } : {}) }}
          />
        </div>
      )}
      {note && <p className="mt-3 text-sm text-muted-foreground">{note}</p>}
    </div>
  );
}
