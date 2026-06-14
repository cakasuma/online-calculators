import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { blogArticles, type BlogSection } from "@/config/blog";
import { Clock, ArrowLeft, ExternalLink, AlertCircle, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import NotFound from "@/pages/not-found";

const SITE_ORIGIN = "https://hellokalku.com";

function setMeta(attr: "name" | "property", key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute("content", value);
}

function setLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) { el = document.createElement("link"); el.setAttribute("rel", rel); if (hreflang) el.setAttribute("hreflang", hreflang); document.head.appendChild(el); }
  el.setAttribute("href", href);
}

/* ── Reading progress bar ───────────────────────────────────────────────── */
function ReadingProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    function onScroll() {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setPct(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <div className="hk-progress-bar" style={{ width: `${pct}%` }} aria-hidden="true" />;
}

/* ── TOC (mobile collapsible) ────────────────────────────────────────────── */
function MobileTOC({ headings }: { headings: string[] }) {
  const [open, setOpen] = useState(false);
  if (headings.length === 0) return null;
  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="mb-6 rounded-xl border bg-card overflow-hidden lg:hidden"
    >
      <summary className="flex items-center justify-between gap-2 px-4 py-3 cursor-pointer list-none font-semibold text-sm select-none">
        Contents
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </summary>
      <div className="border-t px-4 py-3 space-y-1">
        {headings.map((h, i) => (
          <a key={i} href={`#section-${i}`} className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5">
            {h}
          </a>
        ))}
      </div>
    </details>
  );
}

/* ── Sticky desktop sidebar TOC ─────────────────────────────────────────── */
function DesktopTOC({ headings }: { headings: string[] }) {
  if (headings.length === 0) return null;
  return (
    <div className="hidden lg:block">
      <div className="sticky top-[80px]">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Contents</p>
        <nav className="space-y-1">
          {headings.map((h, i) => (
            <a key={i} href={`#section-${i}`}
              className="block text-[13px] text-muted-foreground hover:text-foreground transition-colors py-1 border-l-2 border-transparent hover:border-primary pl-3">
              {h}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}

/* ── Calculator CTA card (sidebar) ─────────────────────────────────────── */
function CalcCTACard({ href, label }: { href: string; label: string }) {
  return (
    <div className="rounded-xl p-5 text-white" style={{ background: "#2563eb" }}>
      <p className="text-[13px] font-semibold mb-1 text-white/90">Put the numbers to work</p>
      <p className="text-[12px] text-white/65 mb-4 leading-relaxed">
        Use the free calculator to apply what you just learned.
      </p>
      <Link href={href}>
        <span className="inline-flex items-center gap-2 bg-white text-[#2563eb] font-bold text-[13px] px-4 py-2.5 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors w-full justify-center">
          {label} <ExternalLink className="w-3.5 h-3.5" />
        </span>
      </Link>
    </div>
  );
}

/* ── Section renderer ───────────────────────────────────────────────────── */
function SectionBlock({ section, index }: { section: BlogSection; index: number }) {
  return (
    <section id={`section-${index}`} className="space-y-4 scroll-mt-20">
      {section.heading && (
        <h2 className="text-[22px] font-bold tracking-tight text-foreground">{section.heading}</h2>
      )}

      {section.body?.map((paragraph, i) => (
        <p key={i} className="text-[16px] leading-[1.8] text-muted-foreground">
          {paragraph}
        </p>
      ))}

      {section.list && (
        <ul className="space-y-3">
          {section.list.map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <div className="space-y-0.5">
                <p className="text-[15px] font-semibold leading-snug">{item.text}</p>
                {item.subtext && (
                  <p className="text-[14px] text-muted-foreground leading-relaxed">{item.subtext}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {section.table && (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {section.table.headers.map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-bold text-xs text-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 1 ? "bg-muted/20 hover:bg-muted/40" : "hover:bg-muted/20"}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-2.5 text-[13px] text-muted-foreground">
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
        <div className="flex gap-3 rounded-xl border-l-4 border-primary bg-primary/5 p-4">
          <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-[14px] leading-relaxed text-foreground">{section.callout}</p>
        </div>
      )}
    </section>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */
export default function BlogArticle({ slug }: { slug: string }) {
  const article = blogArticles.find((a) => a.slug === slug);
  const relatedArticles = blogArticles.filter((a) => a.slug !== slug && a.categoryLabel === article?.categoryLabel).slice(0, 3);

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

  if (!article) return <NotFound />;

  const headings = article.sections.filter((s) => s.heading).map((s) => s.heading as string);

  return (
    <>
      <ReadingProgress />

      <div className="max-w-[1200px] mx-auto">
        {/* ── ARTICLE HERO ──────────────────────────────────────────────── */}
        <div
          className="-mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 px-5 sm:px-8 py-10 mb-8"
          style={{ background: "linear-gradient(180deg,#dbeafe 0%,#eff6ff 60%,#f9fafb 100%)" }}
        >
          <div className="max-w-[760px]">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
              <Link href="/blog">
                <span className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Guides
                </span>
              </Link>
              <span>/</span>
              <span className="text-foreground truncate max-w-[200px]">{article.categoryLabel}</span>
            </nav>

            {/* Meta */}
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <span className="inline-flex items-center rounded-full bg-[#2563eb]/10 text-[#2563eb] px-3 py-0.5 text-xs font-semibold">
                {article.categoryLabel}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {article.readingTime} min read
              </span>
              <time className="text-xs text-muted-foreground" dateTime={article.publishedDate}>
                {new Date(article.publishedDate).toLocaleDateString("en-MY", { year: "numeric", month: "long", day: "numeric" })}
              </time>
            </div>

            <h1 className="text-[28px] md:text-[36px] font-extrabold tracking-[-0.02em] leading-[1.2] text-foreground mb-4">
              {article.title}
            </h1>
            <p className="text-[16px] text-muted-foreground leading-relaxed max-w-[600px]">
              {article.intro}
            </p>
          </div>
        </div>

        {/* ── BODY: 2-col layout ──────────────────────────────────────── */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-12">
          {/* Article body */}
          <div className="min-w-0">
            {/* Mobile TOC */}
            <MobileTOC headings={headings} />

            <div className="space-y-10 divide-y divide-border">
              {article.sections.map((section, i) => (
                <div key={i} className={i > 0 ? "pt-10" : ""}>
                  <SectionBlock section={section} index={i} />

                  {/* Inline calculator CTA — insert after 2nd section if relatedCalculator exists */}
                  {i === 1 && article.relatedCalculator && (
                    <div
                      className="mt-8 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      style={{ background: "linear-gradient(135deg,#0f172a,#1e3a8a)" }}
                    >
                      <div>
                        <p className="text-white font-semibold text-[14px] mb-0.5">Try the calculator</p>
                        <p className="text-white/60 text-[13px]">Apply what you just learned to your own numbers.</p>
                      </div>
                      <Link href={article.relatedCalculator.href}>
                        <span className="inline-flex items-center gap-2 bg-white text-[#1d4ed8] font-bold text-[13px] px-4 py-2.5 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors shrink-0">
                          {article.relatedCalculator.label}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </span>
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            {article.relatedCalculator && (
              <div className="mt-12 rounded-xl border bg-muted/30 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Put the numbers to work</p>
                  <p className="text-sm text-muted-foreground">Use the free calculator to apply what you just learned.</p>
                </div>
                <Link href={article.relatedCalculator.href}>
                  <span className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shrink-0">
                    {article.relatedCalculator.label}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </div>
            )}

            {/* Mobile: related articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-10 lg:hidden">
                <h3 className="font-bold text-[15px] mb-4">Related Guides</h3>
                <div className="space-y-3">
                  {relatedArticles.map((a) => (
                    <Link key={a.slug} href={`/blog/${a.slug}`}>
                      <span className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:border-primary/40 cursor-pointer transition-all group">
                        <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">{a.title}</span>
                        <span className="ml-auto text-xs text-muted-foreground shrink-0">{a.readingTime} min</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <footer className="border-t mt-12 pt-6 text-xs text-muted-foreground space-y-1">
              <p>This guide is for informational purposes only and does not constitute financial, legal, tax, or religious advice. Rates reflect the 2026 year of assessment.</p>
              <p>For personalised advice, consult a licensed financial planner, registered tax agent, or qualified Islamic scholar.</p>
            </footer>
          </div>

          {/* Sticky sidebar — desktop only */}
          <aside className="hidden lg:flex flex-col gap-6">
            <DesktopTOC headings={headings} />

            {article.relatedCalculator && (
              <CalcCTACard href={article.relatedCalculator.href} label={article.relatedCalculator.label} />
            )}

            {relatedArticles.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Related Guides</p>
                <div className="space-y-2">
                  {relatedArticles.map((a) => (
                    <Link key={a.slug} href={`/blog/${a.slug}`}>
                      <span className="flex items-start gap-2 p-2.5 rounded-lg hover:bg-muted cursor-pointer transition-colors group">
                        <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="text-[13px] text-muted-foreground group-hover:text-foreground transition-colors line-clamp-2 leading-snug">{a.title}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* Footer related articles grid */}
        {relatedArticles.length > 0 && (
          <div className="mt-16 pt-10 border-t">
            <h3 className="font-bold text-[18px] mb-6">More in {article.categoryLabel}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedArticles.map((a) => (
                <Link key={a.slug} href={`/blog/${a.slug}`}>
                  <article className="group flex flex-col rounded-[14px] border bg-card hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full p-4 gap-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{a.readingTime} min read</span>
                    <h4 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors">{a.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{a.description}</p>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
