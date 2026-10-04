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
  BookOpen,
  Landmark,
  Receipt,
  HeartPulse,
  Car,
  Banknote,
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
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toolBrand } from "@/config/tools";
import { NAV_GROUPS } from "@/config/nav";
import { initAnalytics, track } from "@/lib/analytics";

import HomePage from "@/pages/Home";
import NormalCalculator from "@/pages/NormalCalculator";
import ScientificCalculator from "@/pages/ScientificCalculator";
import FaraidCalculator from "@/pages/FaraidCalculator";
import WasiatGuide from "@/pages/WasiatGuide";
import ZakatCalculator from "@/pages/ZakatCalculator";
import SalaryCalculator from "@/pages/SalaryCalculator";
import EpfCalculator from "@/pages/EpfCalculator";
import HousingLoanCalculator from "@/pages/HousingLoanCalculator";
import IncomeTaxCalculator from "@/pages/IncomeTaxCalculator";
import CarLoanCalculator from "@/pages/CarLoanCalculator";
import FixedDepositCalculator from "@/pages/FixedDepositCalculator";
import BmiCalculator from "@/pages/BmiCalculator";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfUse from "@/pages/TermsOfUse";
import Blog from "@/pages/Blog";
import BlogArticle from "@/pages/BlogArticle";
import NotFound from "@/pages/not-found";

type FooterLink = { labelKey?: TranslationKey; label?: string; href: string };

// The footer's calculator columns are derived from NAV_GROUPS (see the footer
// render below) so they always match the top nav. Only the non-calculator
// "Learn" column is defined here.
const FOOTER_LEARN_LINKS: FooterLink[] = [
  { labelKey: "nav.allGuides", href: "/blog" },
  { labelKey: "footer.privacy", href: "/privacy" },
  { labelKey: "footer.terms", href: "/terms" },
];

const adsenseClient = import.meta.env.VITE_ADSENSE_CLIENT?.trim() || "";
const adsenseSlotTop = import.meta.env.VITE_ADSENSE_SLOT_TOP?.trim() || "";
const adsenseEnabled = import.meta.env.PROD && Boolean(adsenseClient);

/** Padded, centred wrapper for pages that are NOT full-bleed redesigns
 *  (static/legal pages, 404). Restores the old contained layout now that
 *  <main> is layout-neutral. */
function PageContainer({ children }: { children: React.ReactNode }) {
  return <div className="hk-container py-6 md:py-10 max-w-[900px]">{children}</div>;
}

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
  const isCalculatorRoute = NAV_GROUPS.some((g) => g.items.some((i) => i.href === location));

  useEffect(() => {
    initAnalytics();
  }, []);

  // Close the mobile nav drawer whenever the route changes
  useEffect(() => {
    setShowMobileNav(false);
  }, [location]);

  // Reset scroll to the top on navigation so a new page opens at its top,
  // rather than inheriting the previous page's scroll position.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    // Blog article pages manage their own meta tags via the BlogArticle component
    if (/^\/blog\/.+/.test(location)) {
      track("pageview", { path: location });
      return;
    }
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
    (calculator: "normal" | "scientific" | "faraid" | "salary" | "zakat" | "epf" | "housing" | "tax" | "bmi" | "carloan" | "fd") =>
      (expression: string, result: string, url?: string) => {
        history.add(calculator, expression, result, url);
      },
    [history],
  );

  return (
    <div className={`min-h-screen flex flex-col${location === "/faraid" ? " theme-faraid" : ""}`}>
      {/* ── HEADER (56px, sticky): brand · Calculators · Guides · utilities ── */}
      <header className="sticky top-0 z-50 bg-background border-b border-border safe-area-top">
        <div className="hk-container h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8 min-w-0">
            <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label={`${toolBrand.name} — ${t("nav.home")}`}>
              <span className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-display font-semibold text-[13px] leading-none">
                HK
              </span>
              <span className="font-display text-[17px] font-semibold tracking-tight" data-testid="text-site-title">
                {toolBrand.name}
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1" data-testid="nav-desktop" aria-label="Main">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`flex items-center gap-1 px-3 h-9 rounded-md text-[15px] font-medium transition-colors ${
                      isCalculatorRoute ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    } hover:bg-muted data-[state=open]:bg-muted`}
                  >
                    {t("nav.calculators")}
                    <ChevronDown className="w-4 h-4 opacity-60" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[480px] p-3 grid grid-cols-2 gap-x-6 gap-y-3">
                  {NAV_GROUPS.map((group) => (
                    <div key={group.labelKey}>
                      <DropdownMenuLabel className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t(group.labelKey)}
                      </DropdownMenuLabel>
                      {group.items.map((item) => (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link href={item.href}>
                            <span className={`flex items-center gap-2.5 w-full cursor-pointer text-[15px] ${item.href === location ? "text-primary font-semibold" : ""}`}>
                              <item.icon className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                              {t(item.labelKey)}
                            </span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Link
                href="/blog"
                className={`px-3 h-9 inline-flex items-center rounded-md text-[15px] font-medium transition-colors hover:bg-muted ${
                  location.startsWith("/blog") ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("nav.guides")}
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-1">
            <div className="hidden md:block"><LocaleSwitcher /></div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`h-10 w-10 inline-flex items-center justify-center rounded-md transition-colors ${
                showHistory ? "bg-accent text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              aria-label={t("a11y.historyToggle")}
              aria-expanded={showHistory}
              data-testid="button-toggle-history"
            >
              <History className="w-[18px] h-[18px]" />
            </button>
            <button
              onClick={toggle}
              className="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label={theme === "dark" ? t("a11y.themeToggle.light") : t("a11y.themeToggle.dark")}
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>
            <button
              onClick={() => setShowMobileNav(true)}
              className="md:hidden h-10 w-10 inline-flex items-center justify-center rounded-md text-foreground hover:bg-muted transition-colors"
              aria-label={t("a11y.navToggle")}
              aria-expanded={showMobileNav}
              aria-controls="mobile-nav"
              data-testid="button-mobile-menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE MENU (the only mobile navigation; slides in from the right) ── */}
      {showMobileNav && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileNav(false)} aria-hidden="true" />
          <div className="hk-drawer absolute right-0 top-0 bottom-0 w-80 max-w-[88vw] bg-background border-l border-border flex flex-col safe-area-top safe-area-bottom" id="mobile-nav" data-testid="nav-mobile">
            <div className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
              <span className="font-display font-semibold">{t("nav.calculators")}</span>
              <button onClick={() => setShowMobileNav(false)} className="h-10 w-10 inline-flex items-center justify-center rounded-md hover:bg-muted" aria-label={t("a11y.navToggle")}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-3">
              {NAV_GROUPS.map((group) => (
                <div key={group.labelKey} className="mb-4">
                  <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t(group.labelKey)}
                  </p>
                  {group.items.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <span className={`flex items-center gap-3 px-3 min-h-[44px] rounded-md text-base cursor-pointer transition-colors ${
                        item.href === location ? "bg-accent text-primary font-semibold" : "hover:bg-muted"
                      }`}>
                        <item.icon className="w-[18px] h-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
                        {t(item.labelKey)}
                      </span>
                    </Link>
                  ))}
                </div>
              ))}
              <div className="border-t border-border pt-3">
                <Link href="/blog">
                  <span className={`flex items-center gap-3 px-3 min-h-[44px] rounded-md text-base cursor-pointer transition-colors ${
                    location.startsWith("/blog") ? "bg-accent text-primary font-semibold" : "hover:bg-muted"
                  }`}>
                    <BookOpen className="w-[18px] h-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
                    {t("nav.guides")}
                  </span>
                </Link>
              </div>
            </div>
            <div className="shrink-0 border-t border-border px-3 py-3 flex items-center justify-between">
              <LocaleSwitcher />
              <button
                onClick={toggle}
                className="h-10 w-10 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                aria-label={theme === "dark" ? t("a11y.themeToggle.light") : t("a11y.themeToggle.dark")}
              >
                {theme === "dark" ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN (layout-neutral; redesigned pages are full-bleed) ── */}
      <main className="flex-1 min-w-0 w-full">
        {/* Global top ad — only mounts in production when a slot is configured,
            so the full-bleed hero stays flush under the nav everywhere else. */}
        {adsenseEnabled && adsenseSlotTop && (
          <div className="hk-container pt-4">
            <AdSlot id="global-top-ad" client={adsenseClient} slot={adsenseSlotTop} enabled={adsenseEnabled} className="mb-2" />
          </div>
        )}
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
          <Route path="/housing-loan">
            <HousingLoanCalculator onCalculate={handleCalculate("housing")} />
            <CalculatorContent slug="housing" />
          </Route>
          <Route path="/income-tax">
            <IncomeTaxCalculator onCalculate={handleCalculate("tax")} />
            <CalculatorContent slug="tax" />
          </Route>
          <Route path="/car-loan">
            <CarLoanCalculator onCalculate={handleCalculate("carloan")} />
            <CalculatorContent slug="carloan" />
          </Route>
          <Route path="/fixed-deposit">
            <FixedDepositCalculator onCalculate={handleCalculate("fd")} />
            <CalculatorContent slug="fd" />
          </Route>
          <Route path="/bmi">
            <BmiCalculator onCalculate={handleCalculate("bmi")} />
            <CalculatorContent slug="bmi" />
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
          <Route path="/blog" component={Blog} />
          <Route path="/blog/:slug">
            {(params: { slug?: string }) => <BlogArticle slug={params?.slug ?? ""} />}
          </Route>
          <Route path="/privacy"><PageContainer><PrivacyPolicy /></PageContainer></Route>
          <Route path="/terms"><PageContainer><TermsOfUse /></PageContainer></Route>
          <Route><PageContainer><NotFound /></PageContainer></Route>
        </Switch>
      </main>

      {/* ── HISTORY (right-side overlay drawer, all sizes) ── */}
      {showHistory && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowHistory(false)} aria-hidden="true" />
          <div className="hk-drawer absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-background border-l border-border p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">{t("common.history")}</h2>
              <button onClick={() => setShowHistory(false)} className="p-2 rounded-lg hover:bg-muted" data-testid="button-close-history">
                <X className="w-5 h-5" />
              </button>
            </div>
            <HistoryPanel entries={history.entries} onClear={history.clear} onRemove={history.remove} />
          </div>
        </div>
      )}

      {/* ── FOOTER: brand, the same calculator groups as the header, then legal ── */}
      <footer className="border-t border-border bg-card safe-area-bottom">
        <div className="hk-container py-10 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-[1.4fr_repeat(5,1fr)] gap-x-6 gap-y-8">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="inline-flex items-center gap-2.5 mb-3">
                <span className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-display font-semibold text-[13px] leading-none">HK</span>
                <span className="font-display text-[17px] font-semibold tracking-tight">{toolBrand.name}</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px]">{t("brand.tagline")}</p>
            </div>
            {NAV_GROUPS.map((group) => (
              <div key={group.labelKey}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">{t(group.labelKey)}</p>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="text-sm text-foreground/80 hover:text-foreground hover:underline">
                        {t(item.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">{t("nav.guides")}</p>
              <ul className="space-y-2">
                {FOOTER_LEARN_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-foreground/80 hover:text-foreground hover:underline">
                      {link.labelKey ? t(link.labelKey) : link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} {toolBrand.name}. {t("footer.builtBy")}{" "}
              <a href="https://amammustofa.com" target="_blank" rel="noopener noreferrer me" className="underline hover:text-foreground">
                amammustofa.com
              </a>
            </p>
            <LocaleSwitcher />
          </div>
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
