import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, ChevronRight, Clock, Search, X } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { tools } from "@/config/tools";
import { NAV_GROUPS } from "@/config/nav";
import { blogArticles } from "@/config/blog";
import { useLocale } from "@/hooks/use-locale";
import { useHistory } from "@/hooks/use-history";
import type { TranslationKey } from "@/lib/i18n";

const adsenseClient = import.meta.env.VITE_ADSENSE_CLIENT?.trim() || "";
const adsenseSlotHome = import.meta.env.VITE_ADSENSE_SLOT_HOME?.trim() || "";
const adsenseEnabled = import.meta.env.PROD && Boolean(adsenseClient);

/** Group blurbs reuse the existing category copy. */
const GROUP_DESC: Record<string, TranslationKey> = {
  "nav.groupFinance": "home.category.Finance.desc",
  "nav.groupMath": "home.category.Math.desc",
  "nav.groupIslamic": "home.category.Islamic.desc",
  "nav.groupHealth": "home.category.Health.desc",
};

const CALC_HREF: Record<string, string> = {
  salary: "/salary",
  epf: "/epf-retirement",
  housing: "/housing-loan",
  tax: "/income-tax",
  carloan: "/car-loan",
  fd: "/fixed-deposit",
  bmi: "/bmi",
  normal: "/normal",
  scientific: "/scientific",
  faraid: "/faraid",
  zakat: "/zakat",
  wasiat: "/wasiat",
};

const FEATURED_ARTICLES = blogArticles.slice(0, 3);

/** Search over the tool list. Enter opens the first match; Escape clears. */
function ToolSearchBar() {
  const { t } = useLocale();
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const q = query.trim().toLowerCase();
  const results = q
    ? tools.filter((tool) => {
        const name = t(`tools.${tool.slug}.name` as TranslationKey).toLowerCase();
        const desc = t(`tools.${tool.slug}.desc` as TranslationKey).toLowerCase();
        return name.includes(q) || desc.includes(q);
      })
    : [];

  function clear() {
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-[18px] h-[18px] text-muted-foreground pointer-events-none" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (q) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") clear();
            if (e.key === "Enter" && results[0]) {
              navigate(results[0].href);
              setQuery("");
              setOpen(false);
            }
          }}
          placeholder={t("home.search.placeholder")}
          aria-label={t("home.search.placeholder")}
          aria-expanded={open && q.length > 0}
          aria-haspopup="listbox"
          role="combobox"
          aria-autocomplete="list"
          className="w-full h-12 rounded-lg border border-input bg-card pl-12 pr-11 text-base placeholder:text-muted-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
        />
        {query && (
          <button
            onClick={clear}
            aria-label={t("home.search.clear")}
            className="absolute right-1.5 h-9 w-9 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && q && (
        <div
          role="listbox"
          aria-label="Search results"
          className="absolute left-0 right-0 top-full z-40 mt-2 rounded-lg border bg-popover shadow-md overflow-hidden"
        >
          {results.length > 0 ? (
            <>
              {results.map((tool, i) => (
                <Link
                  key={tool.slug}
                  href={tool.href}
                  role="option"
                  aria-selected={i === 0}
                  onClick={() => {
                    setQuery("");
                    setOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 min-h-[56px] py-2.5 hover:bg-accent focus:bg-accent outline-none border-b last:border-b-0 ${
                    i === 0 ? "bg-accent/60" : ""
                  }`}
                >
                  <tool.icon className="w-[18px] h-[18px] text-muted-foreground shrink-0" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block font-semibold text-[15px] truncate">{t(`tools.${tool.slug}.name` as TranslationKey)}</span>
                    <span className="block text-sm text-muted-foreground truncate">{t(`tools.${tool.slug}.desc` as TranslationKey)}</span>
                  </span>
                </Link>
              ))}
              <p className="px-4 py-2 text-xs text-muted-foreground bg-muted/50 hidden sm:block">{t("home.search.enterHint")}</p>
            </>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">{t("home.search.noResults")}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const { t } = useLocale();
  const { entries: historyEntries } = useHistory();
  const recentEntries = historyEntries.slice(0, 3);

  return (
    <div className="w-full">
      {/* ── Title + search: the one job of this page is getting to a calculator ── */}
      <section className="hk-container pt-10 pb-8 md:pt-16 md:pb-10">
        <h1 className="text-[32px] sm:text-[44px] font-semibold leading-[1.1] tracking-[-0.02em] max-w-[18ch]">
          {t("home.heading")}
        </h1>
        <p className="mt-4 max-w-[58ch] text-base sm:text-lg leading-relaxed text-muted-foreground">{t("home.lede")}</p>
        <div className="mt-7 max-w-[640px]">
          <ToolSearchBar />
        </div>
      </section>

      {/* ── Pick up where you left off (only when there is history) ── */}
      {recentEntries.length > 0 && (
        <section className="hk-container pb-8" aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
            <Clock className="w-4 h-4" aria-hidden="true" />
            {t("home.recentlyUsed.title")}
          </h2>
          <ul className="grid gap-2 sm:grid-cols-3">
            {recentEntries.map((entry) => {
              const href = entry.url || CALC_HREF[entry.calculator] || "/";
              return (
                <li key={entry.id}>
                  <Link href={href} className="hk-row block rounded-lg border bg-card px-4 py-3 min-h-[56px]">
                    <span className="block text-sm font-semibold truncate">{entry.expression}</span>
                    <span className="block text-sm text-muted-foreground truncate tabular-nums">{entry.result}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ── Directory: every calculator, grouped, one row each ── */}
      <section className="hk-container pb-12 md:pb-16" aria-label={t("nav.calculators")}>
        {NAV_GROUPS.map((group) => (
          <div key={group.labelKey} className="grid md:grid-cols-[220px_minmax(0,1fr)] gap-x-10 gap-y-3 py-8 border-t">
            <div>
              <h2 className="text-lg font-semibold">{t(group.labelKey)}</h2>
              <p className="mt-1 text-sm text-muted-foreground max-w-[32ch]">{t(GROUP_DESC[group.labelKey])}</p>
            </div>
            <ul className="divide-y rounded-lg border bg-card">
              {group.items.map((item) => {
                const tool = tools.find((tt) => tt.href === item.href);
                if (!tool) return null;
                const badge = tool.badge ? t(`tools.${tool.slug}.badge` as TranslationKey) : null;
                return (
                  <li key={item.href}>
                    <Link href={item.href} className="hk-row group flex items-center gap-4 px-4 py-3.5 min-h-[64px]">
                      <item.icon className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="font-semibold text-base">{t(`tools.${tool.slug}.name` as TranslationKey)}</span>
                          {badge && <span className="text-xs font-semibold text-primary">{badge}</span>}
                        </span>
                        <span className="block text-sm text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                          {t(`tools.${tool.slug}.desc` as TranslationKey)}
                        </span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {adsenseEnabled && adsenseSlotHome ? (
          <AdSlot id="home-ad" slot={adsenseSlotHome} client={adsenseClient} enabled={adsenseEnabled} className="mx-auto mt-4" />
        ) : null}
      </section>

      {/* ── Guides: three plain links, nothing decorative ── */}
      <section className="border-t bg-card">
        <div className="hk-container py-10 md:py-12 grid md:grid-cols-[220px_minmax(0,1fr)] gap-x-10 gap-y-4">
          <div>
            <h2 className="text-lg font-semibold">{t("home.guides.title")}</h2>
            <Link href="/blog" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              {t("nav.allGuides")}
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
          <ul className="divide-y">
            {FEATURED_ARTICLES.map((article) => (
              <li key={article.slug}>
                <Link href={`/blog/${article.slug}`} className="group block py-4 first:pt-0">
                  <span className="block text-base font-semibold group-hover:text-primary transition-colors">{article.title}</span>
                  <span className="block text-sm text-muted-foreground mt-1">
                    {article.categoryLabel} · {article.readingTime} {t("home.guides.minRead")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
