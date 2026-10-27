import { useEffect, useState, type ReactNode, type RefObject } from "react";
import { useLocale } from "@/hooks/use-locale";
import { Link } from "wouter";
import { ChevronDown, ChevronRight } from "lucide-react";

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
      <div className={`hk-container py-6 md:py-10 grid items-end gap-5 md:gap-8 ${result ? "md:grid-cols-[minmax(0,1fr)_340px]" : ""}`}>
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
            <p className={`mt-3 max-w-[62ch] text-base sm:text-[17px] leading-relaxed text-muted-foreground hidden sm:block`}>
              {subtitle}
            </p>
          )}
          {badges && badges.length > 0 && (
            <p className={`mt-3 text-sm text-muted-foreground hidden sm:block`}>{badges.join(" · ")}</p>
          )}
        </div>
        {result && <div>{result}</div>}
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

/**
 * Mobile-only pill that keeps the headline answer on screen while the user edits
 * inputs. It hides itself once the real result is visible, so only one result
 * is ever on screen.
 */
export function MobileResultBar({ label, value, targetRef }: { label: string; value: string; targetRef: RefObject<HTMLElement> }) {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = targetRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, [targetRef]);
  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={() => targetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
      className="fixed inset-x-3 bottom-3 z-30 flex min-h-14 items-center justify-between gap-3 rounded-xl border border-primary/30 bg-card px-4 py-2 text-left shadow-lg lg:hidden print:hidden"
      aria-label={`${label}: ${value}`}
    >
      <span className="min-w-0">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block font-display text-xl font-semibold tabular-nums leading-tight">{value}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
        {t("result.breakdown")} <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </span>
    </button>
  );
}
