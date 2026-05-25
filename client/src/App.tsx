import { Switch, Route, Router, Link, useLocation } from "wouter";
import type { TranslationKey } from "@/lib/i18n";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { routes as seoRoutes, canonicalUrl } from "@/config/seo";
import { CalculatorContent } from "@/components/CalculatorContent";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";
import {
  Calculator,
  ChevronDown,
  FlaskConical,
  Scale,
  Sun,
  Moon,
  History,
  Home as HomeIcon,
  X,
  Menu,
  FileText,
  PiggyBank,
  Star,
  Wallet,
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useHistory } from "@/hooks/use-history";
import { useLocaleState, LocaleContext } from "@/hooks/use-locale";
import { useLocale } from "@/hooks/use-locale";
import { HistoryPanel } from "@/components/HistoryPanel";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { AdSlot } from "@/components/AdSlot";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { tools, toolBrand } from "@/config/tools";
import { initAnalytics, track } from "@/lib/analytics";

import HomePage from "@/pages/Home";
import NormalCalculator from "@/pages/NormalCalculator";
import ScientificCalculator from "@/pages/ScientificCalculator";
import FaraidCalculator from "@/pages/FaraidCalculator";
import WasiatGuide from "@/pages/WasiatGuide";
import ZakatCalculator from "@/pages/ZakatCalculator";
import SalaryCalculator from "@/pages/SalaryCalculator";
import EpfCalculator from "@/pages/EpfCalculator";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Partners from "@/pages/Partners";
import TermsOfUse from "@/pages/TermsOfUse";
import NotFound from "@/pages/not-found";

type NavItem = { href: string; labelKey: TranslationKey; icon: typeof HomeIcon };
type NavGroup = { labelKey: TranslationKey; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "nav.groupFinance",
    items: [
      { href: "/salary", labelKey: "nav.salary", icon: Wallet },
      { href: "/epf-retirement", labelKey: "nav.epf", icon: PiggyBank },
    ],
  },
  {
    labelKey: "nav.groupMath",
    items: [
      { href: "/normal", labelKey: "nav.basic", icon: Calculator },
      { href: "/scientific", labelKey: "nav.scientific", icon: FlaskConical },
    ],
  },
  {
    labelKey: "nav.groupIslamic",
    items: [
      { href: "/faraid", labelKey: "nav.faraid", icon: Scale },
      { href: "/zakat", labelKey: "nav.zakat", icon: Star },
      { href: "/wasiat", labelKey: "nav.wasiat", icon: FileText },
    ],
  },
];

const adsenseClient = import.meta.env.VITE_ADSENSE_CLIENT?.trim() || "";
const adsenseSlotTop = import.meta.env.VITE_ADSENSE_SLOT_TOP?.trim() || "";
const adsenseEnabled = import.meta.env.PROD && Boolean(adsenseClient);

function setMetaTag(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLinkTag(rel: string, href: string, hreflang?: string) {
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

function Layout() {
  const { theme, toggle } = useTheme();
  const history = useHistory();
  const { t, locale } = useLocale();
  const [showHistory, setShowHistory] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    const route = seoRoutes.find((r) => r.path === location) ?? seoRoutes[0];
    const copy = route.copy[locale] ?? route.copy.en;
    document.title = copy.title;
    document.documentElement.lang = locale;
    setMetaTag("name", "description", copy.description);
    if (copy.keywords) setMetaTag("name", "keywords", copy.keywords);

    const canonical = canonicalUrl(locale, route.path);
    setLinkTag("canonical", canonical);
    for (const alt of SUPPORTED_LOCALES) {
      setLinkTag("alternate", canonicalUrl(alt, route.path), alt);
    }
    setLinkTag("alternate", canonicalUrl("en", route.path), "x-default");

    setMetaTag("property", "og:title", copy.title);
    setMetaTag("property", "og:description", copy.description);
    setMetaTag("property", "og:url", canonical);
    setMetaTag("property", "og:type", route.slug === "home" ? "website" : "article");
    const ogLocale = locale === "ms" ? "ms_MY" : locale === "id" ? "id_ID" : "en_US";
    setMetaTag("property", "og:locale", ogLocale);
    setMetaTag("name", "twitter:title", copy.title);
    setMetaTag("name", "twitter:description", copy.description);

    track("pageview", { path: location });
  }, [location, locale]);

  useEffect(() => {
    if (!adsenseEnabled) return;
    let accountMeta = document.querySelector('meta[name="google-adsense-account"]');
    if (!accountMeta) {
      accountMeta = document.createElement("meta");
      accountMeta.setAttribute("name", "google-adsense-account");
      document.head.appendChild(accountMeta);
    }
    accountMeta.setAttribute("content", adsenseClient);

    const existing = document.querySelector(`script[data-adsense-client="${adsenseClient}"]`);
    if (existing) return;

    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.adsenseClient = adsenseClient;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`;
    document.head.appendChild(script);
  }, [adsenseEnabled]);

  const handleCalculate = useCallback(
    (calculator: "normal" | "scientific" | "faraid" | "salary" | "zakat" | "epf") =>
      (expression: string, result: string, url?: string) => {
        history.add(calculator, expression, result, url);
      },
    [history],
  );

  return (
    <div className={`min-h-screen flex flex-col${location === "/faraid" ? " theme-faraid" : ""}`}>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b safe-area-top">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="md:hidden p-2.5 rounded-xl hover:bg-muted active:bg-muted/80 transition-colors"
              aria-label={t("a11y.navToggle")}
              aria-expanded={showMobileNav}
              data-testid="button-mobile-menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/" className="flex items-center gap-2 group">
              <img src="/favicon.svg" alt="" className="w-8 h-8" />
              <div className="hidden sm:block">
                <span className="text-base font-bold block leading-tight gradient-text" data-testid="text-site-title">
                  {toolBrand.name}
                </span>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-0.5" data-testid="nav-desktop">
            {/* Home direct link */}
            <Link href="/">
              <span className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                location === "/" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}>
                <HomeIcon className="w-4 h-4" />
                {t("nav.home")}
              </span>
            </Link>

            {/* Category dropdowns */}
            {NAV_GROUPS.map((group) => {
              const isGroupActive = group.items.some((item) => item.href === location);
              return (
                <DropdownMenu key={group.labelKey}>
                  <DropdownMenuTrigger asChild>
                    <button className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer outline-none ${
                      isGroupActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}>
                      {t(group.labelKey)}
                      <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[180px]">
                    {group.items.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href}>
                          <span className={`flex items-center gap-2 w-full cursor-pointer ${item.href === location ? "text-primary" : ""}`}>
                            <item.icon className="w-4 h-4 shrink-0" />
                            {t(item.labelKey)}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            <LocaleSwitcher />
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2.5 rounded-xl transition-colors ${
                showHistory ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"
              }`}
              aria-label={t("a11y.historyToggle")}
              aria-expanded={showHistory}
              data-testid="button-toggle-history"
            >
              <History className="w-5 h-5" />
            </button>
            <button
              onClick={toggle}
              className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
              aria-label={theme === "dark" ? t("a11y.themeToggle.light") : t("a11y.themeToggle.dark")}
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {showMobileNav && <div className="md:hidden fixed inset-0 z-40 top-14" onClick={() => setShowMobileNav(false)} aria-hidden="true" />}

        {showMobileNav && (
          <div className="md:hidden border-t bg-background px-4 py-3 relative z-50" id="mobile-nav" data-testid="nav-mobile">
            {/* Home */}
            <Link href="/">
              <span onClick={() => setShowMobileNav(false)} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-base font-medium cursor-pointer transition-colors ${
                location === "/" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}>
                <HomeIcon className="w-5 h-5" />
                {t("nav.home")}
              </span>
            </Link>
            {/* Category groups */}
            {NAV_GROUPS.map((group) => (
              <div key={group.labelKey} className="mt-3">
                <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {t(group.labelKey)}
                </p>
                {group.items.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <span onClick={() => setShowMobileNav(false)} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-base font-medium cursor-pointer transition-colors ${
                      item.href === location ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}>
                      <item.icon className="w-5 h-5" />
                      {t(item.labelKey)}
                    </span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        )}
      </header>

      <div className="flex-1 flex w-full min-w-0">
        <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-8 max-w-full overflow-x-hidden pb-20 md:pb-8 lg:pb-8">
          <AdSlot id="global-top-ad" client={adsenseClient} slot={adsenseSlotTop} enabled={adsenseEnabled} className="mb-4" />
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/salary">
              <SalaryCalculator onCalculate={handleCalculate("salary")} />
              <CalculatorContent slug="salary" />
            </Route>
            <Route path="/epf-retirement">
              <EpfCalculator onCalculate={handleCalculate("epf")} />
              <CalculatorContent slug="epf" />
            </Route>
            <Route path="/normal">
              <NormalCalculator onCalculate={handleCalculate("normal")} />
              <CalculatorContent slug="normal" />
            </Route>
            <Route path="/scientific">
              <ScientificCalculator onCalculate={handleCalculate("scientific")} />
              <CalculatorContent slug="scientific" />
            </Route>
            <Route path="/faraid">
              <FaraidCalculator onCalculate={handleCalculate("faraid")} />
              <CalculatorContent slug="faraid" />
            </Route>
            <Route path="/wasiat">
              <WasiatGuide />
              <CalculatorContent slug="wasiat" />
            </Route>
            <Route path="/zakat">
              <ZakatCalculator onCalculate={handleCalculate("zakat")} />
              <CalculatorContent slug="zakat" />
            </Route>
            <Route path="/partners" component={Partners} />
            <Route path="/privacy" component={PrivacyPolicy} />
            <Route path="/terms" component={TermsOfUse} />
            <Route component={NotFound} />
          </Switch>
        </main>

        {showHistory && (
          <aside className="w-72 lg:w-80 border-l bg-card/50 p-4 hidden md:block overflow-y-auto max-h-[calc(100vh-3rem)]">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold">{t("common.history")}</h2>
              <button onClick={() => setShowHistory(false)} className="p-1.5 rounded-lg hover:bg-muted" data-testid="button-close-history">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <HistoryPanel entries={history.entries} onClear={history.clear} onRemove={history.remove} />
          </aside>
        )}
      </div>

      {showHistory && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowHistory(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-background border-l p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">{t("common.history")}</h2>
              <button onClick={() => setShowHistory(false)} className="p-2 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <HistoryPanel entries={history.entries} onClear={history.clear} onRemove={history.remove} />
          </div>
        </div>
      )}

      {/* Mobile bottom navigation — persistent quick access to key tools */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t safe-area-bottom"
        aria-label={t("a11y.navToggle")}
      >
        <div className="grid grid-cols-5 h-14">
          {([
            { href: "/", icon: HomeIcon, labelKey: "nav.home" as TranslationKey },
            { href: "/salary", icon: Wallet, labelKey: "nav.salary" as TranslationKey },
            { href: "/faraid", icon: Scale, labelKey: "nav.faraid" as TranslationKey },
            { href: "/normal", icon: Calculator, labelKey: "nav.basic" as TranslationKey },
          ] as { href: string; icon: typeof HomeIcon; labelKey: TranslationKey }[]).map(({ href, icon: Icon, labelKey }) => {
            const isActive = location === href;
            return (
              <Link key={href} href={href}>
                <span
                  className={`flex flex-col items-center justify-center gap-0.5 h-14 w-full cursor-pointer transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium leading-none">{t(labelKey)}</span>
                </span>
              </Link>
            );
          })}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex flex-col items-center justify-center gap-0.5 h-14 w-full cursor-pointer transition-colors ${
              showHistory ? "text-primary" : "text-muted-foreground"
            }`}
            aria-label={t("a11y.historyToggle")}
            aria-expanded={showHistory}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">{t("common.history")}</span>
          </button>
        </div>
      </nav>

      <footer className="border-t py-6 px-4 pb-20 md:pb-6 safe-area-bottom">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">{toolBrand.name}</span>
            <p>{t("brand.tagline")}</p>
            <p className="mt-1">
              {t("footer.builtBy")}{" "}
              <a
                href="https://amammustofa.com"
                target="_blank"
                rel="noopener noreferrer me"
                className="text-primary hover:underline underline-offset-2"
              >
                amammustofa.com
              </a>
            </p>
          </div>
          <nav className="flex items-center gap-3 flex-wrap justify-center" aria-label={t("footer.quickLinks")}>
            {tools.map((item) => (
              <Link key={item.href} href={item.href}>
                <span className="hover:text-foreground transition-colors cursor-pointer">{t(`tools.${item.slug}.name` as any)}</span>
              </Link>
            ))}
            <Link href="/partners">
              <span className="hover:text-foreground transition-colors cursor-pointer">{t("footer.partners")}</span>
            </Link>
            <Link href="/privacy">
              <span className="hover:text-foreground transition-colors cursor-pointer">{t("footer.privacy")}</span>
            </Link>
            <Link href="/terms">
              <span className="hover:text-foreground transition-colors cursor-pointer">{t("footer.terms")}</span>
            </Link>
          </nav>
        </div>
      </footer>

      <Analytics />
    </div>
  );
}

function LocaleAwareRouter({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();
  return <Router base={`/${locale}`}>{children}</Router>;
}

function App() {
  const localeState = useLocaleState();

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleContext.Provider value={localeState}>
        <TooltipProvider>
          <Toaster />
          <LocaleAwareRouter>
            <Layout />
          </LocaleAwareRouter>
        </TooltipProvider>
      </LocaleContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
