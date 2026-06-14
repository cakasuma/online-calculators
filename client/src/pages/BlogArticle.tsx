import { useEffect } from "react";
import { Link } from "wouter";
import { blogArticles, type BlogSection } from "@/config/blog";
import { Clock, ArrowLeft, ExternalLink, AlertCircle } from "lucide-react";
import NotFound from "@/pages/not-found";

const SITE_ORIGIN = "https://hellokalku.com";

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
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (hreflang) el.setAttribute("hreflang", hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function SectionBlock({ section }: { section: BlogSection }) {
  return (
    <section className="space-y-3">
      {section.heading && (
        <h2 className="text-lg font-semibold tracking-tight">{section.heading}</h2>
      )}

      {section.body?.map((paragraph, i) => (
        <p key={i} className="text-sm leading-relaxed text-muted-foreground">
          {paragraph}
        </p>
      ))}

      {section.list && (
        <ul className="space-y-3">
          {section.list.map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium leading-snug">{item.text}</p>
                {item.subtext && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.subtext}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {section.table && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {section.table.headers.map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-xs text-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 1 ? "bg-muted/20" : ""}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-xs text-muted-foreground">
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
        <div className="flex gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed text-foreground">{section.callout}</p>
        </div>
      )}
    </section>
  );
}

export default function BlogArticle({ slug }: { slug: string }) {
  const article = blogArticles.find((a) => a.slug === slug);

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

    // Canonical + hreflang — blog articles are English-only so all locales
    // point back to the same English canonical URL.
    setLink("canonical", canonical);
    setLink("alternate", canonical, "en");
    setLink("alternate", canonical, "ms-MY");
    setLink("alternate", canonical, "id-ID");
    setLink("alternate", canonical, "x-default");
  }, [article]);

  if (!article) return <NotFound />;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/blog">
          <span className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" />
            Guides
          </span>
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[240px]">{article.categoryLabel}</span>
      </nav>

      {/* Article header */}
      <header className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">
            {article.categoryLabel}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {article.readingTime} min read
          </span>
          <time className="text-xs text-muted-foreground" dateTime={article.publishedDate}>
            {new Date(article.publishedDate).toLocaleDateString("en-MY", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug">{article.title}</h1>
        <p className="text-muted-foreground leading-relaxed">{article.intro}</p>
      </header>

      {/* Sections */}
      <div className="space-y-8 divide-y divide-border">
        {article.sections.map((section, i) => (
          <div key={i} className={i > 0 ? "pt-8" : ""}>
            <SectionBlock section={section} />
          </div>
        ))}
      </div>

      {/* Related calculator CTA */}
      {article.relatedCalculator && (
        <div className="rounded-xl border bg-muted/30 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Put the numbers to work</p>
            <p className="text-sm text-muted-foreground">
              Use the free calculator to apply what you just learned to your own situation.
            </p>
          </div>
          <Link href={article.relatedCalculator.href}>
            <span className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shrink-0">
              {article.relatedCalculator.label}
              <ExternalLink className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      )}

      {/* Disclaimer */}
      <footer className="border-t pt-6 text-xs text-muted-foreground space-y-1">
        <p>
          This guide is for informational purposes only and does not constitute financial, legal, tax, or religious advice. Rates and rules reflect the 2026 year of assessment and may change. Always verify current figures with official sources: KWSP (kwsp.gov.my), LHDN (hasil.gov.my), PERKESO (perkeso.gov.my), and your state's Islamic religious authority.
        </p>
        <p>
          For personalised advice, consult a licensed financial planner, registered tax agent, or qualified Islamic scholar.
        </p>
      </footer>
    </div>
  );
}
