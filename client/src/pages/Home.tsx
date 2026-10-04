import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, BadgeCheck, BookOpen, Clock, Globe, Lock, MapPin, PiggyBank, Scale, Search, Sparkles, Wallet, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdSlot } from "@/components/AdSlot";
import { toolBrand, tools } from "@/config/tools";
import { blogArticles } from "@/config/blog";
import { useLocale } from "@/hooks/use-locale";
import { useHistory } from "@/hooks/use-history";
import type { TranslationKey } from "@/lib/i18n";

const adsenseClient = import.meta.env.VITE_ADSENSE_CLIENT?.trim() || "";
const adsenseSlotHome = import.meta.env.VITE_ADSENSE_SLOT_HOME?.trim() || "";
const adsenseEnabled = import.meta.env.PROD && Boolean(adsenseClient);

const TOOL_GROUPS = [
  {
    labelKey: "nav.groupFinance" as TranslationKey,
    descKey: "home.category.Finance.desc" as TranslationKey,
    hrefs: ["/salary", "/epf-retirement", "/housing-loan", "/income-tax"],
  },
  {
    labelKey: "nav.groupHealth" as TranslationKey,
    descKey: "home.category.Health.desc" as TranslationKey,
    hrefs: ["/bmi"],
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

const GROUP_COLORS: Record<string, { iconColor: string; iconBg: string; badge: string; hoverBorder: string; accentLine: string }> = {
  "nav.groupFinance": {
    iconColor: "text-blue-700 dark:text-blue-400",
    iconBg: "bg-blue-50 dark:bg-blue-950/50 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50",
    badge: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60",
    hoverBorder: "hover:border-blue-300/60 dark:hover:border-blue-700/60",
    accentLine: "bg-blue-500",
  },
  "nav.groupMath": {
    iconColor: "text-orange-600 dark:text-orange-400",
    iconBg: "bg-orange-50 dark:bg-orange-950/50 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50",
    badge: "bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200/60 dark:border-orange-800/60",
    hoverBorder: "hover:border-orange-300/60 dark:hover:border-orange-700/60",
    accentLine: "bg-orange-500",
  },
  "nav.groupIslamic": {
    iconColor: "text-emerald-700 dark:text-emerald-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/50 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50",
    badge: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60",
    hoverBorder: "hover:border-emerald-300/60 dark:hover:border-emerald-700/60",
    accentLine: "bg-emerald-500",
  },
  "nav.groupHealth": {
    iconColor: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-50 dark:bg-rose-950/50 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/50",
    badge: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/60",
    hoverBorder: "hover:border-rose-300/60 dark:hover:border-rose-700/60",
    accentLine: "bg-rose-500",
  },
};

const FEATURES = [
  { icon: BadgeCheck, titleKey: "home.features.accurate.title", bodyKey: "home.features.accurate.body", iconColor: "text-emerald-700 dark:text-emerald-400", iconBg: "bg-emerald-50 dark:bg-emerald-950/50" },
  { icon: MapPin, titleKey: "home.features.malaysia.title", bodyKey: "home.features.malaysia.body", iconColor: "text-blue-700 dark:text-blue-400", iconBg: "bg-blue-50 dark:bg-blue-950/50" },
  { icon: Globe, titleKey: "home.features.multilingual.title", bodyKey: "home.features.multilingual.body", iconColor: "text-orange-600 dark:text-orange-400", iconBg: "bg-orange-50 dark:bg-orange-950/50" },
  { icon: Lock, titleKey: "home.features.private.title", bodyKey: "home.features.private.body", iconColor: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-50 dark:bg-amber-950/50" },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  "Salary & Tax": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "EPF & Retirement": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  "Islamic Finance": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

type LucideIcon = typeof Wallet;
const GUIDE_THUMBNAILS: Record<string, { icon: LucideIcon; gradient: string; iconColor: string; pattern: string }> = {
  "Salary & Tax": {
    icon: Wallet,
    gradient: "from-blue-500/20 via-blue-400/10 to-transparent",
    iconColor: "text-blue-500 dark:text-blue-400",
    pattern: "opacity-[0.07]",
  },
  "EPF & Retirement": {
    icon: PiggyBank,
    gradient: "from-green-500/20 via-green-400/10 to-transparent",
    iconColor: "text-green-600 dark:text-green-400",
    pattern: "opacity-[0.07]",
  },
  "Islamic Finance": {
    icon: Scale,
    gradient: "from-amber-500/20 via-amber-400/10 to-transparent",
    iconColor: "text-amber-600 dark:text-amber-400",
    pattern: "opacity-[0.07]",
  },
};

const FEATURED_ARTICLES = blogArticles.slice(0, 6);

/** Plain section wrapper — content is always fully visible. The mockups have
 *  no scroll-reveal animation, and an opacity-based reveal risked leaving
 *  content invisible/faint on fast scroll, so we render children directly. */
function FadeIn({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
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
  housing: "/housing-loan",
  tax: "/income-tax",
  bmi: "/bmi",
  normal: "/normal",
  scientific: "/scientific",
  faraid: "/faraid",
  zakat: "/zakat",
  wasiat: "/wasiat",
};

const HERO_STATS = [
  { value: "10", labelKey: "home.stats.tools" as TranslationKey },
  { value: "3", labelKey: "home.stats.locales" as TranslationKey },
  { value: "2026", labelKey: "home.stats.updated" as TranslationKey },
  { value: "100%", labelKey: "home.stats.free" as TranslationKey },
];

/** Static salary-preview card shown on the right of the hero (desktop only). */
function HeroPreviewCard() {
  const { t } = useLocale();
  const rows = [
    { label: "EPF (11%)", value: "− RM 550" },
    { label: "SOCSO", value: "− RM 19.75" },
    { label: "EIS", value: "− RM 9.75" },
    { label: "PCB (Income Tax)", value: "− RM 121" },
  ];
  return (
    <div className="rounded-[20px] border border-white/12 bg-white/[0.08] p-6 backdrop-blur-xl">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[#3b82f6] to-[#2dd4bf] flex items-center justify-center">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-white font-semibold text-[15px] leading-tight">{t("nav.salary")}</div>
          <div className="text-white/50 text-[12px]">Malaysia · 2026 rates</div>
        </div>
        <span className="ml-auto rounded-full bg-emerald-400/20 text-emerald-300 text-[11px] font-semibold px-2 py-0.5">Live</span>
      </div>
      <div className="flex gap-2 mb-4">
        <div className="flex-1 rounded-lg border border-white/12 bg-white/[0.08] px-3.5 py-2.5">
          <span className="block text-white/40 text-[11px]">Gross Monthly Salary</span>
          <span className="text-white text-[14px] font-medium">RM 5,000</span>
        </div>
        <span className="rounded-lg bg-[#3b82f6] text-white text-[13px] font-semibold px-4 flex items-center">Calculate</span>
      </div>
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between items-center py-2.5 border-b border-white/[0.07]">
          <span className="text-white/60 text-[13px]">{r.label}</span>
          <span className="text-red-400 font-semibold text-[13px]">{r.value}</span>
        </div>
      ))}
      <div className="flex justify-between items-center pt-3">
        <span className="text-white font-semibold text-[13px]">Take-Home Pay</span>
        <span className="font-bold text-[18px] text-[#4ade80]">RM 4,299.50</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { t } = useLocale();
  const { entries: historyEntries } = useHistory();
  const recentEntries = historyEntries.slice(0, 3);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const filterTabs = [
    { key: "All", label: "All" },
    ...TOOL_GROUPS.map((g) => ({ key: g.labelKey as string, label: t(g.labelKey) })),
  ];
  const visibleGroups = activeFilter === "All" ? TOOL_GROUPS : TOOL_GROUPS.filter((g) => g.labelKey === activeFilter);

  return (
    <div className="w-full">

      {/* ── HERO (full-bleed dark gradient) ── */}
      <section className="hk-hero-bg">
        <div className="hk-container py-16 md:py-20">
          <div className="grid md:grid-cols-[1fr_440px] gap-10 lg:gap-16 items-center">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 mb-5 px-3 py-1 rounded-full text-[12px] font-semibold uppercase tracking-wider"
                style={{ background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.3)", color: "#93c5fd" }}>
                <Sparkles className="w-3 h-3" />
                {t("home.hero.badge")}
              </span>
              <h1 className="text-[34px] sm:text-[44px] md:text-[52px] font-extrabold leading-[1.08] tracking-[-0.02em] text-white">
                {t("brand.tagline")}
              </h1>
              <p className="mt-5 max-w-[480px] text-[16px] sm:text-[17px] leading-[1.6]" style={{ color: "#93c5fd" }}>
                {t("home.hero.subtitle")}
              </p>

              <div className="mt-7 max-w-[520px] [&_input]:bg-white/10 [&_input]:border-white/15 [&_input]:text-white [&_input]:placeholder:text-white/40 [&_input]:backdrop-blur">
                <ToolSearchBar />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/salary">
                  <span className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] bg-white text-[#1d4ed8] font-bold text-[15px] cursor-pointer transition hover:-translate-y-0.5 shadow-lg shadow-black/20">
                    <Wallet className="w-4 h-4" />
                    {t("home.hero.ctaSalary")}
                  </span>
                </Link>
                <Link href="/faraid">
                  <span className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] font-semibold text-[15px] text-white cursor-pointer transition hover:bg-white/10"
                    style={{ border: "1.5px solid rgba(255,255,255,0.3)" }}>
                    {t("home.hero.ctaFaraid")}
                  </span>
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-5 sm:gap-x-8">
                {HERO_STATS.map(({ value, labelKey }, i) => (
                  <div key={labelKey} className="flex items-center gap-4">
                    {i > 0 && <div className="hidden sm:block w-px h-8 self-stretch bg-white/15" />}
                    <div>
                      <div className="text-[24px] sm:text-[26px] font-extrabold text-white leading-none">{value}</div>
                      <div className="text-[11px] uppercase tracking-[0.04em] mt-1 text-white/50">{t(labelKey)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live preview card — hidden below md */}
            <div className="hidden md:block">
              <HeroPreviewCard />
            </div>
          </div>
        </div>
      </section>

      {/* ── Recently used (contained) ── */}
      {recentEntries.length > 0 && (
        <FadeIn>
          <section className="hk-container pt-12">
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

      {/* ── TOOLS (contained) ── */}
      <section className="hk-container py-14">
        <div className="mb-5">
          <p className="text-[12px] font-bold text-primary uppercase tracking-[0.06em] mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            Tools
          </p>
          <h2 className="text-[22px] sm:text-[26px] font-bold tracking-tight">{t("home.tools.title")}</h2>
          <p className="text-sm text-muted-foreground mt-1">Everything runs in your browser — no sign-up, no data leaves your device.</p>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto hk-no-scrollbar pb-1 -mx-1 px-1">
          {filterTabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`hk-cat-tab${activeFilter === key ? " active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tool groups */}
        <div className="space-y-10">
          {visibleGroups.map((group) => {
            const groupTools = tools.filter((tool) =>
              group.hrefs.includes(tool.href as (typeof group.hrefs)[number]),
            );
            const colors = GROUP_COLORS[group.labelKey];
            return (
              <FadeIn key={group.labelKey}>
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`w-1 h-7 rounded-full shrink-0 ${colors.accentLine}`} aria-hidden="true" />
                    <div>
                      <h3 className="text-[16px] font-semibold">{t(group.labelKey)}</h3>
                      <p className="text-[13px] text-muted-foreground">{t(group.descKey)}</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {groupTools.map((tool) => (
                      <Link key={tool.slug} href={tool.href}>
                        <div className={`hk-card group relative flex flex-col gap-3 p-5 bg-card rounded-[14px] border border-border cursor-pointer h-full hover:border-primary/40`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0 ${colors.iconBg}`}>
                              <tool.icon className={`w-5 h-5 ${colors.iconColor}`} />
                            </div>
                            {tool.badge ? (
                              <Badge variant="secondary" className={`text-[11px] shrink-0 border ${colors.badge}`}>
                                {t(`tools.${tool.slug}.badge` as TranslationKey)}
                              </Badge>
                            ) : null}
                          </div>
                          <div>
                            <p className="font-bold text-[15px] mb-1.5 leading-snug">
                              {t(`tools.${tool.slug}.name` as TranslationKey)}
                            </p>
                            <p className="text-[13px] text-muted-foreground leading-relaxed">
                              {t(`tools.${tool.slug}.desc` as TranslationKey)}
                            </p>
                          </div>
                          <span className="mt-auto inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-lg w-fit group-hover:bg-primary/15 transition-colors">
                            {t("home.featured.openTool")}
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>

        {adsenseEnabled && adsenseSlotHome ? (
          <AdSlot slot={adsenseSlotHome} className="mx-auto mt-12" />
        ) : null}
      </section>

      {/* ── WHY (full-bleed dark) ── */}
      <section className="hk-why text-white">
        <div className="hk-container py-16 md:py-20">
          <div className="text-center mb-12">
            <span className="inline-block rounded-full text-[12px] font-semibold uppercase tracking-[0.06em] px-3 py-1 mb-3"
              style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}>
              {t("home.features.title")}
            </span>
            <h2 className="text-[28px] md:text-[36px] font-extrabold tracking-[-0.02em] leading-tight text-white">
              Built differently, on purpose
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, titleKey, bodyKey }) => (
              <div key={titleKey} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 transition-colors hover:bg-white/[0.07] hover:border-[#3b82f6]/30">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(59,130,246,0.15)" }}>
                  <Icon className="w-6 h-6 text-[#60a5fa]" />
                </div>
                <h3 className="font-bold text-[16px] text-white mb-2">{t(titleKey)}</h3>
                <p className="text-[13px] text-white/55 leading-relaxed">{t(bodyKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GUIDES (contained) ── */}
      <section className="hk-container py-14">
        <div className="flex items-end justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full bg-primary shrink-0" aria-hidden="true" />
            <div>
              <h2 className="text-[22px] sm:text-[26px] font-bold tracking-tight">Guides &amp; Education</h2>
              <p className="text-sm text-muted-foreground mt-0.5">In-depth articles to help you understand the numbers</p>
            </div>
          </div>
          <Link href="/blog">
            <span className="hidden sm:flex items-center gap-1 text-sm font-semibold text-primary hover:underline underline-offset-2 cursor-pointer shrink-0">
              See all guides
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_ARTICLES.map((article) => {
            const catColor = CATEGORY_COLORS[article.categoryLabel] ?? "bg-muted text-muted-foreground";
            const thumb = GUIDE_THUMBNAILS[article.categoryLabel];
            const ThumbIcon = thumb?.icon ?? BookOpen;
            return (
              <Link key={article.slug} href={`/blog/${article.slug}`}>
                <article className="hk-card group flex flex-col rounded-[14px] border border-border bg-card hover:border-primary/40 cursor-pointer h-full overflow-hidden">
                  <div className={`relative flex items-center justify-center h-[148px] bg-gradient-to-br ${thumb?.gradient ?? "from-muted/60 to-transparent"} overflow-hidden`}>
                    <ThumbIcon className={`absolute w-28 h-28 ${thumb?.iconColor ?? "text-muted-foreground"} ${thumb?.pattern ?? "opacity-[0.07]"} -rotate-6 translate-x-8`} aria-hidden="true" />
                    <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-xl bg-background/70 backdrop-blur-sm border border-border/60 shadow-sm">
                      <ThumbIcon className={`w-6 h-6 ${thumb?.iconColor ?? "text-muted-foreground"}`} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2.5 p-5 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${catColor}`}>
                        {article.categoryLabel}
                      </span>
                      <span className="flex items-center gap-1 text-[12px] text-muted-foreground shrink-0">
                        <Clock className="w-3 h-3" />
                        {article.readingTime} min
                      </span>
                    </div>
                    <h3 className="text-[15px] font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2 flex-1">
                      {article.description}
                    </p>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>

        <div className="mt-5 sm:hidden">
          <Link href="/blog">
            <span className="flex items-center justify-center gap-1.5 text-sm font-semibold text-primary py-2 cursor-pointer">
              <BookOpen className="w-4 h-4" />
              See all guides
            </span>
          </Link>
        </div>
      </section>

      {/* ── PRE-FOOTER CTA (full-bleed blue) ── */}
      <section className="hk-prefooter text-white">
        <div className="hk-container py-14 text-center">
          <h2 className="text-[24px] sm:text-[28px] font-extrabold tracking-[-0.01em] text-white">
            Ready to run your numbers?
          </h2>
          <p className="text-[15px] sm:text-[16px] text-white/80 mt-2 mb-6">
            No account needed. Start in seconds — everything stays in your browser.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/salary">
              <span className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] bg-white text-[#1d4ed8] font-bold text-[15px] cursor-pointer transition hover:-translate-y-0.5 shadow-lg shadow-black/20">
                <Wallet className="w-4 h-4" />
                {t("home.hero.ctaSalary")}
              </span>
            </Link>
            <Link href="/blog">
              <span className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] font-semibold text-[15px] text-white cursor-pointer transition hover:bg-white/10"
                style={{ border: "1.5px solid rgba(255,255,255,0.4)" }}>
                See all guides
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
