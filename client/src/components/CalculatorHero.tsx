import type { ReactNode } from "react";
import { Link } from "wouter";

interface CalculatorHeroProps {
  /** Breadcrumb category label, e.g. "Finance" / "Math" / "Islamic & Planning". */
  category?: string;
  title: string;
  subtitle?: string;
  /** Small pill badges shown under the description, e.g. ["2026 rates", "Runs in browser"]. */
  badges?: string[];
  /** Optional floating result card rendered in the right column on desktop. */
  result?: ReactNode;
}

/**
 * Full-bleed dark gradient hero shared by every calculator page. Matches the
 * homepage / guides hero treatment so the calculators sit consistently inside
 * the redesigned full-bleed shell. The optional `result` slot floats a summary
 * card on the right (desktop), per the calculator mockup.
 */
export function CalculatorHero({ category, title, subtitle, badges, result }: CalculatorHeroProps) {
  return (
    <section className="hk-hero-bg print:hidden">
      <div className={`hk-container py-12 md:py-14 grid items-center gap-8 ${result ? "md:grid-cols-[1fr_380px]" : ""}`}>
        <div className="min-w-0">
          <nav className="flex items-center gap-1.5 text-[13px] mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
            <Link href="/"><span className="hover:text-white transition-colors cursor-pointer">Home</span></Link>
            {category && (
              <>
                <span>/</span>
                <span className="text-white/70">{category}</span>
              </>
            )}
          </nav>
          <h1 className="text-[28px] sm:text-[34px] md:text-[38px] font-extrabold leading-[1.15] tracking-[-0.02em] text-white break-words">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 max-w-[560px] text-[15px] sm:text-[16px] leading-[1.6]" style={{ color: "#93c5fd" }}>
              {subtitle}
            </p>
          )}
          {badges && badges.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {badges.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)" }}
                >
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>
        {result && <div className="hidden md:block">{result}</div>}
      </div>
    </section>
  );
}
