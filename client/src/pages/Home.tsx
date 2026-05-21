import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, BadgeCheck, Globe, Lock, MapPin, Search, Sparkles, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdSlot } from "@/components/AdSlot";
import { toolBrand, tools } from "@/config/tools";
import { useLocale } from "@/hooks/use-locale";
import { useInView } from "@/hooks/use-in-view";
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

/** Wraps any section element with a scroll-triggered fade-up animation. */
function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`fade-up${inView ? " in-view" : ""} ${className}`}
      style={delay ? { "--delay": `${delay}ms` } as React.CSSProperties : undefined}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const { t } = useLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const heroRef = useRef<HTMLElement>(null);

  // Parallax: shift the hero slightly as the user scrolls down
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const onScroll = () => {
      const scrollY = window.scrollY;
      hero.style.setProperty("--parallax-y", `${scrollY * 0.25}px`);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const query = searchQuery.trim().toLowerCase();

  // Build filtered groups: only include groups that have at least one matching tool
  const filteredGroups = TOOL_GROUPS.map((group) => {
    const groupTools = tools.filter((tool) => group.hrefs.includes(tool.href as (typeof group.hrefs)[number]));
    if (!query) return { group, groupTools };
    const matched = groupTools.filter((tool) => {
      const name = t(`tools.${tool.slug}.name` as TranslationKey).toLowerCase();
      const desc = t(`tools.${tool.slug}.desc` as TranslationKey).toLowerCase();
      return name.includes(query) || desc.includes(query);
    });
    return { group, groupTools: matched };
  }).filter(({ groupTools }) => groupTools.length > 0);

  const hasNoResults = query.length > 0 && filteredGroups.length === 0;

  return (
    <div className="max-w-6xl mx-auto space-y-14">

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="hero-gradient rounded-3xl border p-6 sm:p-10 shadow-lg overflow-hidden"
        style={{ transform: "translateY(var(--parallax-y, 0px))", willChange: "transform" }}
      >
        <Badge className="mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500" variant="secondary">
          <Sparkles className="w-3.5 h-3.5 mr-1" />
          {t("home.hero.badge")}
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight animate-in fade-in slide-in-from-bottom-3 duration-700 delay-100">
          {toolBrand.name}
        </h1>
        <p className="mt-3 max-w-3xl text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-3 duration-700 delay-200">
          {t("home.hero.subtitle")}
        </p>
        <div className="mt-6 flex flex-wrap gap-3 animate-in fade-in slide-in-from-bottom-3 duration-700 delay-300">
          <Button asChild size="lg">
            <Link href="/salary">{t("home.hero.ctaSalary")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/faraid">{t("home.hero.ctaFaraid")}</Link>
          </Button>
        </div>
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t pt-6 animate-in fade-in duration-700 delay-500">
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

      {/* ── Search ── */}
      <FadeUp>
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("home.search.placeholder")}
            className="pl-9 pr-9"
            aria-label={t("home.search.placeholder")}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              aria-label={t("home.search.clear")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </FadeUp>

      {/* ── Tools by category ── */}
      {hasNoResults ? (
        <FadeUp>
          <p className="text-center text-muted-foreground py-10">{t("home.search.noResults")}</p>
        </FadeUp>
      ) : (
        <div className="space-y-10">
          {filteredGroups.map(({ group, groupTools }) => (
            <FadeUp key={group.labelKey}>
              <section>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">{t(group.labelKey)}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{t(group.descKey)}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {groupTools.map((tool, i) => (
                    <div
                      key={tool.slug}
                      className="fade-up in-view"
                      style={{ "--delay": `${i * 80}ms`, transitionDelay: `${i * 80}ms` } as React.CSSProperties}
                    >
                      <Link href={tool.href}>
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
                    </div>
                  ))}
                </div>
              </section>
            </FadeUp>
          ))}
        </div>
      )}

      {adsenseEnabled && adsenseSlotHome ? (
        <AdSlot slot={adsenseSlotHome} className="mx-auto" />
      ) : null}

      {/* ── Why HelloKalku ── */}
      <FadeUp>
        <section>
          <h2 className="text-2xl font-semibold">{t("home.features.title")}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, titleKey, bodyKey }, i) => (
              <div
                key={titleKey}
                className="fade-up in-view rounded-xl border bg-card p-5 space-y-2"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-5 h-5 text-primary shrink-0" />
                  <h3 className="font-semibold text-sm">{t(titleKey)}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(bodyKey)}</p>
              </div>
            ))}
          </div>
        </section>
      </FadeUp>

      {/* ── FAQ ── */}
      <FadeUp>
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
      </FadeUp>

      <FadeUp>
        <p className="text-sm text-muted-foreground text-center pb-2">
          <Link href="/partners" className="hover:text-foreground underline-offset-2 hover:underline">
            {t("home.hero.partnersLink")}
          </Link>
        </p>
      </FadeUp>
    </div>
  );
}
