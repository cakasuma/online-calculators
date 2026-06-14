import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight, BadgeCheck, BookOpen, Clock, Globe, Lock, MapPin,
  PiggyBank, Scale, Search, Sparkles, TrendingUp, Wallet, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdSlot } from "@/components/AdSlot";
import { toolBrand, tools } from "@/config/tools";
import { blogArticles } from "@/config/blog";
import { useLocale } from "@/hooks/use-locale";
import { useInView } from "@/hooks/use-in-view";
import { useHistory } from "@/hooks/use-history";
import type { TranslationKey } from "@/lib/i18n";

const adsenseClient = import.meta.env.VITE_ADSENSE_CLIENT?.trim() || "";
const adsenseSlotHome = import.meta.env.VITE_ADSENSE_SLOT_HOME?.trim() || "";
const adsenseEnabled = import.meta.env.PROD && Boolean(adsenseClient);

/* ── Tool category config ─────────────────────────────────────────────────── */
const TOOL_GROUPS = [
  {
    labelKey: "nav.groupFinance" as TranslationKey,
    descKey: "home.category.Finance.desc" as TranslationKey,
    hrefs: ["/salary", "/epf-retirement"],
    iconBg: "bg-blue-50 dark:bg-blue-950/50",
    iconColor: "text-blue-700 dark:text-blue-400",
    hoverBorder: "hover:border-blue-300/70 dark:hover:border-blue-700/60",
    accentLine: "bg-blue-500",
  },
  {
    labelKey: "nav.groupMath" as TranslationKey,
    descKey: "home.category.Math.desc" as TranslationKey,
    hrefs: ["/normal", "/scientific"],
    iconBg: "bg-orange-50 dark:bg-orange-950/50",
    iconColor: "text-orange-600 dark:text-orange-400",
    hoverBorder: "hover:border-orange-300/70 dark:hover:border-orange-700/60",
    accentLine: "bg-orange-500",
  },
  {
    labelKey: "nav.groupIslamic" as TranslationKey,
    descKey: "home.category.Islamic.desc" as TranslationKey,
    hrefs: ["/faraid", "/zakat", "/wasiat"],
    iconBg: "bg-emerald-50 dark:bg-emerald-950/50",
    iconColor: "text-emerald-700 dark:text-emerald-400",
    hoverBorder: "hover:border-emerald-300/70 dark:hover:border-emerald-700/60",
    accentLine: "bg-emerald-500",
  },
] as const;

/* badge colours per tool slug */
const BADGE_VARIANTS: Record<string, string> = {
  popular: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  new:     "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
};

const FEATURES = [
  { icon: BadgeCheck, titleKey: "home.features.accurate.title", bodyKey: "home.features.accurate.body",    iconColor: "text-emerald-700 dark:text-emerald-400", iconBg: "bg-emerald-50 dark:bg-emerald-950/50" },
  { icon: MapPin,     titleKey: "home.features.malaysia.title", bodyKey: "home.features.malaysia.body",    iconColor: "text-blue-700 dark:text-blue-400",       iconBg: "bg-blue-50 dark:bg-blue-950/50" },
  { icon: Globe,      titleKey: "home.features.multilingual.title", bodyKey: "home.features.multilingual.body", iconColor: "text-orange-600 dark:text-orange-400", iconBg: "bg-orange-50 dark:bg-orange-950/50" },
  { icon: Lock,       titleKey: "home.features.private.title",  bodyKey: "home.features.private.body",     iconColor: "text-amber-600 dark:text-amber-400",     iconBg: "bg-amber-50 dark:bg-amber-950/50" },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  "Salary & Tax":      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "EPF & Retirement":  "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  "Islamic Finance":   "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

type LucideIcon = typeof Wallet;
const GUIDE_THUMBNAILS: Record<string, { icon: LucideIcon; gradient: string; iconColor: string }> = {
  "Salary & Tax":     { icon: Wallet,   gradient: "from-blue-500/20 via-blue-400/10 to-transparent",   iconColor: "text-blue-500 dark:text-blue-400" },
  "EPF & Retirement": { icon: PiggyBank, gradient: "from-green-500/20 via-green-400/10 to-transparent", iconColor: "text-green-600 dark:text-green-400" },
  "Islamic Finance":  { icon: Scale,    gradient: "from-amber-500/20 via-amber-400/10 to-transparent", iconColor: "text-amber-600 dark:text-amber-400" },
};

const FEATURED_ARTICLES = blogArticles.slice(0, 6);

const CALC_HREF: Record<string, string> = {
  salary: "/salary", epf: "/epf-retirement", normal: "/normal",
  scientific: "/scientific", faraid: "/faraid", zakat: "/zakat", wasiat: "/wasiat",
};

function FadeIn({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={`fade-in-section${inView ? " in-view" : ""} ${className}`}>
      {children}
    </div>
  );
}

/* ── Hero search bar ──────────────────────────────────────────────────────── */
function ToolSearchBar() {
  const { t } = useLocale();
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

  function clear() { setQuery(""); setOpen(false); inputRef.current?.focus(); }

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-4 h-4 text-white/40 pointer-events-none shrink-0" />
        <input
          ref={inputRef}
          type="search"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { if (q) setOpen(true); }}
          onKeyDown={(e) => { if (e.key === "Escape") clear(); }}
          placeholder={t("home.search.placeholder")}
          aria-label={t("home.search.placeholder")}
          aria-expanded={open && (results.length > 0 || q.length > 0)}
          aria-haspopup="listbox"
          role="combobox"
          aria-autocomplete="list"
          className="w-full h-12 rounded-xl pl-11 pr-10 text-sm outline-none transition
            bg-white/10 border border-white/15 text-white placeholder:text-white/40
            focus:bg-white/15 focus:border-white/40
            backdrop-blur-sm"
        />
        {query && (
          <button
            onClick={clear}
            aria-label={t("home.search.clear")}
            className="absolute right-3 rounded p-1 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && q && (
        <div
          role="listbox"
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

/* ── Salary preview card (hero right column) ──────────────────────────────── */
function SalaryPreviewCard() {
  return (
    <div
      className="hidden md:block rounded-[20px] p-6 shrink-0 w-[360px]"
      style={{
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(16px)",
      }}
      aria-hidden="true"
    >
      {/* Card header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: "linear-gradient(135deg, #3b82f6, #2dd4bf)" }}>
          💼
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold text-sm leading-tight">Salary Calculator</p>
          <p className="text-white/50 text-xs">2026 tax rates</p>
        </div>
        <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.2)", color: "#4ade80" }}>
          Live
        </span>
      </div>

      {/* Mini input */}
      <div className="flex gap-2 mb-5">
        <div className="flex-1 rounded-lg px-3 py-2.5 text-sm" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <span className="block text-white/35 text-[10px] mb-0.5">Monthly Gross</span>
          <span className="text-white">RM 6,000</span>
        </div>
        <div className="rounded-lg px-3 py-2.5 text-sm font-semibold text-white" style={{ background: "#2563eb" }}>
          Calculate
        </div>
      </div>

      {/* Result rows */}
      {[
        { label: "EPF (11%)",    value: "– RM 660",   cls: "text-red-400" },
        { label: "SOCSO",        value: "– RM 29.75",  cls: "text-red-400" },
        { label: "Income Tax",   value: "– RM 98.08",  cls: "text-red-400" },
        { label: "EIS",          value: "– RM 11.90",  cls: "text-red-400" },
      ].map(({ label, value, cls }) => (
        <div key={label} className="flex justify-between items-center py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-white/60 text-[13px]">{label}</span>
          <span className={`font-semibold text-[13px] ${cls}`}>{value}</span>
        </div>
      ))}
      <div className="flex justify-between items-center pt-3">
        <span className="text-white/60 text-[13px]">Take-Home Pay</span>
        <span className="font-bold text-[18px]" style={{ color: "#4ade80" }}>RM 5,200.27</span>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function HomePage() {
  const { t } = useLocale();
  const { entries: historyEntries } = useHistory();
  const recentEntries = historyEntries.slice(0, 3);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const filterGroups = [
    { key: "All", label: "All" },
    ...TOOL_GROUPS.map((g) => ({ key: g.labelKey, label: t(g.labelKey) })),
  ];

  const filteredGroups = activeFilter === "All"
    ? TOOL_GROUPS
    : TOOL_GROUPS.filter((g) => g.labelKey === activeFilter);

  return (
    <div className="max-w-[1200px] mx-auto space-y-0">

      {/* ── HERO (dark gradient, full-width) ──────────────────────────────── */}
      <section className="hk-hero-bg -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 px-5 sm:px-8 py-16 md:py-20 mb-14">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid md:grid-cols-[1fr_360px] gap-10 md:gap-16 items-center">
            {/* Left: text */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 mb-5 px-3 py-1 rounded-full text-[12px] font-semibold uppercase tracking-wider"
                style={{ background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.3)", color: "#93c5fd" }}>
                <Sparkles className="w-3 h-3" />
                {t("home.hero.badge")}
              </div>

              <h1 className="text-[36px] md:text-[52px] font-extrabold leading-[1.1] tracking-[-0.02em] text-white mb-5">
                Malaysian calculators,{" "}
                <span style={{ background: "linear-gradient(90deg,#60a5fa,#2dd4bf)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  done right
                </span>
              </h1>

              <p className="text-[17px] leading-[1.65] mb-8 max-w-[480px]" style={{ color: "#93c5fd" }}>
                {t("home.hero.subtitle")}
              </p>

              {/* Search */}
              <div className="mb-6">
                <ToolSearchBar />
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 mb-10">
                <Link href="/salary">
                  <span className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] bg-white text-[#1d4ed8] font-bold text-[15px] cursor-pointer transition hover:-translate-y-0.5 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/25">
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

              {/* Stats row */}
              <div className="flex gap-6 md:gap-8 flex-wrap">
                {[
                  { value: "7",    label: t("home.stats.tools") },
                  { value: "3",    label: t("home.stats.locales") },
                  { value: "2026", label: t("home.stats.updated") },
                  { value: "100%", label: t("home.stats.free") },
                ].map(({ value, label }, i) => (
                  <div key={label} className="flex items-center gap-4">
                    {i > 0 && <div className="w-px h-8 self-stretch" style={{ background: "rgba(255,255,255,0.15)" }} />}
                    <div>
                      <div className="text-[26px] font-extrabold text-white leading-none">{value}</div>
                      <div className="text-[11px] uppercase tracking-[0.04em] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: live salary preview card */}
            <SalaryPreviewCard />
          </div>
        </div>
      </section>

      {/* ── RECENTLY USED ─────────────────────────────────────────────────── */}
      {recentEntries.length > 0 && (
        <FadeIn className="mb-10">
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

      {/* ── TOOLS SECTION ─────────────────────────────────────────────────── */}
      <FadeIn className="mb-14">
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-[12px] font-bold text-[#2563eb] uppercase tracking-[0.06em] mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] inline-block" />
                All Tools
              </p>
              <h2 className="text-[22px] font-bold text-foreground tracking-tight">
                Malaysian Calculators
              </h2>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-7 overflow-x-auto pb-1 -mx-1 px-1">
            {filterGroups.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`hk-filter-tab shrink-0${activeFilter === key ? " active" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tool cards */}
          <div className="space-y-10">
            {filteredGroups.map((group) => {
              const groupTools = tools.filter((tool) =>
                (group.hrefs as readonly string[]).includes(tool.href),
              );
              return (
                <div key={group.labelKey}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-1 h-7 rounded-full ${group.accentLine}`} />
                    <div>
                      <h3 className="text-[16px] font-semibold">{t(group.labelKey)}</h3>
                      <p className="text-[13px] text-muted-foreground">{t(group.descKey)}</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {groupTools.map((tool) => (
                      <Link key={tool.slug} href={tool.href}>
                        <div className={`hk-tool-card group relative flex flex-col gap-3 p-5 bg-card rounded-[14px] border border-border cursor-pointer ${group.hoverBorder} h-full`}>
                          {/* Top row: icon + badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0 ${group.iconBg}`}>
                              <tool.icon className={`w-5 h-5 ${group.iconColor}`} />
                            </div>
                            {tool.badge && (
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${BADGE_VARIANTS[tool.badge] ?? "bg-muted text-muted-foreground"}`}>
                                {t(`tools.${tool.slug}.badge` as TranslationKey)}
                              </span>
                            )}
                          </div>

                          <div>
                            <p className="font-bold text-[15px] text-foreground mb-1.5 leading-snug">
                              {t(`tools.${tool.slug}.name` as TranslationKey)}
                            </p>
                            <p className="text-[13px] text-muted-foreground leading-relaxed">
                              {t(`tools.${tool.slug}.desc` as TranslationKey)}
                            </p>
                          </div>

                          {/* CTA pill */}
                          <div className="mt-auto">
                            <span className="hk-tool-cta">
                              {t("home.featured.openTool")}
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </FadeIn>

      {adsenseEnabled && adsenseSlotHome ? (
        <AdSlot slot={adsenseSlotHome} className="mx-auto mb-14" />
      ) : null}

      {/* ── WHY HELLOKALKU (dark section) ─────────────────────────────────── */}
      <FadeIn>
        <section className="-mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 px-5 sm:px-8 py-16 mb-14"
          style={{ background: "#111827" }}>
          <div className="max-w-[1200px] mx-auto">
            <div className="mb-8">
              <p className="text-[12px] font-bold uppercase tracking-[0.06em] mb-1" style={{ color: "#3b82f6" }}>
                Why HelloKalku
              </p>
              <h2 className="text-[22px] font-bold text-white">{t("home.features.title")}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(({ icon: Icon, titleKey, bodyKey, iconColor, iconBg }) => (
                <div key={String(titleKey)} className="rounded-2xl p-5 space-y-3"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-[14px] text-white">{t(titleKey)}</h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{t(bodyKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── GUIDES ────────────────────────────────────────────────────────── */}
      <FadeIn className="mb-14">
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-[12px] font-bold text-[#2563eb] uppercase tracking-[0.06em] mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] inline-block" />
                Guides
              </p>
              <h2 className="text-[22px] font-bold text-foreground tracking-tight">Guides &amp; Education</h2>
              <p className="text-[13px] text-muted-foreground mt-0.5">In-depth articles to help you understand the numbers</p>
            </div>
            <Link href="/blog">
              <span className="hidden sm:flex items-center gap-1 text-[14px] font-semibold text-[#2563eb] hover:underline underline-offset-2 cursor-pointer shrink-0">
                See all
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_ARTICLES.map((article) => {
              const catColor = CATEGORY_COLORS[article.categoryLabel] ?? "bg-muted text-muted-foreground";
              const thumb = GUIDE_THUMBNAILS[article.categoryLabel];
              const ThumbIcon = thumb?.icon ?? BookOpen;
              return (
                <Link key={article.slug} href={`/blog/${article.slug}`}>
                  <article className="group flex flex-col rounded-[14px] border bg-card hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full overflow-hidden">
                    {/* Thumbnail */}
                    <div className={`relative flex items-center justify-center h-[148px] bg-gradient-to-br ${thumb?.gradient ?? "from-muted/60 to-transparent"} border-b border-border/50 overflow-hidden`}>
                      <ThumbIcon className={`absolute w-28 h-28 ${thumb?.iconColor ?? "text-muted-foreground"} opacity-[0.07] -rotate-6 translate-x-10`} aria-hidden="true" />
                      <div className="relative z-10 flex items-center justify-center w-11 h-11 rounded-xl bg-background/70 backdrop-blur-sm border border-border/60 shadow-sm text-2xl">
                        <ThumbIcon className={`w-5 h-5 ${thumb?.iconColor ?? "text-muted-foreground"}`} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5 p-4 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${catColor}`}>
                          {article.categoryLabel}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                          <Clock className="w-3 h-3" />
                          {article.readingTime} min
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">
                        {article.description}
                      </p>
                      <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity mt-auto pt-1">
                        Read guide <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>

          <div className="mt-4 sm:hidden">
            <Link href="/blog">
              <span className="flex items-center justify-center gap-1.5 text-sm font-medium text-primary py-2 cursor-pointer">
                <BookOpen className="w-4 h-4" />
                See all guides
              </span>
            </Link>
          </div>
        </section>
      </FadeIn>

      <FadeIn className="pb-4">
        <p className="text-sm text-muted-foreground text-center">
          <Link href="/partners" className="hover:text-foreground underline-offset-2 hover:underline">
            {t("home.hero.partnersLink")}
          </Link>
        </p>
      </FadeIn>
    </div>
  );
}
