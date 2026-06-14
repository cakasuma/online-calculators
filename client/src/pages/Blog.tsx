import { useState } from "react";
import { Link } from "wouter";
import { blogArticles } from "@/config/blog";
import { Clock, BookOpen, ArrowRight, Wallet, PiggyBank, Scale, Search } from "lucide-react";

type LucideIcon = typeof Wallet;

const CATEGORIES = ["All", "Salary & Tax", "EPF & Retirement", "Islamic Finance"];

const CATEGORY_COLORS: Record<string, string> = {
  "Salary & Tax":     "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "EPF & Retirement": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  "Islamic Finance":  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const GUIDE_THUMBNAILS: Record<string, { icon: LucideIcon; gradient: string; iconColor: string }> = {
  "Salary & Tax":     { icon: Wallet,    gradient: "from-blue-500/20 via-blue-400/10 to-transparent",   iconColor: "text-blue-500 dark:text-blue-400" },
  "EPF & Retirement": { icon: PiggyBank, gradient: "from-green-500/20 via-green-400/10 to-transparent", iconColor: "text-green-600 dark:text-green-400" },
  "Islamic Finance":  { icon: Scale,     gradient: "from-amber-500/20 via-amber-400/10 to-transparent", iconColor: "text-amber-600 dark:text-amber-400" },
};

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = blogArticles.filter((a) => {
    const matchesCat = activeCategory === "All" || a.categoryLabel === activeCategory;
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  // First article as featured, rest in grid
  const [featured, ...rest] = filtered;

  return (
    <div className="max-w-[1200px] mx-auto space-y-0">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="hk-hero-bg -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 px-5 sm:px-8 py-14 mb-0"
        style={{ borderRadius: 0 }}
      >
        <div className="max-w-[1200px] mx-auto text-center">
          <div
            className="inline-flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full text-[12px] font-semibold uppercase tracking-wider"
            style={{ background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.3)", color: "#93c5fd" }}
          >
            <BookOpen className="w-3 h-3" />
            Guides &amp; Education
          </div>
          <h1 className="text-[32px] md:text-[44px] font-extrabold text-white tracking-[-0.02em] leading-tight mb-4">
            Calculator Guides &amp;{" "}
            <span style={{ background: "linear-gradient(90deg,#60a5fa,#2dd4bf)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Financial Education
            </span>
          </h1>
          <p className="text-[16px] max-w-xl mx-auto mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>
            In-depth guides on Malaysian financial planning — salary deductions, EPF, zakat, faraid, and more.
          </p>

          {/* Search bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "rgba(255,255,255,0.4)" }} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guides…"
              className="w-full h-11 rounded-xl pl-11 pr-4 text-sm outline-none"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#fff",
              }}
            />
          </div>
        </div>
      </section>

      {/* ── FILTER BAR (sticky below nav) ─────────────────────────────────── */}
      <div className="sticky top-[60px] z-30 -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 px-5 sm:px-8 py-3 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-[1200px] mx-auto flex gap-2 overflow-x-auto pb-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`hk-filter-tab shrink-0${activeCategory === cat ? " active" : ""}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ───────────────────────────────────────────────────────── */}
      <div className="pt-8 pb-16">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-16">No guides found. Try a different search or category.</p>
        )}

        {/* Featured card (first result) */}
        {featured && (
          <Link href={`/blog/${featured.slug}`}>
            <article className="group flex flex-col md:flex-row rounded-[16px] border bg-card hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer overflow-hidden mb-8"
              style={{ minHeight: 260 }}>
              {/* Thumbnail */}
              {(() => {
                const thumb = GUIDE_THUMBNAILS[featured.categoryLabel];
                const ThumbIcon = thumb?.icon ?? BookOpen;
                return (
                  <div className={`relative flex items-center justify-center md:w-[420px] shrink-0 h-48 md:h-auto bg-gradient-to-br ${thumb?.gradient ?? "from-muted/60 to-transparent"} border-b md:border-b-0 md:border-r border-border/50 overflow-hidden`}>
                    <ThumbIcon className={`absolute w-48 h-48 ${thumb?.iconColor ?? "text-muted-foreground"} opacity-[0.07] -rotate-12 translate-x-16`} aria-hidden="true" />
                    <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-2xl bg-background/70 backdrop-blur-sm border border-border/60 shadow-sm">
                      <ThumbIcon className={`w-7 h-7 ${thumb?.iconColor ?? "text-muted-foreground"}`} />
                    </div>
                    <span className="absolute top-3 left-3 text-[11px] font-bold text-white bg-[#2563eb] px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Featured
                    </span>
                  </div>
                );
              })()}

              {/* Body */}
              <div className="flex flex-col gap-3 p-6 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[featured.categoryLabel] ?? "bg-muted text-muted-foreground"}`}>
                    {featured.categoryLabel}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {featured.readingTime} min read
                  </span>
                  <time className="text-xs text-muted-foreground" dateTime={featured.publishedDate}>
                    {new Date(featured.publishedDate).toLocaleDateString("en-MY", { year: "numeric", month: "long", day: "numeric" })}
                  </time>
                </div>
                <h2 className="text-[20px] md:text-[22px] font-bold leading-snug group-hover:text-primary transition-colors">
                  {featured.title}
                </h2>
                <p className="text-[14px] text-muted-foreground leading-relaxed flex-1">
                  {featured.description}
                </p>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-[#2563eb] mt-auto">
                  Read guide <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </article>
          </Link>
        )}

        {/* Grid of remaining articles */}
        {rest.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((article) => {
              const categoryColor = CATEGORY_COLORS[article.categoryLabel] ?? "bg-muted text-muted-foreground";
              const thumb = GUIDE_THUMBNAILS[article.categoryLabel];
              const ThumbIcon = thumb?.icon ?? BookOpen;

              return (
                <Link key={article.slug} href={`/blog/${article.slug}`}>
                  <article className="group flex flex-col rounded-[14px] border bg-card hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full overflow-hidden">
                    {/* Thumbnail */}
                    <div className={`relative flex items-center justify-center h-[148px] bg-gradient-to-br ${thumb?.gradient ?? "from-muted/60 to-transparent"} border-b border-border/50 overflow-hidden`}>
                      <ThumbIcon className={`absolute w-28 h-28 ${thumb?.iconColor ?? "text-muted-foreground"} opacity-[0.07] -rotate-6 translate-x-10`} aria-hidden="true" />
                      <div className="relative z-10 flex items-center justify-center w-11 h-11 rounded-xl bg-background/70 backdrop-blur-sm border border-border/60 shadow-sm">
                        <ThumbIcon className={`w-5 h-5 ${thumb?.iconColor ?? "text-muted-foreground"}`} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5 p-4 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColor}`}>
                          {article.categoryLabel}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                          <Clock className="w-3 h-3" />
                          {article.readingTime} min read
                        </span>
                      </div>

                      <h2 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </h2>

                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                        {article.description}
                      </p>

                      <div className="flex items-center justify-between mt-auto pt-1">
                        <time className="text-xs text-muted-foreground" dateTime={article.publishedDate}>
                          {new Date(article.publishedDate).toLocaleDateString("en-MY", { year: "numeric", month: "long", day: "numeric" })}
                        </time>
                        <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          Read <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <footer className="border-t pt-6 pb-10 text-sm text-muted-foreground space-y-1">
        <p>All guides are written for informational purposes only and do not constitute financial, legal, or religious advice.</p>
        <p>Rates reflect the 2026 year of assessment. Verify with official sources: KWSP, LHDN, PERKESO, and your state's zakat authority.</p>
      </footer>
    </div>
  );
}
