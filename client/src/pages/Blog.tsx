import { useMemo, useState } from "react";
import { Link } from "wouter";
import { blogArticles } from "@/config/blog";
import { Search } from "lucide-react";

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

  return (
    <div className="w-full">
      {/* ── Header ── */}
      <section className="hk-pagehead">
        <div className="hk-container py-8 md:py-12">
          <h1 className="text-[28px] sm:text-[38px] font-semibold leading-[1.15] tracking-[-0.015em]">
            Guides
          </h1>
          <p className="mt-3 max-w-[60ch] text-base sm:text-[17px] leading-relaxed text-muted-foreground">
            Plain-language explainers on Malaysian salary deductions, EPF, income tax, zakat and faraid.
          </p>
          <div className="relative mt-6 max-w-[520px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guides, e.g. EPF, zakat, income tax"
              aria-label="Search guides"
              className="w-full h-12 rounded-lg border border-input bg-background pl-12 pr-4 text-base placeholder:text-muted-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
            />
          </div>
        </div>
      </section>

      {/* ── Filters ── */}
      <div className="hk-filter-bar">
        <div className="hk-container py-3 flex gap-2 overflow-x-auto hk-no-scrollbar">
          {categories.map(({ key, count }) => (
            <button
              key={key}
              onClick={() => setActiveCat(key)}
              aria-pressed={activeCat === key}
              className={`hk-cat-tab${activeCat === key ? " active" : ""}`}
            >
              {key}
              <span className="text-xs opacity-70 tabular-nums">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── List ── */}
      <div className="hk-container py-8 md:py-10">
        {filtered.length > 0 ? (
          <ul className="max-w-[760px] divide-y">
            {filtered.map((article) => (
              <li key={article.slug}>
                <Link href={`/blog/${article.slug}`} className="group block py-5 first:pt-0">
                  <span className="block text-sm text-muted-foreground">
                    {article.categoryLabel} · {article.readingTime} min read · <time dateTime={article.publishedDate}>{fmtDate(article.publishedDate)}</time>
                  </span>
                  <span className="block mt-1.5 font-display text-lg sm:text-xl font-semibold leading-snug group-hover:text-primary transition-colors">
                    {article.title}
                  </span>
                  <span className="block mt-1.5 text-base text-muted-foreground leading-relaxed line-clamp-2">
                    {article.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground py-12">No guides match your search.</p>
        )}

        <footer className="border-t border-border mt-12 pt-6 max-w-[760px] text-sm text-muted-foreground space-y-1">
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
