import { useEffect, useState } from "react";
import { Link } from "wouter";
import { blogArticles, type BlogSection } from "@/config/blog";
import { Clock, ArrowLeft, ArrowRight, Link2, Printer, BookOpen } from "lucide-react";
import NotFound from "@/pages/not-found";

const SITE_ORIGIN = "https://hellokalku.com";

const CATEGORY_TAG: Record<string, string> = {
  "Salary & Tax": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "EPF & Retirement": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  "Islamic Finance": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-MY", { year: "numeric", month: "long", day: "numeric" });
}

function setMeta(attr: "name" | "property", key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function setLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (hreflang) el.setAttribute("hreflang", hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/** Fixed reading-progress bar at the very top of the viewport. */
function ReadingProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setPct(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <div className="hk-progress-bar" style={{ width: `${pct}%` }} aria-hidden="true" />;
}

/** Highlights the TOC entry whose section is currently in view. */
function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState<string>(ids[0] ?? "");
  useEffect(() => {
    if (!ids.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -65% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [ids.join("|")]);
  return active;
}

function SectionBlock({ section, id }: { section: BlogSection; id?: string }) {
  return (
    <section className="scroll-mt-24" id={id}>
      {section.heading && (
        <h2 className="text-[20px] sm:text-[22px] font-extrabold tracking-tight mt-10 mb-3">{section.heading}</h2>
      )}

      {section.body?.map((paragraph, i) => (
        <p key={i} className="text-[15px] sm:text-[16px] leading-[1.8] text-foreground/80 mb-4">
          {paragraph}
        </p>
      ))}

      {section.list && (
        <ul className="space-y-3 my-4">
          {section.list.map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <div className="space-y-0.5">
                <p className="text-[15px] font-semibold leading-snug">{item.text}</p>
                {item.subtext && <p className="text-[14px] text-muted-foreground leading-relaxed">{item.subtext}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}

      {section.table && (
        <div className="overflow-x-auto rounded-[10px] border border-border my-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60">
                {section.table.headers.map((h) => (
                  <th key={h} className="px-3.5 py-2.5 text-left font-bold text-[12px] uppercase tracking-wide text-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                  {row.map((cell, ci) => (
                    <td key={ci} className={`px-3.5 py-2.5 text-[13px] ${ci === 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {section.callout && (
        <div className="hk-callout my-5">
          <p className="leading-relaxed">{section.callout}</p>
        </div>
      )}
    </section>
  );
}

export default function BlogArticle({ slug }: { slug: string }) {
  const article = blogArticles.find((a) => a.slug === slug);
  const related = blogArticles.filter((a) => a.slug !== slug).slice(0, 3);

  useEffect(() => {
    if (!article) return;
    const fullTitle = `${article.title} | HelloKalku`;
    const canonical = `${SITE_ORIGIN}/en/blog/${article.slug}`;
    const ogImage = `${SITE_ORIGIN}/og-default.png`;
    document.title = fullTitle;
    document.documentElement.lang = "en";
    setMeta("name", "description", article.description);
    setMeta("name", "keywords", article.keywords);
    setMeta("name", "robots", "index,follow,max-image-preview:large");
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", article.description);
    setMeta("property", "og:type", "article");
    setMeta("property", "og:url", canonical);
    setMeta("property", "og:locale", "en_US");
    setMeta("property", "og:image", ogImage);
    setMeta("property", "og:image:width", "1200");
    setMeta("property", "og:image:height", "630");
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", article.description);
    setMeta("name", "twitter:image", ogImage);
    setLink("canonical", canonical);
    setLink("alternate", canonical, "en");
    setLink("alternate", canonical, "ms-MY");
    setLink("alternate", canonical, "id-ID");
    setLink("alternate", canonical, "x-default");
  }, [article]);

  const headings = (article?.sections ?? [])
    .filter((s) => s.heading)
    .map((s) => ({ id: slugify(s.heading as string), label: s.heading as string }));
  const activeId = useScrollSpy(headings.map((h) => h.id));

  if (!article) return <NotFound />;

  function copyLink() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  const tagColor = CATEGORY_TAG[article.categoryLabel] ?? "bg-primary/10 text-primary";

  const CalcCTA = article.relatedCalculator && (
    <div className="rounded-[14px] bg-primary text-primary-foreground p-5">
      <div className="text-[11px] font-bold uppercase tracking-wider opacity-80 mb-1">Try it yourself</div>
      <div className="text-[16px] font-bold mb-1.5">{article.relatedCalculator.label}</div>
      <p className="text-[13px] opacity-90 leading-relaxed mb-4">
        Apply what you just learned to your own numbers in seconds.
      </p>
      <Link href={article.relatedCalculator.href}>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 hover:bg-white/25 px-3.5 py-2 text-[13px] font-semibold cursor-pointer transition-colors">
          {article.relatedCalculator.label}
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </Link>
    </div>
  );

  const RelatedList = related.length > 0 && (
    <div className="rounded-[14px] border border-border bg-card p-5">
      <div className="text-[13px] font-bold mb-3">Related Guides</div>
      <div className="space-y-3">
        {related.slice(0, 2).map((a) => (
          <Link key={a.slug} href={`/blog/${a.slug}`}>
            <span className="flex flex-col gap-0.5 cursor-pointer group">
              <span className="text-[13px] font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">{a.title}</span>
              <span className="text-[12px] text-muted-foreground">{a.categoryLabel} · {a.readingTime} min</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <ReadingProgress />

      {/* ── HERO (theme-aware light gradient) ── */}
      <section className="hk-article-hero border-b border-border/60">
        <div className="hk-container py-10 md:py-12">
          <div className="max-w-[760px]">
            <nav className="flex items-center gap-1.5 text-[13px] text-muted-foreground mb-5">
              <Link href="/blog">
                <span className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Guides
                </span>
              </Link>
              <span>/</span>
              <span className="text-foreground truncate max-w-[220px]">{article.categoryLabel}</span>
            </nav>

            <div className="flex items-center gap-3 flex-wrap mb-4">
              <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-semibold ${tagColor}`}>
                {article.categoryLabel}
              </span>
              <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                {article.readingTime} min read
              </span>
              <span className="text-muted-foreground/50">·</span>
              <time className="text-[12px] text-muted-foreground" dateTime={article.publishedDate}>{fmtDate(article.publishedDate)}</time>
            </div>

            <h1 className="text-[26px] sm:text-[32px] md:text-[36px] font-extrabold tracking-[-0.02em] leading-[1.2]">
              {article.title}
            </h1>
            <p className="mt-4 text-[15px] sm:text-[16px] text-muted-foreground leading-relaxed max-w-[640px]">{article.intro}</p>

            <div className="mt-6 flex items-center gap-2">
              <button onClick={copyLink} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Link2 className="w-3.5 h-3.5" /> Copy link
              </button>
              <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Printer className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── BODY + SIDEBAR ── */}
      <div className="hk-container py-10">
        <div className="grid lg:grid-cols-[1fr_320px] gap-10 lg:gap-12">
          {/* Article body */}
          <article className="min-w-0 max-w-[760px]">
            {/* Mobile TOC disclosure */}
            {headings.length > 0 && (
              <details className="lg:hidden mb-8 rounded-[12px] border border-border bg-card">
                <summary className="cursor-pointer select-none px-4 py-3 text-[13px] font-bold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" /> Contents
                </summary>
                <ul className="px-4 pb-4 space-y-2">
                  {headings.map((h) => (
                    <li key={h.id}>
                      <a href={`#${h.id}`} className="text-[13px] text-muted-foreground hover:text-primary transition-colors">{h.label}</a>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {article.sections.map((section, i) => {
              const id = section.heading ? slugify(section.heading) : undefined;
              return (
                <div key={i}>
                  <SectionBlock section={section} id={id} />
                  {/* Inline calc CTA after the 2nd section */}
                  {i === 1 && article.relatedCalculator && (
                    <div className="hk-inline-cta my-8 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white">
                      <div>
                        <h4 className="font-bold text-[16px] mb-1">Calculate your exact numbers</h4>
                        <p className="text-[13px] text-white/70 leading-relaxed">Use the {article.relatedCalculator.label} to apply this to your own situation.</p>
                      </div>
                      <Link href={article.relatedCalculator.href}>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white text-[#1d4ed8] px-4 py-2 text-[13px] font-bold cursor-pointer shrink-0 whitespace-nowrap">
                          {article.relatedCalculator.label}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Mobile: CTA + related below content */}
            <div className="lg:hidden mt-10 space-y-6">
              {CalcCTA}
              {RelatedList}
            </div>

            {/* Disclaimer */}
            <footer className="border-t border-border mt-10 pt-6 text-[12px] text-muted-foreground space-y-1">
              <p>
                This guide is for informational purposes only and does not constitute financial, legal, tax, or religious advice. Rates and rules reflect the 2026 year of assessment and may change. Verify current figures with official sources: KWSP, LHDN, PERKESO, and your state's Islamic religious authority.
              </p>
              <p>For personalised advice, consult a licensed financial planner, registered tax agent, or qualified Islamic scholar.</p>
            </footer>
          </article>

          {/* Sticky sidebar (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-[84px] space-y-6">
              {headings.length > 0 && (
                <div className="rounded-[14px] border border-border bg-card p-5">
                  <div className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-3">On this page</div>
                  <ul className="space-y-2 border-l border-border">
                    {headings.map((h) => (
                      <li key={h.id} className="-ml-px">
                        <a
                          href={`#${h.id}`}
                          className={`block border-l-2 pl-3 text-[13px] leading-snug transition-colors ${
                            activeId === h.id ? "border-primary text-primary font-semibold" : "border-transparent text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {h.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {CalcCTA}
              {RelatedList}
            </div>
          </aside>
        </div>
      </div>

      {/* ── FOOTER RELATED GRID ── */}
      {related.length > 0 && (
        <section className="border-t border-border bg-muted/30">
          <div className="hk-container py-12">
            <h3 className="text-[20px] font-extrabold tracking-tight mb-6">Continue reading</h3>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((a) => (
                <Link key={a.slug} href={`/blog/${a.slug}`}>
                  <article className="hk-card group rounded-[14px] border border-border bg-card p-5 cursor-pointer h-full hover:border-primary/40">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${CATEGORY_TAG[a.categoryLabel] ?? "bg-primary/10 text-primary"}`}>
                      {a.categoryLabel}
                    </span>
                    <h4 className="mt-3 text-[15px] font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">{a.title}</h4>
                    <p className="mt-2 text-[12px] text-muted-foreground">{a.readingTime} min read · {fmtDate(a.publishedDate)}</p>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
