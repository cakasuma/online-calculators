import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, BadgeCheck, Clock, Globe, Lock, MapPin, Search, Sparkles, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdSlot } from "@/components/AdSlot";
import { toolBrand, tools } from "@/config/tools";
import { useLocale } from "@/hooks/use-locale";
import { useInView } from "@/hooks/use-in-view";
import { useHistory } from "@/hooks/use-history";
import type { TranslationKey } from "@/lib/i18n";

const adsenseClient = import.meta.env.VITE_ADSENSE_CLIENT?.trim() || "";
const adsenseSlotHome = import.meta.env.VITE_ADSENSE_SLOT_HOME?.trim() || "";
const adsenseEnabled = import.meta.env.PROD && Boolean(adsenseClient);

const TOOL_GROUPS = [
  {
    labelKey: "nav.groupFinance" as TranslationKey,
    descKey: "home.category.Finance.desc" as TranslationKey,
    hrefs: ["/salary", "/epf-retirement"],
  },
  {
    labelKey: "nav.groupMath" as TranslationKey,
    descKey: "home.category.Math.desc" as TranslationKey,
    hrefs: ["/normal", "/scientific"],
  },
  {
    labelKey: "nav.groupIslamic" as TranslationKey,
    descKey: "home.category.Islamic.desc" as TranslationKey,
    hrefs: ["/faraid", "/zakat", "/wasiat"],
  },
] as const;

const FEATURES = [
  { icon: BadgeCheck, titleKey: "home.features.accurate.title", bodyKey: "home.features.accurate.body" },
  { icon: MapPin, titleKey: "home.features.malaysia.title", bodyKey: "home.features.malaysia.body" },
  { icon: Globe, titleKey: "home.features.multilingual.title", bodyKey: "home.features.multilingual.body" },
  { icon: Lock, titleKey: "home.features.private.title", bodyKey: "home.features.private.body" },
] as const;

const FAQ_PAIRS = [
  ["home.faq.q1", "home.faq.a1"],
  ["home.faq.q2", "home.faq.a2"],
  ["home.faq.q3", "home.faq.a3"],
  ["home.faq.q4", "home.faq.a4"],
  ["home.faq.q5", "home.faq.a5"],
] as const;

/** Wraps children with a gentle scroll-triggered fade-in. */
function FadeIn({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={`fade-in-section${inView ? " in-view" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

/** Autocomplete search dropdown — shows matching tools as navigable results. */
function ToolSearchBar() {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
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
      {/* Input */}
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-4 h-4 text-muted-foreground pointer-events-none shrink-0" />
        <input
          ref={inputRef}
          type="search"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { if (q) setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === "Escape") clear();
          }}
          placeholder={t("home.search.placeholder")}
          aria-label={t("home.search.placeholder")}
          aria-expanded={open && (results.length > 0 || q.length > 0)}
          aria-haspopup="listbox"
          role="combobox"
          aria-autocomplete="list"
          className="w-full h-12 rounded-xl border bg-background pl-11 pr-10 text-base shadow-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-1 placeholder:text-muted-foreground transition-shadow md:text-sm"
        />
        {query && (
          <button
            onClick={clear}
            aria-label={t("home.search.clear")}
            tabIndex={0}
            className="absolute right-3 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {open && q && (
        <div
          role="listbox"
          aria-label="Search results"
          className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border bg-popover shadow-lg overflow-hidden"
        >
          {results.length > 0 ? (
            results.map((tool) => (
              <Link
                key={tool.slug}
                href={tool.href}
                role="option"
                aria-selected="false"
                onClick={() => { setQuery(""); setOpen(false); }}
                className="flex items-start gap-3 px-4 py-3 hover:bg-accent focus:bg-accent cursor-pointer outline-none border-b last:border-b-0 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <tool.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm truncate block">
                    {t(`tools.${tool.slug}.name` as TranslationKey)}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                    {t(`tools.${tool.slug}.desc` as TranslationKey)}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              {t("home.search.noResults")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const CALC_HREF: Record<string, string> = {
  salary: "/salary",
  epf: "/epf-retirement",
  normal: "/normal",
  scientific: "/scientific",
  faraid: "/faraid",
  zakat: "/zakat",
  wasiat: "/wasiat",
};

export default function HomePage() {
  const { t } = useLocale();
  const { entries: historyEntries } = useHistory();
  const recentEntries = historyEntries.slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto space-y-14">

      {/* ── Hero ── */}
      <section className="hero-gradient rounded-3xl border p-6 sm:p-10 shadow-sm">
        <Badge className="mb-4" variant="secondary">
          <Sparkles className="w-3.5 h-3.5 mr-1" />
          {t("home.hero.badge")}
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">{toolBrand.name}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">
          {t("home.hero.subtitle")}
        </p>

        {/* Prominent search */}
        <div className="mt-6 max-w-xl">
          <ToolSearchBar />
        </div>

        {/* Secondary CTAs */}
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild size="sm" variant="outline">
            <Link href="/salary">{t("home.hero.ctaSalary")}</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/faraid">{t("home.hero.ctaFaraid")}</Link>
          </Button>
        </div>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t pt-6">
          {(
            [
              { value: "7", labelKey: "home.stats.tools" },
              { value: "3", labelKey: "home.stats.locales" },
              { value: "2026", labelKey: "home.stats.updated" },
              { value: "100%", labelKey: "home.stats.free" },
            ] as const
          ).map(({ value, labelKey }) => (
            <div key={labelKey} className="text-center">
              <div className="text-2xl font-bold text-primary">{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t(labelKey)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Recently used ── */}
      {recentEntries.length > 0 && (
        <FadeIn>
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">{t("home.recentlyUsed.title")}</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {recentEntries.map((entry) => {
                const href = entry.url || CALC_HREF[entry.calculator] || "/";
                const tool = tools.find((tt) => tt.href === CALC_HREF[entry.calculator]);
                return (
                  <Link key={entry.id} href={href}>
                    <span className="group flex items-start gap-3 rounded-xl border bg-card p-3 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all">
                      {tool && (
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0 mt-0.5">
                          <tool.icon className="w-3.5 h-3.5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{entry.expression}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{entry.result}</p>
                      </div>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </FadeIn>
      )}

      {/* ── Tools by category ── */}
      <div className="space-y-10">
        {TOOL_GROUPS.map((group) => {
          const groupTools = tools.filter((tool) =>
            group.hrefs.includes(tool.href as (typeof group.hrefs)[number]),
          );
          return (
            <FadeIn key={group.labelKey}>
              <section>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">{t(group.labelKey)}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{t(group.descKey)}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {groupTools.map((tool) => (
                    <Link key={tool.slug} href={tool.href}>
                      <Card className="h-full hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                        <CardContent className="p-5 flex flex-col gap-3 h-full">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                                <tool.icon className="w-5 h-5 text-primary" />
                              </div>
                              <span className="font-semibold text-sm leading-tight">
                                {t(`tools.${tool.slug}.name` as TranslationKey)}
                              </span>
                            </div>
                            {tool.badge ? (
                              <Badge variant="secondary" className="text-xs shrink-0">
                                {t(`tools.${tool.slug}.badge` as TranslationKey)}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                            {t(`tools.${tool.slug}.desc` as TranslationKey)}
                          </p>
                          <span className="text-xs text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                            {t("home.featured.openTool")}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            </FadeIn>
          );
        })}
      </div>

      {adsenseEnabled && adsenseSlotHome ? (
        <AdSlot slot={adsenseSlotHome} className="mx-auto" />
      ) : null}

      {/* ── Why HelloKalku ── */}
      <FadeIn>
        <section>
          <h2 className="text-2xl font-semibold">{t("home.features.title")}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, titleKey, bodyKey }) => (
              <div key={titleKey} className="rounded-xl border bg-card p-5 space-y-2">
                <div className="flex items-center gap-2.5">
                  <Icon className="w-5 h-5 text-primary shrink-0" />
                  <h3 className="font-semibold text-sm">{t(titleKey)}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(bodyKey)}</p>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* ── FAQ ── */}
      <FadeIn>
        <section className="rounded-2xl border bg-card p-6 sm:p-8">
          <h2 className="text-xl font-semibold">{t("home.faq.title")}</h2>
          <dl className="mt-5 divide-y">
            {FAQ_PAIRS.map(([qKey, aKey]) => (
              <div key={qKey} className="py-4 first:pt-0 last:pb-0">
                <dt className="font-medium text-sm">{t(qKey)}</dt>
                <dd className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{t(aKey)}</dd>
              </div>
            ))}
          </dl>
        </section>
      </FadeIn>

      <FadeIn>
        <p className="text-sm text-muted-foreground text-center pb-2">
          <Link href="/partners" className="hover:text-foreground underline-offset-2 hover:underline">
            {t("home.hero.partnersLink")}
          </Link>
        </p>
      </FadeIn>
    </div>
  );
}
