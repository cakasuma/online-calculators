import { useMemo, useState } from "react";
import { Link } from "wouter";
import { blogArticles } from "@/config/blog";
import { Clock, BookOpen, Search, Wallet, PiggyBank, Scale } from "lucide-react";

type LucideIcon = typeof Wallet;

const CATEGORY_COLORS: Record<string, string> = {
  "Salary & Tax": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "EPF & Retirement": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  "Islamic Finance": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const GUIDE_THUMBNAILS: Record<string, { icon: LucideIcon; gradient: string; iconColor: string }> = {
  "Salary & Tax": {
    icon: Wallet,
    gradient: "from-blue-500/20 via-blue-400/10 to-transparent",
    iconColor: "text-blue-500 dark:text-blue-400",
  },
  "EPF & Retirement": {
    icon: PiggyBank,
    gradient: "from-green-500/20 via-green-400/10 to-transparent",
    iconColor: "text-green-600 dark:text-green-400",
  },
  "Islamic Finance": {
    icon: Scale,
    gradient: "from-amber-500/20 via-amber-400/10 to-transparent",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-MY", { year: "numeric", month: "short", day: "numeric" });
}

export default function Blog() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("All");

  // Categories in first-seen order, with counts.
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of blogArticles) counts.set(a.categoryLabel, (counts.get(a.categoryLabel) ?? 0) + 1);
    return [{ key: "All", count: blogArticles.length }, ...[...counts].map(([key, count]) => ({ key, count }))];
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = blogArticles.filter((a) => {
    const matchesCat = activeCat === "All" || a.categoryLabel === activeCat;
    const matchesQuery = !q || a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  // Featured = first match; rest = grid. Only feature when nothing is being filtered.
  const isUnfiltered = activeCat === "All" && !q;
  const featured = isUnfiltered ? filtered[0] : undefined;
  const rest = featured ? filtered.slice(1) : filtered;

  const FeaturedThumb = featured ? GUIDE_THUMBNAILS[featured.categoryLabel]?.icon ?? BookOpen : BookOpen;

  return (
    <div className="w-full">
      {/* ── HERO (full-bleed dark) ── */}
      <section className="hk-hero-bg">
        <div className="hk-container py-14 md:py-16">
          <div className="max-w-[720px]">
            <span className="inline-flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full text-[12px] font-semibold uppercase tracking-wider"
              style={{ background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.3)", color: "#93c5fd" }}>
              <BookOpen className="w-3 h-3" />
              Guides &amp; Education
            </span>
            <h1 className="text-[30px] sm:text-[40px] font-extrabold leading-[1.1] tracking-[-0.02em] text-white">
              Calculator Guides &amp; Financial Education
            </h1>
            <p className="mt-4 max-w-[600px] text-[15px] sm:text-[16px] leading-[1.6]" style={{ color: "#93c5fd" }}>
              In-depth guides on Malaysian financial planning, Islamic finance, salary deductions, EPF, zakat, faraid, and more.
            </p>
            <div className="relative mt-6 max-w-[520px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search guides — e.g. EPF, zakat, income tax…"
                aria-label="Search guides"
                className="w-full h-12 rounded-xl border border-white/15 bg-white/10 backdrop-blur pl-11 pr-4 text-[15px] text-white placeholder:text-white/40 outline-none focus:border-white/40 focus:bg-white/[0.15]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── STICKY FILTER BAR ── */}
      <div className="hk-filter-bar">
        <div className="hk-container py-3 flex gap-2 overflow-x-auto hk-no-scrollbar">
          {categories.map(({ key, count }) => (
            <button
              key={key}
              onClick={() => setActiveCat(key)}
              className={`hk-cat-tab${activeCat === key ? " active" : ""}`}
            >
              {key}
              <span className={`ml-1 text-[11px] ${activeCat === key ? "text-white/70" : "text-muted-foreground/70"}`}>{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="hk-container py-10">
        {/* Featured */}
        {featured && (
          <Link href={`/blog/${featured.slug}`}>
            <article className="hk-card group grid sm:grid-cols-[minmax(0,420px)_1fr] rounded-[16px] border border-border bg-card overflow-hidden cursor-pointer mb-10 hover:border-primary/40">
              <div className={`relative flex items-center justify-center min-h-[180px] sm:min-h-[260px] bg-gradient-to-br ${GUIDE_THUMBNAILS[featured.categoryLabel]?.gradient ?? "from-muted/60 to-transparent"} overflow-hidden`}>
                <FeaturedThumb className={`absolute w-40 h-40 ${GUIDE_THUMBNAILS[featured.categoryLabel]?.iconColor ?? "text-muted-foreground"} opacity-[0.08] -rotate-6 translate-x-10`} aria-hidden="true" />
                <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-2xl bg-background/70 backdrop-blur-sm border border-border/60 shadow-sm">
                  <FeaturedThumb className={`w-8 h-8 ${GUIDE_THUMBNAILS[featured.categoryLabel]?.iconColor ?? "text-muted-foreground"}`} />
                </div>
              </div>
              <div className="p-6 sm:p-8 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide">Featured</span>
                  <span className="text-[12px] text-muted-foreground">{featured.categoryLabel} · {featured.readingTime} min read</span>
                </div>
                <h2 className="text-[20px] sm:text-[24px] font-extrabold leading-tight tracking-tight group-hover:text-primary transition-colors">
                  {featured.title}
                </h2>
                <p className="mt-3 text-[14px] text-muted-foreground leading-relaxed line-clamp-3">{featured.description}</p>
                <div className="mt-5 flex items-center justify-between">
                  <time className="text-[12px] text-muted-foreground" dateTime={featured.publishedDate}>{fmtDate(featured.publishedDate)}</time>
                  <span className="text-[13px] font-semibold text-primary">Read guide →</span>
                </div>
              </div>
            </article>
          </Link>
        )}

        {/* Grid */}
        {isUnfiltered && (
          <p className="text-[12px] font-bold text-primary uppercase tracking-[0.06em] mb-4 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            All Guides
          </p>
        )}

        {rest.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((article) => {
              const categoryColor = CATEGORY_COLORS[article.categoryLabel] ?? "bg-muted text-muted-foreground";
              const thumb = GUIDE_THUMBNAILS[article.categoryLabel];
              const ThumbIcon = thumb?.icon ?? BookOpen;
              return (
                <Link key={article.slug} href={`/blog/${article.slug}`}>
                  <article className="hk-card group flex flex-col rounded-[14px] border border-border bg-card overflow-hidden cursor-pointer h-full hover:border-primary/40">
                    <div className={`relative flex items-center justify-center h-[148px] bg-gradient-to-br ${thumb?.gradient ?? "from-muted/60 to-transparent"} overflow-hidden`}>
                      <ThumbIcon className={`absolute w-28 h-28 ${thumb?.iconColor ?? "text-muted-foreground"} opacity-[0.07] -rotate-6 translate-x-8`} aria-hidden="true" />
                      <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-xl bg-background/70 backdrop-blur-sm border border-border/60 shadow-sm">
                        <ThumbIcon className={`w-6 h-6 ${thumb?.iconColor ?? "text-muted-foreground"}`} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2.5 p-5 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${categoryColor}`}>
                          {article.categoryLabel}
                        </span>
                        <span className="flex items-center gap-1 text-[12px] text-muted-foreground shrink-0">
                          <Clock className="w-3 h-3" />
                          {article.readingTime} min
                        </span>
                      </div>
                      <h2 className="text-[15px] font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </h2>
                      <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2 flex-1">
                        {article.description}
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-1">
                        <time className="text-[12px] text-muted-foreground" dateTime={article.publishedDate}>{fmtDate(article.publishedDate)}</time>
                        <span className="text-[13px] font-semibold text-primary">Read →</span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">No guides match your search.</p>
        )}

        <footer className="border-t border-border mt-12 pt-6 text-sm text-muted-foreground space-y-1">
          <p>
            All guides are written for informational purposes only and do not constitute financial, legal, or religious advice. For personalised advice, consult a licensed financial planner, tax professional, or Islamic scholar.
          </p>
          <p>
            Contribution rates and tax brackets reflect the 2026 year of assessment. Verify current figures with official sources: KWSP, LHDN, PERKESO, and your state's zakat authority.
          </p>
        </footer>
      </div>
    </div>
  );
}
