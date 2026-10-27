import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, BookOpen, Clock, PiggyBank, Scale, ShieldCheck, Wallet } from "lucide-react";
import { RatesVerified } from "@/components/RatesVerified";
import { tools } from "@/config/tools";
import { blogArticles } from "@/config/blog";
import { useLocale } from "@/hooks/use-locale";
import { useHistory } from "@/hooks/use-history";
import { calculateSalary } from "@/lib/malaysianPayroll";
import { track } from "@/lib/analytics";
import type { TranslationKey } from "@/lib/i18n";


const PRIMARY_STEPS = [
  { href: "/salary", slug: "salary-calculator", stepKey: "home.step.salary" },
  { href: "/income-tax", slug: "income-tax-calculator", stepKey: "home.step.tax" },
  { href: "/epf-retirement", slug: "epf-calculator", stepKey: "home.step.epf" },
] as const;
const SECONDARY_HREFS = ["/housing-loan", "/car-loan", "/fixed-deposit"];
const ISLAMIC_HREFS = ["/faraid", "/zakat", "/wasiat"];
const MORE_HREFS = ["/normal", "/scientific", "/bmi", "/currency-converter"];

const toolByHref = (href: string) => tools.find((tool) => tool.href === href);

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

const money = (n: number) =>
  `RM ${new Intl.NumberFormat("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`;

/** Worked example computed by the same engine as the salary calculator. */
function HeroPreviewCard() {
  const { t } = useLocale();
  const r = calculateSalary({
    monthlySalary: 5000,
    annualBonus: 0,
    otherRelief: 0,
    epfRate: 11,
    workerType: "malaysian",
    residentStatus: "resident",
    includeSkbbk: true,
  });
  const rows = [
    { label: "EPF (11%)", value: r.monthlyEpf },
    { label: "SOCSO", value: r.monthlySocso },
    { label: "EIS", value: r.monthlyEis },
    { label: "SKBBK (Lindung 24 Jam)", value: r.monthlySkbbk },
    { label: "PCB (Income Tax)", value: r.monthlyTax },
  ];
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm" aria-label={t("home.preview.caption")}>
      <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-dashed border-border pb-4">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("home.preview.caption")}</div>
          <div className="mt-1 font-display text-lg font-semibold">RM 5,000 {t("home.preview.salary")}</div>
        </div>
        <Wallet className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      </div>
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between py-2 text-sm">
          <span className="text-muted-foreground">{row.label}</span>
          <span className="font-medium tabular-nums">− {money(row.value)}</span>
        </div>
      ))}
      <div className="mt-3 flex items-baseline justify-between border-t border-border pt-4">
        <span className="text-sm font-semibold">{t("salary.takeHomePay")}</span>
        <span className="font-display text-2xl font-bold tabular-nums text-primary">{money(r.monthlyNet)}</span>
      </div>
    </div>
  );
}

function ToolCard({ href, compact = false }: { href: string; compact?: boolean }) {
  const { t } = useLocale();
  const tool = toolByHref(href);
  if (!tool) return null;
  return (
    <Link href={tool.href}>
      <div className="hk-card group flex h-full cursor-pointer items-start gap-3 rounded-[14px] border border-border bg-card p-4 hover:border-primary/40">
        <div className="w-10 h-10 shrink-0 rounded-[10px] bg-primary/10 flex items-center justify-center">
          <tool.icon className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[15px] leading-snug">{t(`tools.${tool.slug}.name` as TranslationKey)}</p>
          {!compact && (
            <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
              {t(`tools.${tool.slug}.desc` as TranslationKey)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { t } = useLocale();
  const [, setLocation] = useLocation();
  const { entries: historyEntries } = useHistory();
  const recentEntries = historyEntries.slice(0, 3);
  const [gross, setGross] = useState("");

  function startSalary(event: React.FormEvent) {
    event.preventDefault();
    const amount = Number(gross.replace(/[,\s]/g, ""));
    track("home_hero_submit", { hasAmount: amount > 0 });
    setLocation(amount > 0 ? `/salary?gross=${Math.round(amount)}` : "/salary");
  }

  return (
    <div className="w-full">
      <section className="border-b border-border bg-card/40">
        <div className="hk-container py-16 md:py-20">
          <div className="grid md:grid-cols-[1fr_440px] gap-10 lg:gap-16 items-center">
            <div className="min-w-0">
              <h1 className="font-display text-[32px] sm:text-[42px] md:text-[48px] font-semibold leading-[1.1] tracking-tight text-foreground">
                {t("home.hero.h1")}
              </h1>
              <p className="mt-5 max-w-[520px] text-[16px] sm:text-[17px] leading-[1.6] text-muted-foreground">
                {t("home.hero.sub")}
              </p>

              <form onSubmit={startSalary} className="mt-7 flex max-w-[520px] flex-col gap-3 sm:flex-row">
                <label className="sr-only" htmlFor="home-gross">{t("home.hero.inputLabel")}</label>
                <input
                  id="home-gross"
                  inputMode="decimal"
                  value={gross}
                  onChange={(e) => setGross(e.target.value)}
                  placeholder={t("home.hero.inputLabel")}
                  className="flex-1 h-12 rounded-lg border border-input bg-background px-4 text-base placeholder:text-muted-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 h-12 rounded-lg bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  {t("home.hero.cta")}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              <p className="mt-3 text-[13px] text-muted-foreground">{t("home.hero.hint")}</p>
            </div>

            <div>
              <HeroPreviewCard />
            </div>
          </div>
        </div>
      </section>

      <section className="hk-container pt-14">
        <h2 className="text-[22px] sm:text-[26px] font-bold tracking-tight">{t("home.steps.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("home.steps.subtitle")}</p>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {PRIMARY_STEPS.map((step, i) => {
            const tool = toolByHref(step.href);
            if (!tool) return null;
            return (
              <li key={step.href}>
                <Link href={step.href}>
                  <div className="hk-card group flex h-full cursor-pointer flex-col gap-3 rounded-[14px] border border-border bg-card p-5 hover:border-primary/40">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
                      <tool.icon className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-[16px] font-bold leading-snug">{t(`${step.stepKey}.title` as TranslationKey)}</p>
                    <p className="text-[13px] leading-relaxed text-muted-foreground">{t(`${step.stepKey}.desc` as TranslationKey)}</p>
                    <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-[13px] font-semibold text-primary">
                      {t(`tools.${tool.slug}.name` as TranslationKey)}
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
        <div className="mt-4"><RatesVerified sources={["kwsp", "perkeso", "lhdn"]} /></div>
      </section>

      {/* ── Recently used (contained) ── */}
      {recentEntries.length > 0 && (
        <>
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
        </>
      )}

      <section className="hk-container py-14 space-y-12">
        <div>
          <h2 className="text-[20px] sm:text-[22px] font-bold tracking-tight">{t("home.secondary.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("home.secondary.desc")}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SECONDARY_HREFS.map((href) => <ToolCard key={href} href={href} />)}
          </div>
        </div>

        <div>
          <h2 className="text-[20px] sm:text-[22px] font-bold tracking-tight">{t("home.islamic.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("home.islamic.desc")}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ISLAMIC_HREFS.map((href) => <ToolCard key={href} href={href} />)}
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <Scale className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{t("home.islamic.note")}</span>
          </p>
        </div>

        <div className="rounded-2xl border bg-muted/30 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-[18px] font-bold">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
            {t("home.method.title")}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t("home.method.body")}</p>
          <Link href="/about">
            <span className="mt-3 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-primary hover:underline">
              {t("home.method.link")} <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
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

      <section className="hk-container pb-14">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("home.more.title")}</p>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {MORE_HREFS.map((href) => {
            const tool = toolByHref(href);
            return tool ? (
              <Link key={href} href={href}>
                <span className="cursor-pointer text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
                  {t(`tools.${tool.slug}.name` as TranslationKey)}
                </span>
              </Link>
            ) : null;
          })}
        </div>
      </section>
    </div>
  );
}
